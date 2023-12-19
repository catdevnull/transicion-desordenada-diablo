import { mkdir, writeFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { targetsPorDefecto } from "./config.js";
import { generateDataJsonFromCkan } from "./ckan_to_datajson.js";
import { zData } from "common/schema.js";
import {
  StatusCodeError,
  TooManyRedirectsError,
  customRequestWithLimitsAndRetries,
} from "./network.js";
import { createWriteStream } from "node:fs";

let urls = process.argv.slice(2);
if (urls.length < 1) {
  urls = targetsPorDefecto;
}
/** @typedef {{type: "datajson" | "ckan"; url: string;}} Target */

/** @type {Target[]} */
const targets = urls.map((url) => {
  if (url.startsWith("datajson+")) {
    return { type: "datajson", url: url.slice("datajson+".length) };
  } else if (url.startsWith("ckan+")) {
    return { type: "ckan", url: url.slice("ckan+".length) };
  } else return { type: "datajson", url };
});
for (const target of targets)
  downloadFromData(target).catch((error) =>
    console.error(`${target.type}+${target.url} FALLÓ CON`, error)
  );

/**
 * @param {Target} target
 */
async function downloadFromData(target) {
  const outputPath = generateOutputPath(target.url);
  const json = await getDataJsonForTarget(target);
  const parsed = zData.parse(JSON.parse(json));

  await mkdir(outputPath, { recursive: true });
  await writeFile(join(outputPath, "data.json"), json);
  await writeFile(join(outputPath, "url.txt"), `${target.type}+${target.url}`);
  const errorFile = createWriteStream(join(outputPath, "errors.jsonl"), {
    flags: "w",
  });
  try {
    let nFinished = 0;
    let nErrors = 0;
    /** @type {DownloadJob[]} */
    const jobs = parsed.dataset.flatMap((dataset) =>
      dataset.distribution
        .filter(
          /** @returns {dist is import("common/schema.js").Distribution & {downloadURL: string}} */
          (dist) => {
            try {
              if (!dist.downloadURL) {
                throw new Error("No downloadURL in distribution");
              }
              patchUrl(new URL(dist.downloadURL));
              return true;
            } catch (error) {
              errorFile.write(
                JSON.stringify(encodeError({ dataset, dist }, error)) + "\n"
              );
              nErrors++;
              return false;
            }
          }
        )
        .map((dist) => ({
          dataset,
          dist,
          url: patchUrl(new URL(dist.downloadURL)),
          outputPath,
          attempts: 0,
        }))
    );
    const totalJobs = jobs.length;

    // por las dudas verificar que no hayan archivos duplicados
    chequearIdsDuplicados(jobs, outputPath);

    shuffleArray(jobs);

    const promises = jobs.map(async (job) => {
      try {
        return await downloadDistWithRetries(job);
      } catch (error) {
        errorFile.write(JSON.stringify(encodeError(job, error)) + "\n");
        nErrors++;
      } finally {
        nFinished++;
      }
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
 * @param {Target} target
 * @returns {Promise<string>}
 */
async function getDataJsonForTarget(target) {
  if (target.type === "ckan") {
    return JSON.stringify(await generateDataJsonFromCkan(target.url));
  } else if (target.type === "datajson") {
    const jsonRes = await customRequestWithLimitsAndRetries(
      new URL(target.url)
    );
    return await jsonRes.body.text();
  } else throw new Error("?????????????");
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
 */
async function downloadDistWithRetries({ dist, dataset, url, outputPath }) {
  const res = await customRequestWithLimitsAndRetries(url);

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
 * @prop {import("common/schema.js").Dataset} dataset
 * @prop {import("common/schema.js").Distribution} dist
 * @prop {URL} url
 * @prop {string} outputPath
 * @prop {number} attempts
 * @prop {Date=} waitUntil
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

/**
 * @param {{ dataset: import("common/schema.js").Dataset, dist: import("common/schema.js").Distribution, url?: URL }} job
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
