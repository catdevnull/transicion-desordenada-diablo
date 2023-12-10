import { zData, type Distribution, zError, zDumpMetadata } from "common/schema";

export async function downloadFile(
  dataPath: string,
  datasetId: string,
  dist: Distribution,
) {
  if (!dist.downloadURL) throw new Error("no downloadURL");
  const downloadURL = `${dataPath}/${datasetId}/${dist.identifier}/${
    dist.fileName || dist.identifier
  }.gz`;

  const localGzip = async () => {
    const streamSaver = await import("streamsaver");
    const outputS = streamSaver.createWriteStream(
      dist.downloadURL!.slice(dist.downloadURL!.lastIndexOf("/") + 1),
    );
    const res = await fetchGzipped(downloadURL);
    await res.body!.pipeTo(outputS);
  };

  if (navigator.userAgent.indexOf("Firefox") != -1) {
    // firefox, por alguna razón inexplicable, no entiende el `content-encoding`
    // cuando se intenta descargar un archivo. lo ignora y guarda el archivo
    // comprimido. entonces tenemos que usar el hack de streamsaver. prefiero
    // usarlo solo en firefox porque anda medio mal o no anda en otros navegadores.
    await localGzip();
  } else {
    const infoRes = await fetch(downloadURL);
    await infoRes.body?.cancel();
    if (infoRes.headers.get("Content-Type") === "application/gzip-hack") {
      // server tiene el hack de gzip=true activado, genial
      location.href = `${downloadURL}?gzip=true`;
    } else {
      await localGzip();
    }
  }
}

async function fetchGzipped(url: string): Promise<Response> {
  let res = await fetch(`${url}?gzip=true`);
  if (res.status === 404 && url.endsWith(".gz")) {
    // probar cargando el archivo no comprimido
    res = await fetch(url.slice(0, url.length - ".gz".length));
    return res;
  }
  if (res.headers.get("Content-Type") === "application/gzip-hack") {
    // server tiene el hack de gzip=true activado, genial
    return res;
  } else {
    // server no tiene el hack, usamos DecompressionStream
    let DecStream;
    if ("DecompressionStream" in window) DecStream = window.DecompressionStream;
    else {
      const { makeDecompressionStream } = await import(
        "compression-streams-polyfill/ponyfill"
      );
      DecStream = makeDecompressionStream(TransformStream);
    }
    const ds = new DecStream("gzip");
    const decompressedStream = res.body!.pipeThrough(ds);
    const resD = new Response(decompressedStream);
    return resD;
  }
}
let cachedGzippedJson = new Map<string, { date: Date; data: unknown }>();

async function loadGzippedJson(url: string): Promise<unknown> {
  const cachedEntry = cachedGzippedJson.get(url);
  if (cachedEntry) {
    if (+cachedEntry.date + 10 * 60 * 1000 > +new Date()) {
      return cachedEntry.data;
    } else {
      cachedGzippedJson.delete(url);
    }
  }

  const res = await fetchGzipped(url);
  const json = await res.json();
  cachedGzippedJson.set(url, { date: new Date(), data: json });
  return json;
}

export async function fetchData(portalUrl: string) {
  const json = await loadGzippedJson(`${portalUrl}/data.json.gz`);
  if (import.meta.env.DEV) console.debug(json);
  return zData.parse(json);
}
export async function fetchDumpMetadata(dumpUrl: string) {
  const json = await loadGzippedJson(`${dumpUrl}/dump-metadata.json.gz`);
  if (import.meta.env.DEV) console.debug(json);
  return zDumpMetadata.parse(json);
}
export async function fetchErrors(url: string) {
  const res = await fetchGzipped(`${url}/errors.jsonl.gz`);
  const text = await res.text();
  const lines = text
    .split("\n")
    .filter((line) => !!line)
    .map((line) => JSON.parse(line))
    .map((json) => zError.parse(json));
  return lines;
}
