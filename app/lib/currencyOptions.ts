import currencyCodes from "currency-codes";
import getSymbolFromCurrency from "currency-symbol-map";

const dn = new Intl.DisplayNames(["es"], { type: "currency" });

export type CurrencyOption = { value: string; label: string };

export function getCurrencyOptions(): CurrencyOption[] {
  // currency-codes ya trae el set ISO-4217
  const codes = currencyCodes.codes(); // string[] como ["USD","EUR","COP",...]

  // Evita duplicados y ordena alfabéticamente por nombre en español
  const opts = codes.map((code) => {
    const nameEs = dn.of(code) || code; // "dólar estadounidense", "euro", ...
    const symbol = getSymbolFromCurrency(code) || ""; // "$", "€", "¥", ...
    const nice = symbol ? `${code} — ${nameEs} (${symbol})` : `${code} — ${nameEs}`;
    return { value: code, label: nice };
  });

  return opts.sort((a, b) => a.label.localeCompare(b.label, "es"));
}
