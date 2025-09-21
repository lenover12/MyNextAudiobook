import { useEffect, useState } from "react";
import { useOptions } from "../hooks/useOptions";
import { getCountryCode } from "../utils/getGeo";
import { buildAudibleLink } from "../utils/buildAudibleLink";
import type { CountryCode } from "../dto/countries";

export function useGeoAffiliateLink(asin?: string) {
  const { options, setOptions } = useOptions();
  const [country, setCountry] = useState("US");
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    if (options.countryCode) {
      setCountry(options.countryCode as CountryCode);
    } else {
      getCountryCode().then((c) => {
        setCountry(c as CountryCode);
        setOptions((prev) => ({ ...prev, countryCode: c }));
      });
    }
  }, [options.countryCode, setOptions]);

  useEffect(() => {
    if (asin && country) {
      setLink(buildAudibleLink(asin, country as CountryCode));
    }
  }, [asin, country]);

  return link;
}
