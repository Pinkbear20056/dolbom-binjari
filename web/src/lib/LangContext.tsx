import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LANG, messages, type Lang, type Messages } from './i18n';
import { storage } from './storage';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue>({ lang: DEFAULT_LANG, setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => storage.getLang() ?? DEFAULT_LANG);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = messages[lang].title;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    storage.setLang(next);
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue & { t: Messages } {
  const { lang, setLang } = useContext(LangContext);
  return { lang, setLang, t: messages[lang] };
}
