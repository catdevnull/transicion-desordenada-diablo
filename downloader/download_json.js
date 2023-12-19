import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { targetsPorDefecto } from "./config.js";
import { generateDataJsonFromCkan } from "./ckan_to_datajson.js";
import { zData } from "common/schema.js";
import {
  StatusCodeError,
  TooManyRedirectsError,
  customRequest,
} from "./network.js";
import { WriteStream, createWriteStream } from "node:fs";
import {
  sanitizeSuffix,
  shuffleArray,
  hasDuplicates,
  waitUntil,
} from "./utils.js";
import fastq from "fastq";

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

let nTotal = 0;
let nFinished = 0;
let nErrors = 0;
const queue = fastq.promise(null, downloadDistWithRetries, 32);

const interval = setInterval(() => {
  process.stderr.write(`info: ${nFinished}/${nTotal} done\n`);
}, 10000);
await queue.drained();
clearInterval(interval);

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
          errorFile,
        }))
    );
    nTotal += jobs.length;

    // por las dudas verificar que no hayan archivos duplicados
    chequearIdsDuplicados(jobs, outputPath);

    shuffleArray(jobs);

    for (const job of jobs) queue.push(job);
    await queue.drained();
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
    const jsonRes = await customRequest(new URL(target.url));
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

/** @typedef DownloadJob
 * @prop {import("common/schema.js").Dataset} dataset
 * @prop {import("common/schema.js").Distribution} dist
 * @prop {URL} url
 * @prop {string} outputPath
 * @prop {number} attempts
 * @prop {Date=} waitUntil
 * @prop {WriteStream} errorFile
 */

const REPORT_RETRIES = process.env.REPORT_RETRIES === "true" || false;

/**
 * @argument {DownloadJob} job
 */
async function downloadDistWithRetries(job) {
  try {
    if (job.waitUntil) await waitUntil(job.waitUntil);
    await downloadDist(job);
    nFinished++;
  } catch (error) {
    // algunos servidores usan 403 como coso para decir "calmate"
    // intentar hasta 15 veces con 15 segundos de por medio
    if (
      error instanceof StatusCodeError &&
      ((error.code === 403 && job.url.host === "minsegar-my.sharepoint.com") ||
        (error.code === 503 && job.url.host === "cdn.buenosaires.gob.ar")) &&
      job.attempts < 15
    ) {
      if (REPORT_RETRIES)
        console.debug(
          `reintentando(status)[${job.attempts}] ${job.url.toString()}`
        );
      queue.push({
        ...job,
        waitUntil: new Date(
          Date.now() + 1000 * (job.attempts + 1) ** 2 + Math.random() * 10000
        ),
        attempts: job.attempts + 1,
      });
    }
    // si no fue un error de http, reintentar hasta 3 veces con ~10 segundos de por medio
    else if (
      !(error instanceof StatusCodeError) &&
      !(error instanceof TooManyRedirectsError) &&
      job.attempts < 7
    ) {
      if (REPORT_RETRIES)
        console.debug(`reintentando[${job.attempts}] ${job.url.toString()}`);
      queue.push({
        ...job,
        waitUntil: new Date(
          Date.now() + 1000 * (job.attempts + 1) ** 2 + Math.random() * 10000
        ),
        attempts: job.attempts + 1,
      });
    } else {
      job.errorFile.write(JSON.stringify(encodeError(job, error)) + "\n");
      nErrors++;
      nFinished++;
    }
  }
}

/**
 * @argument {DownloadJob} job
 */
async function downloadDist({ url, outputPath, dataset, dist }) {
  const res = await customRequest(url);

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
