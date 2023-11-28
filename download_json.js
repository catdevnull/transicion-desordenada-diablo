// @ts-check
import { mkdir, open } from "node:fs/promises";
import { Agent, fetch } from "undici";
import { join, normalize } from "node:path";
import { pipeline } from "node:stream/promises";

// FYI: al menos los siguientes dominios no tienen la cadena completa de certificados en HTTPS. tenemos que usar un hack (node_extra_ca_certs_mozilla_bundle) para conectarnos a estos sitios. (se puede ver con ssllabs.com) ojalá lxs administradorxs de estos servidores lo arreglen.
// www.enargas.gov.ar, transparencia.enargas.gov.ar, www.energia.gob.ar, www.economia.gob.ar, datos.yvera.gob.ar

const dispatcher = new Agent({
  pipelining: 50,
  maxRedirections: 20,
});

class StatusCodeError extends Error {
  /**
   * @param {number} code
   */
  constructor(code) {
    super(`Status code: ${code}`);
    this.code = code;
  }
}

const outputPath = process.argv[2];
if (!outputPath) {
  console.error("Especificamente el output porfa");
  process.exit(1);
}
await mkdir(outputPath, { recursive: true });
const errorFile = await open(join(outputPath, "errors.jsonl"), "w");

// Leer JSON de stdin
const json = await process.stdin.toArray();
const jsonString = json.join("");
/** @type {{ dataset: Dataset[] }} */
const parsed = JSON.parse(jsonString);

const jobs = parsed.dataset.flatMap((dataset) =>
  dataset.distribution.map((dist) => ({
    dataset,
    dist,
    url: new URL(dist.downloadURL),
  }))
);
const totalJobs = jobs.length;
let nFinished = 0;
let nErrors = 0;

// por las dudas verificar que no hayan archivos duplicados
chequearIdsDuplicados();

/** @type {Map< string, DownloadJob[] >} */
let jobsPerHost = new Map();
for (const job of jobs) {
  jobsPerHost.set(job.url.host, [
    ...(jobsPerHost.get(job.url.host) || []),
    job,
  ]);
}

const greens = [...jobsPerHost.entries()].flatMap(([host, jobs]) => {
  const nThreads = 128;
  return Array(nThreads)
    .fill(0)
    .map(() =>
      (async () => {
        let job;
        while ((job = jobs.pop())) {
          try {
            await downloadDistWithRetries(job);
          } catch (error) {
            await errorFile.write(
              JSON.stringify({ url: job.url.toString(), ...encodeError(error) })
            );
            nErrors++;
          } finally {
            nFinished++;
          }
        }
      })()
    );
});
process.stderr.write(`greens: ${greens.length}\n`);

const interval = setInterval(() => {
  process.stderr.write(`info: ${nFinished}/${totalJobs} done\n`);
}, 30000);
await Promise.all(greens);
clearInterval(interval);
if (nErrors > 0) console.error(`Finished with ${nErrors} errors`);

/**
 * @argument {DownloadJob} job
 * @argument {number} tries
 */
async function downloadDistWithRetries(job, tries = 0) {
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
      tries < 15
    ) {
      await wait(15000);
      return await downloadDistWithRetries(job, tries + 1);
    }
    // si no fue un error de http, reintentar hasta 5 veces con 5 segundos de por medio
    else if (
      !(error instanceof StatusCodeError) &&
      !errorIsInfiniteRedirect(error) &&
      tries < 5
    ) {
      await wait(5000);
      return await downloadDistWithRetries(job, tries + 1);
    } else throw error;
  }
}

/**
 * @argument {DownloadJob} job
 */
async function downloadDist({ dist, dataset }) {
  const url = new URL(dist.downloadURL);

  const res = await fetch(url.toString(), {
    dispatcher,
  });
  if (!res.ok) {
    throw new StatusCodeError(res.status);
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
  const outputFile = await open(filePath, "w");

  if (!res.body) throw new Error("no body");
  await pipeline(res.body, outputFile.createWriteStream());
}

/** @typedef DownloadJob
 * @prop {Dataset} dataset
 * @prop {Distribution} dist
 * @prop {URL} url
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

function chequearIdsDuplicados() {
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
  if (ms < 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function encodeError(error) {
  if (error instanceof StatusCodeError)
    return { kind: "http_error", status_code: error.code };
  else if (errorIsInfiniteRedirect(error)) return { kind: "infinite_redirect" };
  else {
    console.error(error, error.cause.message);
    return { kind: "generic_error", error };
  }
}
function errorIsInfiniteRedirect(error) {
  return error?.cause?.message === "redirect count exceeded";
}
