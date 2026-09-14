import { useId, useMemo, useState, type FormEvent } from 'react';
import { xendraContent } from '../../content/xendraContent';
import { sendAnalyticsEvent } from '../../lib/analytics';
import shared from './panelShared.module.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<'name' | 'email' | 'reason' | 'message' | 'consent', string>>;

export function ContactPanel() {
  const { contact } = xendraContent;
  const formId = useId();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState(contact.reasons[0]?.id ?? '');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [mailtoHref, setMailtoHref] = useState<string | null>(null);
  const [validButEmailMissing, setValidButEmailMissing] = useState(false);

  const contactEmailAvailable = Boolean(contact.email);

  const reasonLabel = useMemo(
    () => contact.reasons.find((r) => r.id === reason)?.label ?? reason,
    [contact.reasons, reason],
  );

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (name.trim().length === 0) next.name = 'Adierazi zure izena.';
    if (!EMAIL_PATTERN.test(email)) next.email = 'Adierazi baliozko email bat.';
    if (reason.trim().length === 0) next.reason = 'Aukeratu arrazoi bat.';
    if (message.trim().length === 0) next.message = 'Idatzi mezu bat.';
    if (!consent) next.consent = 'Onartu behar duzu jarraitzeko.';
    return next;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMailtoHref(null);
      setValidButEmailMissing(false);
      return;
    }

    sendAnalyticsEvent({ type: 'contact_started' });
    if (!contact.email) {
      // Valid form, but there is nowhere real to send it yet -- never fake success.
      setValidButEmailMissing(true);
      return;
    }
    const subject = encodeURIComponent(`[Xendra] ${reasonLabel}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    setMailtoHref(`mailto:${contact.email}?subject=${subject}&body=${body}`);
  }

  return (
    <div>
      {!contactEmailAvailable && (
        <p className={shared.statusText}>
          TODO_CONTENT: kontaktu/kontratazio emaila berresteke.
        </p>
      )}

      <form className={shared.form} onSubmit={handleSubmit} noValidate>
        <div className={shared.field}>
          <label htmlFor={`${formId}-name`}>Izena</label>
          <input
            id={`${formId}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${formId}-name-error` : undefined}
          />
          {errors.name && (
            <p id={`${formId}-name-error`} className={shared.errorText}>
              {errors.name}
            </p>
          )}
        </div>

        <div className={shared.field}>
          <label htmlFor={`${formId}-email`}>Emaila</label>
          <input
            id={`${formId}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${formId}-email-error` : undefined}
          />
          {errors.email && (
            <p id={`${formId}-email-error`} className={shared.errorText}>
              {errors.email}
            </p>
          )}
        </div>

        <div className={shared.field}>
          <label htmlFor={`${formId}-reason`}>Arrazoia</label>
          <select id={`${formId}-reason`} value={reason} onChange={(e) => setReason(e.target.value)}>
            {contact.reasons.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={shared.field}>
          <label htmlFor={`${formId}-message`}>Mezua</label>
          <textarea
            id={`${formId}-message`}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? `${formId}-message-error` : undefined}
          />
          {errors.message && (
            <p id={`${formId}-message-error`} className={shared.errorText}>
              {errors.message}
            </p>
          )}
        </div>

        <div className={shared.field}>
          <label>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />{' '}
            Onartzen dut datu hauek mezu honi erantzuteko soilik erabiliko direla.
          </label>
          {errors.consent && <p className={shared.errorText}>{errors.consent}</p>}
        </div>

        {!mailtoHref && (
          <button type="submit" className={shared.primaryButton}>
            Prestatu mezua
          </button>
        )}

        {mailtoHref && (
          <div>
            <p className={shared.statusText}>
              Zure posta-aplikazioa irekiko da mezua prest dagoela. Xendrak ez du mezua zuzenean
              webgune honetatik bidaltzen.
            </p>
            <a className={shared.primaryButton} href={mailtoHref}>
              Ireki emaila
            </a>
          </div>
        )}

        {validButEmailMissing && (
          <p className={shared.statusText}>
            Oraindik ezin dugu bidalketa prestatu: kontaktu-emaila berresteke dago
            (TODO_CONTENT). Zure mezua ez da bidali ez gorde.
          </p>
        )}
      </form>

      {contact.socialLinks.length > 0 && (
        <div className={shared.section}>
          <h3>Sareak</h3>
          <ul className={shared.list}>
            {contact.socialLinks.map((link) => (
              <li key={link.url}>
                <a className={shared.secondaryLink} href={link.url}>
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
