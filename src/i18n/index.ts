import { createElement, Fragment, type ReactNode } from "react";
import en from "./locales/en";
import fr from "./locales/fr";

// Minimal i18n without extra dependency.
// English is the reference: any key missing from another locale falls back to it.
export type TranslationKey = keyof typeof en;
export type Translations = Partial<Record<TranslationKey, string>>;

const locales: Record<string, Translations> = { en, fr };

// Steam may report its UI language either as a name ("french") or as a code ("fr-FR").
const STEAM_LANGUAGE_NAMES: Record<string, string> = {
  english: "en",
  french: "fr",
};

function normalize(lang?: string): string | undefined {
  if (!lang) return undefined;
  const lower = lang.toLowerCase();
  return STEAM_LANGUAGE_NAMES[lower] ?? lower.split(/[-_]/)[0];
}

let cachedLanguage: string | undefined;

/**
 * Language of the Steam UI: Steam's own localization manager first,
 * then the CEF browser language (which follows the Steam language).
 */
export function getLanguage(): string {
  if (!cachedLanguage) {
    const detected =
      normalize(window.LocalizationManager?.m_rgLocalesToUse?.[0]) ??
      normalize(navigator.language);
    cachedLanguage = (detected && detected in locales) ? detected : "en";
  }
  return cachedLanguage;
}

// French typography: non-breaking space before ? ! : ; % » and after «.
// Applied to the translated template only, never to the inserted values.
function applyTypography(text: string, lang: string): string {
  if (lang !== "fr") return text;
  return text
    .replace(/ ([?!:;%»])/g, "\u00a0$1")
    .replace(/« /g, "«\u00a0");
}

function getTemplate(key: TranslationKey): string {
  const lang = getLanguage();
  return applyTypography(locales[lang]?.[key] ?? en[key], lang);
}

/**
 * Translates a key, replacing {{name}} placeholders with the given values.
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  return getTemplate(key).replace(/{{(\w+)}}/g, (match, name) =>
    params && name in params ? String(params[name]) : match);
}

/**
 * Same as t(), but placeholders can be React nodes (e.g. <b>, <i>, links).
 */
export function tx(key: TranslationKey, params: Record<string, ReactNode>): ReactNode {
  const parts = getTemplate(key)
    .split(/({{\w+}})/g)
    .filter(part => part !== "")
    .map(part => {
      const name = part.match(/^{{(\w+)}}$/)?.[1];
      return (name && name in params) ? params[name] : part;
    });
  return createElement(Fragment, null, ...parts);
}
