// @ts-check
import { mkdir, open, writeFile } from "node:fs/promises";
import { Agent, fetch, request, setGlobalDispatcher } from "undici";
import { join, normalize } from "node:path";
import pLimit from "p-limit";

// FYI: al menos los siguientes dominios no tienen la cadena completa de certificados en HTTPS. tenemos que usar un hack (node_extra_ca_certs_mozilla_bundle) para conectarnos a estos sitios. (se puede ver con ssllabs.com) ojalá lxs administradorxs de estos servidores lo arreglen.
// www.enargas.gov.ar, transparencia.enargas.gov.ar, www.energia.gob.ar, www.economia.gob.ar, datos.yvera.gob.ar

setGlobalDispatcher(
  new Agent({
    pipelining: 0,
  })
);

/** key es host
 * @type {Map<string, import("p-limit").LimitFunction>} */
const limiters = new Map();
const nThreads = process.env.N_THREADS ? parseInt(process.env.N_THREADS) : 16;

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

let jsonUrlString = process.argv[2];
if (!jsonUrlString) {
  console.error("Especificamente el url al json porfa");
  process.exit(1);
}
downloadFromData(jsonUrlString);

/**
 * @param {string} jsonUrlString
 */
async function downloadFromData(jsonUrlString) {
  const jsonUrl = new URL(jsonUrlString);
  const outputPath = jsonUrl.host;
  await mkdir(outputPath, { recursive: true });
  const errorFile = await open(join(outputPath, "errors.jsonl"), "w");

  const jsonRes = await fetch(jsonUrl);
  // prettier-ignore
  const parsed = /** @type {{ dataset: Dataset[] }} */(await jsonRes.json())
  await writeFile(join(outputPath, "data.json"), JSON.stringify(parsed));

  /** @type {DownloadJob[]} */
  const jobs = parsed.dataset.flatMap((dataset) =>
    dataset.distribution.map((dist) => ({
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
  chequearIdsDuplicados(jobs);

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
        await errorFile.write(
          JSON.stringify({
            url: job.url.toString(),
            ...encodeError(error),
          }) + "\n"
        );
        nErrors++;
      } finally {
        nFinished++;
      }
    });
  });

  process.stderr.write(`info: 0/${totalJobs} done\n`);
  const interval = setInterval(() => {
    process.stderr.write(`info: ${nFinished}/${totalJobs} done\n`);
  }, 30000);
  await Promise.all(promises);
  clearInterval(interval);
  if (nErrors > 0) console.error(`Finished with ${nErrors} errors`);
}

/**
 * @argument {DownloadJob} job
 * @argument {number} attempts
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
    // si no fue un error de http, reintentar hasta 5 veces con 5 segundos de por medio
    else if (
      !(error instanceof StatusCodeError) &&
      !(error instanceof TooManyRedirectsError) &&
      attempts < 5
    ) {
      await wait(5000);
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
        : "transicion-desordenada (https://nulo.ar)",
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
 */
function chequearIdsDuplicados(jobs) {
  const duplicated = hasDuplicates(
    jobs.map((j) => `${j.dataset.identifier}/${j.dist.identifier}`)
  );
  if (duplicated) {
    console.error(
      "ADVERTENCIA: ¡encontré duplicados! es posible que se pisen archivos entre si"
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

function encodeError(error) {
  if (error instanceof StatusCodeError)
    return { kind: "http_error", status_code: error.code };
  else if (error instanceof TooManyRedirectsError)
    return { kind: "infinite_redirect" };
  else {
    return { kind: "generic_error", error: error.code || error.message };
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
