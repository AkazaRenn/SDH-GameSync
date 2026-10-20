import { CLIPBOARD_KEY } from "./commonDefs";

let timeout: number | undefined = undefined;

function unsetTimeout() {
  if (timeout) {
    clearTimeout(timeout);
    timeout = undefined;
  }
}

function resetTimeout() {
  unsetTimeout();
  timeout = setTimeout(() => {
    localStorage.removeItem(CLIPBOARD_KEY);
    timeout = undefined;
  }, 5 * 60 * 1000);
}

export function copy(text: string) {
  resetTimeout();
  localStorage.setItem(CLIPBOARD_KEY, text);
}

export function paste(): string {
  resetTimeout();
  const text = localStorage.getItem(CLIPBOARD_KEY);
  return text ?? "";
}

export function clear() {
  unsetTimeout();
  localStorage.removeItem(CLIPBOARD_KEY);
}
