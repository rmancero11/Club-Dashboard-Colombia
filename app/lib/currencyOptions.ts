import currencyCodes from "currency-codes";
import getSymbolFromCurrency from "currency-symbol-map";

const dn = new Intl.DisplayNames(["es"], { type: "currency" });

export type CurrencyOption = { value: string; label: string };

export function getCurrencyOptions(): CurrencyOption[] {
  const codes = currencyCodes.codes(); 

  const opts = codes.map((code) => {
    const nameEs = dn.of(code) || code; 
    const symbol = getSymbolFromCurrency(code) || "";
    const nice = symbol ? `${code} — ${nameEs} (${symbol})` : `${code} — ${nameEs}`;
    return { value: code, label: nice };
  });

  return opts.sort((a, b) => a.label.localeCompare(b.label, "es"));
}
