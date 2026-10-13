import { useContent, useT } from '../../i18n/LanguageContext';
import shared from './panelShared.module.css';

/** How to reach the band: email, phone and their social profiles, all as plain links. */
export function ContactPanel() {
  const { contact } = useContent();
  const t = useT();

  return (
    <div>
      {(contact.email || contact.phone) && (
        <ul className={`${shared.list} ${shared.section}`}>
          {contact.email && (
            <li className={shared.listItem}>
              <span className={shared.statusText}>{t('Emaila')}</span>
              <br />
              <a className={shared.secondaryLink} href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            </li>
          )}
          {contact.phone && (
            <li className={shared.listItem}>
              <span className={shared.statusText}>{t('Telefonoa')}</span>
              <br />
              <a className={shared.secondaryLink} href={`tel:${contact.phoneHref ?? contact.phone}`}>
                {contact.phone}
              </a>
            </li>
          )}
        </ul>
      )}

      {contact.socialLinks.length > 0 && (
        <div className={shared.section}>
          <h3>{t('Sareak')}</h3>
          <ul className={shared.list}>
            {contact.socialLinks.map((link) => (
              <li key={link.url}>
                <a className={shared.secondaryLink} href={link.url} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
