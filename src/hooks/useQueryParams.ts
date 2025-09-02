import { useMemo } from "react";

export function useQueryParams() {
  return useMemo(() => new URLSearchParams(window.location.search), []);
}