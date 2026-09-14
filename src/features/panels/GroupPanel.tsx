import { xendraContent } from '../../content/xendraContent';
import { assetPath } from '../../lib/assetPath';
import shared from './panelShared.module.css';

export function GroupPanel() {
  return (
    <div>
      <p className={shared.lead}>{xendraContent.band.bio}</p>
      <div className={shared.grid}>
        {xendraContent.members.map((member) => (
          <article key={member.id} className={shared.card}>
            {member.photoPath ? (
              <img
                src={assetPath(member.photoPath)}
                alt={member.name}
                style={{
                  width: '100%',
                  aspectRatio: '4 / 5',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: '100%',
                  aspectRatio: '4 / 5',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-sage)',
                }}
              />
            )}
            <h3 className={shared.cardTitle}>{member.name}</h3>
            <p className={shared.statusText}>{member.instrument}</p>
            <p className={shared.lead}>{member.bio}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
