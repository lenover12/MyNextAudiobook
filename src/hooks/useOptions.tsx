import React, { createContext, useContext, useState, useEffect } from "react";
import { loadOptions, saveOptions, type Options } from "../utils/optionsStorage";

type OptionsContextValue = {
  options: Options;
  setOptions: (updater: (prev: Options) => Options) => void;
};

const OptionsContext = createContext<OptionsContextValue | undefined>(undefined);

export function OptionsProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptionsState] = useState<Options>(loadOptions);

  useEffect(() => {
    saveOptions(options);
  }, [options]);

  const setOptions = (updater: (prev: Options) => Options) => {
    setOptionsState((prev) => {
      const next = updater(prev);
      return next;
    });
  };

  return (
    <OptionsContext.Provider value={{ options, setOptions }}>
      {children}
    </OptionsContext.Provider>
  );
}

export function useOptions() {
  const ctx = useContext(OptionsContext);
  if (!ctx) throw new Error("useOptions must be used within OptionsProvider");
  return ctx;
}
