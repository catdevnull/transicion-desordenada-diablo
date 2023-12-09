import { mkdir, open, writeFile } from "node:fs/promises";
import { Agent, fetch, request, setGlobalDispatcher } from "undici";
import { join, normalize } from "node:path";
import pLimit from "p-limit";
import { targetsPorDefecto, userAgent } from "./config.js";
import { generateDataJsonFromCkan } from "./ckan_to_datajson.js";

setGlobalDispatcher(
  new Agent({
    pipelining: 0,
  })
);

/** key es host
 * @type {Map<string, import("p-limit").LimitFunction>} */
const limiters = new Map();
const nThreads = process.env.N_THREADS ? parseInt(process.env.N_THREADS) : 8;

class StatusCodeError extends Error {
  /**
   * @param {number} code
   */
  constructor(code) {
    super(`Status code: ${code}`);
    this.code = code;
  }
}
class TooManyRedirectsError extends Error {}
let urls = process.argv.slice(2);
if (urls.length < 1) {
  urls = targetsPorDefecto;
}
/** @typedef {{type: "data.json" | "ckan"; url: string;}} Target */

/** @type {Target[]} */
const targets = urls.map((url) => {
  if (url.startsWith("datajson+")) {
    return { type: "data.json", url: url.slice("datajson+".length) };
  } else if (url.startsWith("ckan+")) {
    return { type: "ckan", url: url.slice("ckan+".length) };
  } else return { type: "data.json", url };
});
for (const target of targets)
  downloadFromData(target).catch((error) =>
    console.error(`${target} FALLÓ CON`, error)
  );

/**
 * @param {Target} target
 */
async function downloadFromData(target) {
  const outputPath = generateOutputPath(target.url);
  let json;
  if (target.type === "ckan") {
    json = await generateDataJsonFromCkan(target.url);
  } else if (target.type === "data.json") {
    const jsonRes = await fetch(target.url);
    json = await jsonRes.json();
  }

  // prettier-ignore
  const parsed = /** @type {{ dataset: Dataset[] }} */(json)
  await mkdir(outputPath, { recursive: true });
  await writeFile(join(outputPath, "data.json"), JSON.stringify(parsed));
  await writeFile(join(outputPath, "url.txt"), `${target.type}+${target.url}`);
  const errorFile = (
    await open(join(outputPath, "errors.jsonl"), "w")
  ).createWriteStream();
  try {
    /** @type {DownloadJob[]} */
    const jobs = parsed.dataset.flatMap((dataset) =>
      dataset.distribution
        .filter((dist) => {
          try {
            patchUrl(new URL(dist.downloadURL));
            return true;
          } catch (error) {
            errorFile.write(
              JSON.stringify(encodeError({ dataset, dist }, error)) + "\n"
            );
            return false;
          }
        })
        .map((dist) => ({
          dataset,
          dist,
          url: patchUrl(new URL(dist.downloadURL)),
          outputPath,
          attempts: 0,
        }))
    );
    const totalJobs = jobs.length;
    let nFinished = 0;
    let nErrors = 0;

    // por las dudas verificar que no hayan archivos duplicados
    chequearIdsDuplicados(jobs, outputPath);

    shuffleArray(jobs);

    const promises = jobs.map((job) => {
      let limit = limiters.get(job.url.host);
      if (!limit) {
        limit = pLimit(nThreads);
        limiters.set(job.url.host, limit);
      }
      return limit(async () => {
        try {
          await downloadDistWithRetries(job);
        } catch (error) {
          errorFile.write(JSON.stringify(encodeError(job, error)) + "\n");
          nErrors++;
        } finally {
          nFinished++;
        }
      });
    });

    process.stderr.write(`info[${outputPath}]: 0/${totalJobs} done\n`);
    const interval = setInterval(() => {
      process.stderr.write(
        `info[${outputPath}]: ${nFinished}/${totalJobs} done\n`
      );
    }, 30000);
    await Promise.all(promises);
    clearInterval(interval);
    if (nErrors > 0)
      console.error(`${outputPath}: Finished with ${nErrors} errors`);
  } finally {
    errorFile.close();
  }
}

/**
 * @param {string} jsonUrlString
 */
export function generateOutputPath(jsonUrlString) {
  const jsonUrl = new URL(jsonUrlString);
  const outputPath = `${jsonUrl.host}${jsonUrl.pathname}`.replaceAll("/", "_");
  return outputPath;
}

/**
 * @argument {DownloadJob} job
 * @argument {number} attempts
 * @returns {Promise<void>}
 */
async function downloadDistWithRetries(job, attempts = 0) {
  const { url } = job;
  try {
    await downloadDist(job);
  } catch (error) {
    // algunos servidores usan 403 como coso para decir "calmate"
    // intentar hasta 15 veces con 15 segundos de por medio
    if (
      error instanceof StatusCodeError &&
      error.code === 403 &&
      url.host === "minsegar-my.sharepoint.com" &&
      attempts < 15
    ) {
      await wait(15000);
      return await downloadDistWithRetries(job, attempts + 1);
    }
    // si no fue un error de http, reintentar hasta 3 veces con 5 segundos de por medio
    else if (
      !(error instanceof StatusCodeError) &&
      !(error instanceof TooManyRedirectsError) &&
      attempts < 3
    ) {
      await wait(5000 + Math.random() * 10000);
      return await downloadDistWithRetries(job, attempts + 1);
    } else throw error;
  }
}

/**
 * @argument {DownloadJob} job
 */
async function downloadDist({ dist, dataset, url, outputPath }) {
  // sharepoint no le gusta compartir a bots lol
  const spoofUserAgent = url.host.endsWith("sharepoint.com");

  const res = await request(url.toString(), {
    maxRedirections: 20,
    headers: {
      "User-Agent": spoofUserAgent
        ? "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0"
        : userAgent,
    },
  });
  if (res.statusCode >= 300 && res.statusCode <= 399)
    throw new TooManyRedirectsError();
  if (res.statusCode < 200 || res.statusCode > 299) {
    throw new StatusCodeError(res.statusCode);
  }

  const fileDirPath = join(
    outputPath,
    sanitizeSuffix(dataset.identifier),
    sanitizeSuffix(dist.identifier)
  );
  await mkdir(fileDirPath, { recursive: true });
  const filePath = join(
    fileDirPath,
    sanitizeSuffix(dist.fileName || dist.identifier)
  );

  if (!res.body) throw new Error("no body");
  await writeFile(filePath, res.body);
}

/** @typedef DownloadJob
 * @prop {Dataset} dataset
 * @prop {Distribution} dist
 * @prop {URL} url
 * @prop {string} outputPath
 * @prop {number} attempts
 * @prop {Date=} waitUntil
 */
/** @typedef Dataset
 * @prop {string} identifier
 * @prop {Distribution[]} distribution
 */
/** @typedef Distribution
 * @prop {string} identifier
 * @prop {string} fileName
 * @prop {string} downloadURL
 */

// https://security.stackexchange.com/a/123723
/**
 * @argument {string} path
 */
function sanitizeSuffix(path) {
  return normalize(path).replace(/^(\.\.(\/|\\|$))+/, "");
}

/**
 * @param {DownloadJob[]} jobs
 * @param {string} id
 */
function chequearIdsDuplicados(jobs, id) {
  const duplicated = hasDuplicates(
    jobs.map((j) => `${j.dataset.identifier}/${j.dist.identifier}`)
  );
  if (duplicated) {
    console.error(
      `ADVERTENCIA[${id}]: ¡encontré duplicados! es posible que se pisen archivos entre si`
    );
  }
}
// https://stackoverflow.com/a/7376645
/** @argument {any[]} array */
function hasDuplicates(array) {
  return new Set(array).size !== array.length;
}

/** @argument {number} ms */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {{ dataset: Dataset, dist: Distribution, url?: URL }} job
 * @param {any} error
 */
function encodeError(job, error) {
  const always = {
    url: job.url?.toString() || job.dist.downloadURL,
    datasetIdentifier: job.dataset.identifier,
    distributionIdentifier: job.dist.identifier,
  };
  if (error instanceof StatusCodeError)
    return { ...always, kind: "http_error", status_code: error.code };
  else if (error instanceof TooManyRedirectsError)
    return { ...always, kind: "infinite_redirect" };
  else {
    return {
      ...always,
      kind: "generic_error",
      error: error.code || error.message,
    };
  }
}

/**
 * parchea URLs que se rompen solas
 * @param {URL} url
 */
function patchUrl(url) {
  if (url.host === "www.ign.gob.ar") {
    // por defecto, 'http://www.ign.gob.ar' redirige a 'https://ign.gob.ar' pero su certificado solo aplica para '*.ign.gob.ar'. se sirve todo el contenido correctamente en 'https://www.ign.gob.ar', así que vamos para ahí.
    url.protocol = "https:";
  }
  return url;
}

// https://stackoverflow.com/a/12646864
/** @param {any[]} array */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
