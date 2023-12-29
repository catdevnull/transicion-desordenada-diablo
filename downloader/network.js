import { Dispatcher, request, Agent } from "undici";
import { userAgent } from "./config.js";

const dispatcher = new Agent({
  connect: { timeout: 60 * 1000 },
  bodyTimeout: 15 * 60 * 1000,
  maxRedirections: 20,
});
const ignoreTlsDispatcher = new Agent({
  connect: { timeout: 60 * 1000, rejectUnauthorized: false },
  bodyTimeout: 15 * 60 * 1000,
  maxRedirections: 20,
});

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

const REPORT_RETRIES = process.env.REPORT_RETRIES === "true" || false;

/**
 * @argument {URL} url
 * @argument {number} attempts
 * @returns {Promise<Dispatcher.ResponseData>}
 */
export async function customRequestWithRetries(url, attempts = 0) {
  try {
    return await customRequest(url);
  } catch (error) {
    // algunos servidores usan 403 como coso para decir "calmate"
    // intentar hasta 15 veces con 15 segundos de por medio
    if (
      error instanceof StatusCodeError &&
      ((error.code === 403 && url.host === "minsegar-my.sharepoint.com") ||
        (error.code === 503 && url.host === "cdn.buenosaires.gob.ar") ||
        (error.code === 502 && url.host === "datos.jus.gob.ar")) &&
      attempts < 15
    ) {
      if (REPORT_RETRIES)
        console.debug(`reintentando(status)[${attempts}] ${url.toString()}`);
      await wait(1000 * (attempts + 1) ** 2 + Math.random() * 10000);
      return await customRequestWithRetries(url, attempts + 1);
    }
    // si no fue un error de http, reintentar hasta 3 veces con ~10 segundos de por medio
    else if (
      !(error instanceof StatusCodeError) &&
      !(error instanceof TooManyRedirectsError) &&
      attempts < 7
    ) {
      if (REPORT_RETRIES)
        console.debug(`reintentando[${attempts}] ${url.toString()}`);
      await wait(5000 + Math.random() * 10000);
      return await customRequestWithRetries(url, attempts + 1);
    } else throw error;
  }
}

/** @argument {number} ms */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * genera los headers para hacer un pedido dependiendo de la url
 * @param {URL} url
 */
function getHeaders(url) {
  // sharepoint no le gusta compartir a bots lol
  const spoofUserAgent = url.host.endsWith("sharepoint.com");

  return {
    "User-Agent": spoofUserAgent
      ? "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0"
      : userAgent,
  };
}

/**
 * @param {URL} url
 */
export async function customRequest(url) {
  let d = dispatcher;
  if (url.hostname === "datos.agroindustria.gob.ar") {
    d = ignoreTlsDispatcher;
  }
  const res = await request(url.toString(), {
    headers: getHeaders(url),
    dispatcher,
  });
  if (res.statusCode >= 300 && res.statusCode <= 399)
    throw new TooManyRedirectsError();
  if (res.statusCode < 200 || res.statusCode > 299)
    throw new StatusCodeError(res.statusCode);

  return res;
}
