// @ts-check
import { mkdir, open } from "node:fs/promises";
import { Agent, fetch } from "undici";
import { join, normalize } from "node:path";
import { pipeline } from "node:stream/promises";

// FYI: al menos los siguientes dominios no tienen la cadena completa de certificados en HTTPS. tenemos que usar un hack (node_extra_ca_certs_mozilla_bundle) para conectarnos a estos sitios. (se puede ver con ssllabs.com) ojalá lxs administradorxs de estos servidores lo arreglen.
// www.enargas.gov.ar, transparencia.enargas.gov.ar, www.energia.gob.ar, www.economia.gob.ar, datos.yvera.gob.ar

const dispatcher = new Agent({
  pipelining: 10,
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

// Leer JSON de stdin
const json = await process.stdin.toArray();
const jsonString = json.join("");
/** @type {{ dataset: Dataset[] }} */
const parsed = JSON.parse(jsonString);

const jobs = parsed.dataset.flatMap((dataset) =>
  dataset.distribution.map((dist) => ({ dataset, dist }))
);
// forma barrani de distribuir carga entre servidores
shuffleArray(jobs);
const totalJobs = jobs.length;
let nFinished = 0;

const duplicated = hasDuplicates(
  jobs.map((j) => `${j.dataset.identifier}/${j.dist.identifier}`)
);
if (duplicated) {
  console.error(
    "ADVERTENCIA: ¡encontré duplicados! es posible que se pisen archivos entre si"
  );
}

const greens = Array(128)
  .fill(0)
  .map(() =>
    (async () => {
      let job;
      while ((job = jobs.pop())) {
        const { dataset, dist } = job;
        request: do {
          try {
            await downloadDist(dataset, dist);
          } catch (error) {
            if (error instanceof StatusCodeError) {
              // algunos servidores usan 403 como coso para decir "calmate"
              if (
                error.code === 403 &&
                dist.downloadURL.includes("minsegar-my.sharepoint.com")
              ) {
                console.debug(
                  `debug: reintentando ${dist.downloadURL} porque tiró 403`
                );
                await wait(15000);
                continue request;
              }
              error = error.toString();
            }
            console.error(
              `error: Failed to download URL ${dist.downloadURL} (${dataset.identifier}/${dist.identifier}):`,
              error
            );
            if (!(error instanceof StatusCodeError)) continue request;
          } finally {
            nFinished++;
          }
        } while (0);
      }
    })()
  );

const interval = setInterval(() => {
  console.info(`info: ${nFinished}/${totalJobs} done`);
}, 15000);
await Promise.all(greens);
clearInterval(interval);

/**
 * @argument {Dataset} dataset
 * @argument {Distribution} dist
 */
async function downloadDist(dataset, dist) {
  const url = new URL(dist.downloadURL);

  const res = await fetch(url.toString(), {
    dispatcher,
  });
  if (res.status >= 400) {
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

/** @typedef {object} Dataset
 * @prop {string} identifier
 * @prop {Distribution[]} distribution
 */
/** @typedef {object} Distribution
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

// https://stackoverflow.com/a/7376645
/**
 * @argument {any[]} array
 */
function hasDuplicates(array) {
  return new Set(array).size !== array.length;
}

// https://stackoverflow.com/a/12646864
/**
 * @argument {any[]} array
 */
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

/**
 * @argument {number} ms
 */
function wait(ms) {
  if (ms < 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
