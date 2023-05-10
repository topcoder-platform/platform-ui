import PT from 'prop-types';
import styles from './style.scss';

import { Tooltip } from '~/libs/ui';
import { ReactComponent as VerifiedIcon } from '@earn/assets/images/icon-verified.svg';
import { styled as styledCss } from '@earn/utils';

import { DevelopmentTrackEventTag } from '../Tags';

const styled = styledCss(styles);

/**
 * Verified Tag Componenet
 */
function VerifiedTag({
  challengesUrl, item, onClick, recommended,
}) {
  const verifiedTagTooltip = skill => (
    <p>{skill} is verified based <br /> on past challenges you won</p>
  );

  const tagRedirectLink = (skill) => {
    if (challengesUrl && skill.indexOf('+') !== 0) {
      return `${challengesUrl}?search=${
        encodeURIComponent(skill)}`;
    }
    return null;
  };

  return (
    <div className={styles['recommended-challenge-tooltip']}>
      <Tooltip
        id="recommended-tip"
        content={verifiedTagTooltip(item)}
        place="top"
      >
        <DevelopmentTrackEventTag
          onClick={() => onClick(item.trim())}
          key={item}
          role="button"
          to={tagRedirectLink(item)}
        >
          <VerifiedIcon className={styles['verified-tag']} />
          <span className={styled(recommended && 'verified-tag-text')}>{item}</span>
        </DevelopmentTrackEventTag>
      </Tooltip>
    </div>
  );
}

VerifiedTag.defaultProps = {
  challengesUrl: '',
  item: '',
  onClick: null,
  recommended: true,
};

VerifiedTag.propTypes = {
  challengesUrl: PT.string,
  item: PT.string,
  onClick: PT.func,
  recommended: PT.bool,
};

export default VerifiedTag
