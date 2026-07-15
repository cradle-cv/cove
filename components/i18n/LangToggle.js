'use client';
import { useLanguage } from './LanguageContext';

export default function LangToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <button
      className="lang-toggle"
      onClick={() => setLang(lang === 't' ? 's' : 't')}
      data-no-convert
      aria-label={lang === 't' ? '切换到简体' : '切換到繁體'}
      title={lang === 't' ? '简体 / 繁體' : '简体 / 繁體'}
    >
      {lang === 't' ? '简' : '繁'}
    </button>
  );
}
