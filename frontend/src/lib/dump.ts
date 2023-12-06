import streamSaver from "streamsaver";
import { zData, type Distribution, zError } from "./schema";

export async function downloadFile(
  dataPath: string,
  datasetId: string,
  dist: Distribution
) {
  const outputS = streamSaver.createWriteStream(
    dist.downloadURL.slice(dist.downloadURL.lastIndexOf("/") + 1)
  );
  const res = await fetch(
    `${dataPath}/${datasetId}/${dist.identifier}/${
      dist.fileName || dist.identifier
    }.gz`
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
async function loadGzippedJson(url: string): Promise<unknown> {
  const res = await fetchGzipped(url);
  return await res.json();
}

const endpoint = "http://localhost:8081";
export const gobData = `${endpoint}/datos.gob.ar_data.json`;
export async function fetchData(url: string) {
  const json = await loadGzippedJson(`${url}/data.json.gz`);
  console.debug(json);
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
