import streamSaver from "streamsaver";
import { zData, type Distribution, zError } from "./schema";

export async function downloadFile(
  dataPath: string,
  datasetId: string,
  dist: Distribution,
) {
  const outputS = streamSaver.createWriteStream(
    dist.downloadURL.slice(dist.downloadURL.lastIndexOf("/") + 1),
  );
  const res = await fetch(
    `${dataPath}/${datasetId}/${dist.identifier}/${
      dist.fileName || dist.identifier
    }.gz`,
  );
  const ds = new DecompressionStream("gzip");
  const decompressedStream = res.body!.pipeThrough(ds);
  await decompressedStream.pipeTo(outputS);
}

async function fetchGzipped(url: string): Promise<Response> {
  const res = await fetch(url);
  const ds = new DecompressionStream("gzip");
  const decompressedStream = res.body!.pipeThrough(ds);
  const resD = new Response(decompressedStream);
  return resD;
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

const endpoint = "http://localhost:8081";
export const gobData = `${endpoint}/datos.gob.ar_data.json`;
export async function fetchData(url: string) {
  const json = await loadGzippedJson(`${url}/data.json.gz`);
  if (import.meta.env.DEV) console.debug(json);
  return zData.parse(json);
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