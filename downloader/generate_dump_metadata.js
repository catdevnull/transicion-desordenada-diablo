// @ts-check
import { readFile, readdir, writeFile } from "node:fs/promises";
import { zData } from "common/schema.js";
import { join } from "node:path";

const dumpDir = process.argv[2];
generateMetadata(dumpDir);

/**
 * @param {string} dumpDir
 */
async function generateMetadata(dumpDir) {
  if (!dumpDir) {
    console.error("Especifica una carpeta para generar los metadatos, porfa.");
    process.exit(1);
  }

  const files = await readdir(dumpDir, { withFileTypes: true });
  const sites = await Promise.all(
    files
      .filter((file) => file.isDirectory())
      .map(async (file) => {
        const path = join(file.path, file.name);
        const data = await loadDataJson(path);
        let url = await readFile(join(path, "url.txt"), "utf-8");
        if (url.startsWith("datajson+") || url.startsWith("ckan+"))
          url = url.slice(url.indexOf("+") + 1);
        return {
          title: data.title,
          description: data.description,
          url,
          path: file.name,
          nDatasets: data.dataset.length,
        };
      })
  );
  /** @type {import("common/schema.js").DumpMetadata} */
  const dumpMetadata = { sites };
  await writeFile(
    join(dumpDir, "dump-metadata.json"),
    JSON.stringify(dumpMetadata)
  );
  await writeFile(
    join(dumpDir, "readme.txt"),
    generateReadme(sites.map((s) => s.url))
  );
}

/**
 * @param {string[]} portales
 */
function generateReadme(portales) {
  // basado en el readme de Patricio
  return `Dumps de Portales de Datos Abiertos de la República Argentina
=============================================================

Esta carpeta contiene todo lo que se pudo descargar de los portales seleccionados, que fueron:
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

Se puede usar el frontend en esa repo para ver el dump.
`;
}

/**
 * @param {string} dir carpeta del dump
 */
async function loadDataJson(dir) {
  const text = await readFile(join(dir, "data.json"), "utf-8");
  const json = JSON.parse(text);
  const data = zData.parse(json);
  return data;
}
