import { Dispatcher, request, Agent, setGlobalDispatcher } from "undici";
import pLimit from "p-limit";
import { userAgent } from "./config.js";

setGlobalDispatcher(
  new Agent({
    pipelining: 0,
    bodyTimeout: 15 * 60 * 1000,
  })
);

export class StatusCodeError extends Error {
  /**
   * @param {number} code
   */
  constructor(code) {
    super(`Status code: ${code}`);
    this.code = code;
  }
}
export class TooManyRedirectsError extends Error {}

/** key es host
 * @type {Map<string, import("p-limit").LimitFunction>} */
const limiters = new Map();
const nConnections = process.env.N_THREADS
  ? parseInt(process.env.N_THREADS)
  : 8;

/**
 * @argument {URL} url
 * @argument {number} attempts
 * @returns {Promise<Dispatcher.ResponseData>}
 */
export async function customRequestWithLimitsAndRetries(url, attempts = 0) {
  try {
    return await _customRequestWithLimits(url);
  } catch (error) {
    // algunos servidores usan 403 como coso para decir "calmate"
    // intentar hasta 15 veces con 15 segundos de por medio
    if (
      error instanceof StatusCodeError &&
      ((error.code === 403 && url.host === "minsegar-my.sharepoint.com") ||
        (error.code === 503 && url.host === "cdn.buenosaires.gob.ar")) &&
      attempts < 15
    ) {
      await wait(15000);
      return await customRequestWithLimitsAndRetries(url, attempts + 1);
    }
    // si no fue un error de http, reintentar hasta 3 veces con ~10 segundos de por medio
    else if (
      !(error instanceof StatusCodeError) &&
      !(error instanceof TooManyRedirectsError) &&
      attempts < 7
    ) {
      await wait(5000 + Math.random() * 10000);
      return await customRequestWithLimitsAndRetries(url, attempts + 1);
    } else throw error;
  }
}

/** @argument {number} ms */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {URL} url
 */
async function _customRequestWithLimits(url) {
  let limit = limiters.get(url.host);
  if (!limit) {
    limit = pLimit(
      // tenemos que pingear mucho la API
      url.host === "data.buenosaires.gob.ar" ? 32 : nConnections
    );
    limiters.set(url.host, limit);
  }
  return limit(async () => {
    return await _customRequest(url);
  });
}

/**
 * @param {URL} url
 */
async function _customRequest(url) {
  // sharepoint no le gusta compartir a bots lol
  const spoofUserAgent = url.host.endsWith("sharepoint.com");

  const res = await request(url.toString(), {
    maxRedirections: 20,
    headers: {
      "User-Agent": spoofUserAgent
        ? "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0"
        : userAgent,
    },
  });
  if (res.statusCode >= 300 && res.statusCode <= 399)
    throw new TooManyRedirectsError();
  if (res.statusCode < 200 || res.statusCode > 299)
    throw new StatusCodeError(res.statusCode);

  return res;
}
