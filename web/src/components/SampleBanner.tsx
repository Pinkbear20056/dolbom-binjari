import { Link, useLocation } from 'react-router-dom';
import sprout from '../assets/sprout-brand.svg';
import { useLang } from '../lib/LangContext';
import { otherLang } from '../lib/i18n';

export default function SampleBanner() {
  const { pathname } = useLocation();
  const { lang, setLang, t } = useLang();
  const section = pathname === '/parent' ? t.sectionParent : pathname.startsWith('/teacher/') ? t.sectionTeacher : '';

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-brand">
          <img src={sprout} width={40} height={40} alt="" />
          {t.brand}
        </Link>
        {section && <span className="site-section">{section}</span>}
        <span className="sample-label" role="note" aria-label={t.sampleDataAria}>
          {t.sampleData}
        </span>
        <button type="button" className="lang-btn" lang={otherLang(lang)} aria-label={t.switchLangAria} onClick={() => setLang(otherLang(lang))}>
          {t.switchLang}
        </button>
      </div>
    </header>
  );
}
