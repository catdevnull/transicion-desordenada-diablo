// @ts-check
import { mkdir, open, writeFile } from "node:fs/promises";
import { Agent, fetch, request, setGlobalDispatcher } from "undici";
import { join, normalize } from "node:path";
import pLimit from "p-limit";

const sitiosPorDefecto = [
  "https://datos.gob.ar/data.json",
  "http://datos.energia.gob.ar/data.json",
  "https://datos.magyp.gob.ar/data.json",
  "https://datos.acumar.gov.ar/data.json",
  "https://datasets.datos.mincyt.gob.ar/data.json",
  "https://datos.arsat.com.ar/data.json",
  "https://datos.cultura.gob.ar/data.json",
  "https://datos.mininterior.gob.ar/data.json",
  "https://datos.produccion.gob.ar/data.json",
  "https://datos.salud.gob.ar/data.json",
  "https://datos.transporte.gob.ar/data.json",
  "https://ckan.ciudaddemendoza.gov.ar/data.json",
  "https://datos.santafe.gob.ar/data.json",
  "https://datosabiertos.chaco.gob.ar/data.json",
  "https://datosabiertos.mercedes.gob.ar/data.json",
  "http://luj-bue-datos.paisdigital.innovacion.gob.ar/data.json",
  "https://datosabiertos.desarrollosocial.gob.ar/data.json",
  "http://datos.mindef.gov.ar/data.json",

  "https://monitoreo.datos.gob.ar/catalog/jgm/data.json",
  // 'https://datosabiertos.enacom.gob.ar/data.json',
  "https://monitoreo.datos.gob.ar/catalog/otros/data.json",
  "https://monitoreo.datos.gob.ar/catalog/aaip/data.json",
  "https://monitoreo.datos.gob.ar/media/catalog/sedronar/data.json",
  "https://monitoreo.datos.gob.ar/catalog/modernizacion/data.json",
  "https://monitoreo.datos.gob.ar/media/catalog/shn/data.json",
  "https://monitoreo.datos.gob.ar/catalog/smn/data.json",
  "https://monitoreo.datos.gob.ar/catalog/ign/data.json",
  "https://monitoreo.datos.gob.ar/catalog/justicia/data.json",
  "https://monitoreo.datos.gob.ar/catalog/seguridad/data.json",
  "https://monitoreo.datos.gob.ar/media/catalog/ambiente/data.json",
  // "http://andino.siu.edu.ar/data.json",
  "https://monitoreo.datos.gob.ar/catalog/educacion/data.json",
  "https://monitoreo.datos.gob.ar/media/catalog/inti/data.json",
  "https://monitoreo.datos.gob.ar/catalog/ssprys/data.json",
  "https://www.presupuestoabierto.gob.ar/sici/rest-api/catalog/public",
  "https://transparencia.enargas.gob.ar/data.json",
  "https://infra.datos.gob.ar/catalog/sspm/data.json",
  "https://monitoreo.datos.gob.ar/catalog/ssprys/data.json",
  "https://monitoreo.datos.gob.ar/catalog/siep/data.json",
  "https://monitoreo.datos.gob.ar/catalog/exterior/data.json",
  "http://datos.pami.org.ar/data.json",
  "https://monitoreo.datos.gob.ar/media/catalog/trabajo/data.json",
  "https://datos.yvera.gob.ar/data.json",
  "https://monitoreo.datos.gob.ar/media/catalog/renaper/data.json",
  "https://monitoreo.datos.gob.ar/media/catalog/dine/data.json",
  "https://monitoreo.datos.gob.ar/media/catalog/obras/data.json",
  "https://monitoreo.datos.gob.ar/media/catalog/generos/data.json",
];

// desactivado porque va MUY lento: datosabiertos.gualeguaychu.gov.ar

// FYI: al menos los siguientes dominios no tienen la cadena completa de certificados en HTTPS. tenemos que usar un hack (node_extra_ca_certs_mozilla_bundle) para conectarnos a estos sitios. (se puede ver con ssllabs.com) ojalá lxs administradorxs de estos servidores lo arreglen.
// www.enargas.gov.ar, transparencia.enargas.gov.ar, www.energia.gob.ar, www.economia.gob.ar, datos.yvera.gob.ar

setGlobalDispatcher(
  new Agent({
    pipelining: 0,
  }),
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
let jsonUrls = process.argv.slice(2);
if (jsonUrls.length < 1) {
  jsonUrls = sitiosPorDefecto;
}
writeFile("readme.txt", generateReadme(jsonUrls));
for (const url of jsonUrls)
  downloadFromData(url).catch((error) =>
    console.error(`${url} FALLÓ CON`, error),
  );

/**
 * @param {string} jsonUrlString
 */
async function downloadFromData(jsonUrlString) {
  const jsonUrl = new URL(jsonUrlString);
  const outputPath = `${jsonUrl.host}${jsonUrl.pathname}`.replaceAll("/", "_");
  await mkdir(outputPath, { recursive: true });
  const errorFile = (
    await open(join(outputPath, "errors.jsonl"), "w")
  ).createWriteStream();

  try {
    const jsonRes = await fetch(jsonUrl);
    // prettier-ignore
    const parsed = /** @type {{ dataset: Dataset[] }} */(await jsonRes.json())
    await writeFile(join(outputPath, "data.json"), JSON.stringify(parsed));

    /** @type {DownloadJob[]} */
    const jobs = parsed.dataset.flatMap((dataset) =>
      dataset.distribution
        .filter((dist) => {
          try {
            patchUrl(new URL(dist.downloadURL));
            return true;
          } catch (error) {
            errorFile.write(
              JSON.stringify(encodeError({ dataset, dist }, error)) + "\n",
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
        })),
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
        `info[${outputPath}]: ${nFinished}/${totalJobs} done\n`,
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
    sanitizeSuffix(dist.identifier),
  );
  await mkdir(fileDirPath, { recursive: true });
  const filePath = join(
    fileDirPath,
    sanitizeSuffix(dist.fileName || dist.identifier),
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
    jobs.map((j) => `${j.dataset.identifier}/${j.dist.identifier}`),
  );
  if (duplicated) {
    console.error(
      `ADVERTENCIA[${id}]: ¡encontré duplicados! es posible que se pisen archivos entre si`,
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

/**
 * @param {string[]} portales
 */
function generateReadme(portales) {
  // basado en el readme de Patricio
  return `Dumps de Portales de Datos Abiertos de la República Argentina
=============================================================

El zip contiene todo lo que se pudo descargar de los portales seleccionados, que fueron:
${portales.map((p) => `- ${p}`).join("\n")}

La carpeta está ordenada en subcarpetas cuyo nombre corresponde al ID del dataset/distribución del portal. De esta forma, 
leyendo el data.json se puede programaticamente y de manera simple volver a mapear qué archivo le corresponde a cada
distribución.

Formato:

- {url de data.json sin protocolo y con / reemplazado por _}/
  - data.json
  - errors.jsonl: archivo con todos los errores que se obtuvieron al intentar descargar todo.
  - {identifier de dataset}/
    - {identifier de distribution}/
      - {fileName (o, si no existe, identifier de distribution)}

Ejemplo:

- datos.gob.ar_data.json/
  - data.json
  - errors.jsonl
  - turismo_fbc269ea-5f71-45b6-b70c-8eb38a03b8db/
    - turismo_0774a0bb-71c2-44d7-9ea6-780e6bd06d50/
      - cruceristas-por-puerto-residencia-desagregado-por-pais-mes.csv
    - ...
  - energia_0d4a18ee-9371-439a-8a94-4f53a9822664/
    - energia_9f602b6e-2bef-4ac4-895d-f6ecd6bb1866/
      - energia_9f602b6e-2bef-4ac4-895d-f6ecd6bb1866 (este archivo no tiene fileName en el data.json, entonces se reutiliza el identifier)
  - ...

Este dump fue generado con transicion-desordenada-diablo: https://gitea.nulo.in/Nulo/transicion-desordenada-diablo
`;
}