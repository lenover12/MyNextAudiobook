import { useEffect, useState } from "react";
import { getCountryCode } from "../utils/getGeo";
import { buildAudibleLink } from "../utils/buildAudibleLink";

export function useGeoAffiliateLink(asin?: string) {
  const [country, setCountry] = useState("US");
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    getCountryCode().then(setCountry);
  }, []);

  useEffect(() => {
    if (asin) {
      setLink(buildAudibleLink(asin, country));
    }
  }, [asin, country]);

  return link;
}
