import { Dispatcher, request, Agent } from "undici";
import { userAgent } from "./config.js";

const dispatcher = new Agent({
  connect: { timeout: 60 * 1000 },
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
