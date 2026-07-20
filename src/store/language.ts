import { create } from "zustand";
import { persist } from "zustand/middleware";

type Lang = "en" | "tl";

interface LanguageStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (en: string, tl: string) => string;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      lang: "en",
      setLang: (lang) => set({ lang }),
      t: (en, tl) => (get().lang === "tl" ? tl : en),
    }),
    { name: "kss-language" }
  )
);

export const getT = (en: string, tl: string) =>
  useLanguageStore.getState().t(en, tl);
