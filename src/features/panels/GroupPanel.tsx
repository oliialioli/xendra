import { xendraContent } from '../../content/xendraContent';
import { assetPath } from '../../lib/assetPath';
import shared from './panelShared.module.css';
import styles from './GroupPanel.module.css';

/** How many members go on the top row; the rest go below. */
const TOP_ROW = 3;

export function GroupPanel() {
  const { members } = xendraContent;
  const rows = [members.slice(0, TOP_ROW), members.slice(TOP_ROW)];

  return (
    <div>
      <p className={shared.lead}>{xendraContent.band.bio}</p>
      {rows.map((row, i) => (
        <div key={i} className={styles.members}>
          {row.map((member) => (
            <article key={member.id} className={`${shared.card} ${styles.member}`}>
              {member.photoPath ? (
                <img src={assetPath(member.photoPath)} alt={member.name} className={styles.portrait} />
              ) : (
                <div aria-hidden="true" className={styles.portrait} />
              )}
              <h3 className={`${shared.cardTitle} ${styles.name}`}>{member.name}</h3>
              <p className={`${shared.statusText} ${styles.instrument}`}>{member.instrument}</p>
              {member.bio && <p className={shared.lead}>{member.bio}</p>}
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}
