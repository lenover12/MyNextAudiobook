export const countryOptions = [
  { code: "us", label: "United States" },
  { code: "uk", label: "United Kingdom" },
  { code: "de", label: "Germany" },
  { code: "fr", label: "France" },
  { code: "au", label: "Australia" },
  { code: "ca", label: "Canada" },
  { code: "in", label: "India" },
  { code: "it", label: "Italy" },
  { code: "jp", label: "Japan" },
  { code: "es", label: "Spain" },
] as const;

export type CountryCode = (typeof countryOptions)[number]["code"];

export const regionToStore: Record<CountryCode, string> = {
  us: "audible.com",
  uk: "audible.co.uk",
  de: "audible.de",
  fr: "audible.fr",
  au: "audible.com.au",
  ca: "audible.ca",
  in: "audible.in",
  it: "audible.it",
  jp: "audible.co.jp",
  es: "audible.es",
};

const EUROPE_TO_UK = new Set([
  "ie","nl","se","no","dk","fi","is","gr","cz","sk","hu","pl","ro","bg","hr","si","lt","lv","ee",
  "al","ba","mk","me","xk"
]);
const TO_DE = new Set(["at","ch","li"]);
const TO_FR = new Set(["be","lu","mc"]);
const TO_IT = new Set(["sm","va"]);
const TO_ES = new Set(["pt","ad","gi"]);
const TO_AU = new Set([
  "nz","pg","fj","sb","vu","ws","to","ki","tv","nr","pf","nc","gu","mp"
]);
const AMERICAS_TO_US = new Set([
  "mx","br","ar","cl","co","pe","ve","ec","uy","py","bo","cr","pa","gt","hn","ni","sv",
  "do","pr","jm","tt","bs","bb","bz","gy","sr","ht"
]);
const AFRICA_TO_US = new Set([
  "za","ng","eg","ma","dz","ke","gh","et","tz","ug","sn","ci","cm","tn","sd","zw","zm","na","bw",
  "ao","mz","mg","ml","bf","ne","rw","bj","so","gm","ga","gn","cg","cd","lr","sl","mw","cv","sc",
  "ls","sz","mr","td","er","dj","gq","bi","km","st"
]);
const ASIA_TO_US = new Set([
  "sg","hk","cn","tw","kr","my","th","ph","vn","id","pk","bd","lk","np","kh","la","mm","bn","mn",
  "kz","uz","tm","tj","kg","af","bt","mv"
]);
const MIDEAST_TO_US = new Set([
  "ae","sa","qa","kw","bh","om","jo","lb","iq","ye","sy","ps","il"
]);

export function mapCountryToAudibleRegion(isoCode: string): CountryCode {
  const c = isoCode.toLowerCase();

  //native stores
  if (c === "us") return "us";
  if (c === "gb" || c === "uk") return "uk";
  if (c === "de") return "de";
  if (c === "fr") return "fr";
  if (c === "au") return "au";
  if (c === "ca") return "ca";
  if (c === "in") return "in";
  if (c === "it") return "it";
  if (c === "jp") return "jp";
  if (c === "es") return "es";

  //regional heuristics
  if (EUROPE_TO_UK.has(c)) return "uk";
  if (TO_DE.has(c)) return "de";
  if (TO_FR.has(c)) return "fr";
  if (TO_IT.has(c)) return "it";
  if (TO_ES.has(c)) return "es";
  if (TO_AU.has(c)) return "au";
  if (AMERICAS_TO_US.has(c)) return "us";
  if (AFRICA_TO_US.has(c)) return "us";
  if (ASIA_TO_US.has(c)) return "us";
  if (MIDEAST_TO_US.has(c)) return "us";

  return "us";
}