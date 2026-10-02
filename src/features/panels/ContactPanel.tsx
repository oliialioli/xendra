import { xendraContent } from '../../content/xendraContent';
import shared from './panelShared.module.css';

/** How to reach the band: email, phone and their social profiles, all as plain links. */
export function ContactPanel() {
  const { contact } = xendraContent;

  return (
    <div>
      {(contact.email || contact.phone) && (
        <ul className={`${shared.list} ${shared.section}`}>
          {contact.email && (
            <li className={shared.listItem}>
              <span className={shared.statusText}>Emaila</span>
              <br />
              <a className={shared.secondaryLink} href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            </li>
          )}
          {contact.phone && (
            <li className={shared.listItem}>
              <span className={shared.statusText}>Telefonoa</span>
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
          <h3>Sareak</h3>
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
