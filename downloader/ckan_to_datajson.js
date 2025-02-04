import z from "zod";
import pMap from "p-map";
import { basename } from "path";
import { customRequestWithRetries } from "./network.js";

const zCkanPackageList = z.object({
  success: z.literal(true),
  result: z.array(z.string()),
});

/**
 * @param {string} url
 */
async function getJson(url) {
  const res = await customRequestWithRetries(new URL(url));
  const json = await res.body.json();
  return json;
}

/**
 * descarga una lista de los names de los datasets
 * @param {string} ckanUrl
 * @returns {Promise<string[]>}
 */
async function getCkanPackageList(ckanUrl) {
  const json = await getJson(`${ckanUrl}/api/3/action/package_list`);
  return zCkanPackageList.parse(json).result;
}

const zCkanOrganization = z.object({
  name: z.string(),
  title: z.string(),
  id: z.string(),
  created: z.string(),
});
const zCkanResource = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  format: z.string(),
  url: z.string(),
});
const zCkanTag = z.object({
  id: z.string(),
  display_name: z.string(),
  name: z.string(),
});
const zCkanGroup = z.object({
  id: z.string(),
  display_name: z.string(),
  name: z.string(),
  description: z.string(),
});
const zCkanPackage = z.object({
  license_title: z.string(),
  license_id: z.string(),
  license_url: z.string().optional(),
  maintainer: z.string(),
  maintainer_email: z.string(),
  id: z.string(),
  name: z.string(),
  title: z.string(),
  metadata_created: z.string(),
  metadata_modified: z.string(),
  author: z.string(),
  author_email: z.string(),
  resources: z.array(zCkanResource),
  tags: z.array(zCkanTag),
  groups: z.array(zCkanGroup),
  organization: zCkanOrganization,
  url: z.string().nullable(),
  notes: z.string(),
});
const zCkanPackageShow = z.object({
  success: z.literal(true),
  result: zCkanPackage,
});

/**
 * @param {string} ckanUrl
 * @param {string} packageName
 */
async function getCkanPackage(ckanUrl, packageName) {
  const json = await getJson(
    `${ckanUrl}/api/3/action/package_show?id=${encodeURIComponent(packageName)}`
  );
  return zCkanPackageShow.parse(json).result;
}

const zCkanStatusShow = z.object({
  success: z.literal(true),
  result: z.object({
    site_url: z.string().describe("Titulo del portal. A veces vacio."),
    site_description: z
      .string()
      .describe("Descripción del portal. A veces vacio."),
    site_title: z.string(),
    error_emails_to: z.string().nullable(),
  }),
});

/**
 * Consigue información general sobre el portal
 * @param {string} ckanUrl
 */
async function getCkanInfo(ckanUrl) {
  const json = await getJson(`${ckanUrl}/api/3/action/status_show`);
  return zCkanStatusShow.parse(json).result;
}

/**
 * Genera un data.json a partir de un CKAN que quizás no tiene un data.json oficial.
 * @param {string} ckanUrl
 */
export async function generateDataJsonFromCkan(ckanUrl) {
  const list = await getCkanPackageList(ckanUrl);
  const info = await getCkanInfo(ckanUrl);
  const packages = await pMap(list, (link) => getCkanPackage(ckanUrl, link), {
    concurrency: 12,
  });
  /** @type {import("common/schema.js").Data &  { generatedBy: string }} */
  const data = {
    generatedBy:
      "archivador de datos abiertos (ckan_to_datajson) <https://github.com/catdevnull/transicion-desordenada-diablo>",
    title: info.site_title || ckanUrl,
    description: info.site_description || "",
    homepage: info.site_url || ckanUrl,
    dataset: packages.map((p) => ({
      title: p.title,
      description: p.notes,
      identifier: p.id,
      publisher: {
        name: p.maintainer,
        mbox: p.maintainer_email,
      },
      landingPage:
        p.url ??
        `${ckanUrl}/api/3/action/package_show?id=${encodeURIComponent(p.id)}`,
      distribution: p.resources.map((r) => ({
        identifier: r.id,
        title: r.name,
        description: r.description,
        fileName: basename(r.url),
        format: r.format,
        downloadURL: r.url,
      })),
    })),
  };
  return data;
}
