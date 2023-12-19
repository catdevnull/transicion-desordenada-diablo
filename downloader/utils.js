import { normalize } from "node:path";

// https://security.stackexchange.com/a/123723
/**
 * @argument {string} path
 */
export function sanitizeSuffix(path) {
  return normalize(path).replace(/^(\.\.(\/|\\|$))+/, "");
}

// https://stackoverflow.com/a/7376645
/** @argument {any[]} array */
export function hasDuplicates(array) {
  return new Set(array).size !== array.length;
}

// https://stackoverflow.com/a/12646864
/** @param {any[]} array */
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/** @argument {number} ms */
export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @argument {Date} date */
export async function waitUntil(date) {
  const relative = +date - Date.now();
  console.debug({ relative, date, now: Date.now() });
  if (relative <= 0) return;
  await wait(relative);
}
