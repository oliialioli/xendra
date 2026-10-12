import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { App } from './app/App';
import { legacyRedirect } from './content/sectionPaths';

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
