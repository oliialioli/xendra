import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { App } from './app/App';
import { legacyRedirect } from './content/sectionPaths';
import { DEFAULT_LANG, localizePath, splitLangPath } from './i18n/languages';
import { rememberedLang } from './i18n/rememberedLang';

// Links from before the site had real paths (xendra.eus/#/musica): rewritten
// to the current address before the router ever reads it.
const movedTo = legacyRedirect(window.location);
if (movedTo) window.history.replaceState(null, '', movedTo);
// An old link opened while already on the site only changes the hash (no
// page load): go to where it leads now.
window.addEventListener('hashchange', () => {
  const target = legacyRedirect(window.location);
  if (target) window.location.replace(target);
});

// Someone who chose another language on an earlier visit and arrives at a
// plain (Basque) address gets that page in their language.
const chosen = rememberedLang();
const arrived = splitLangPath(window.location.pathname);
if (chosen && chosen !== DEFAULT_LANG && arrived.lang === DEFAULT_LANG && !/^\/eu(\/|$)/.test(window.location.pathname)) {
  window.history.replaceState(null, '', localizePath(chosen, arrived.path) + window.location.search);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
