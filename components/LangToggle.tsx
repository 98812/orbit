'use client';

import { useLang } from './LanguageProvider';

export default function LangToggle() {
  const { lang, setLang } = useLang();

  return (
    <button
      className="lang-btn"
      onClick={() => setLang(lang === 'en' ? 'ja' : 'en')}
      aria-label={lang === 'en' ? 'Switch to Japanese' : '英語に切り替え'}
      title={lang === 'en' ? '日本語' : 'English'}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <span className="lang-code mono">{lang === 'en' ? 'EN' : 'JA'}</span>
    </button>
  );
}
