import { DevelopmentTrackEventTag } from '@earn/components/challenge-detail/tags';
import VerifiedIcon from '@earn/assets/images/icon-verified.svg';
import Tooltip from '@earn/components/challenge-detail/Tooltip';
import PT from 'prop-types';
import { styled as styledCss } from '@earn/utils';
import styles from './style.scss';
import cn from 'classnames';

const styled = styledCss(styles);

/**
 * Verified Tag Componenet
 */
export default function VerifiedTag({
  challengesUrl, item, onClick, recommended,
}) {
  const verifiedTagTooltip = skill => (
    <div className={styles.tctooltiptext}>
      <p>{skill} is verified based <br /> on past challenges you won</p>
    </div>
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
        trigger={['hover', 'focus']}
      >
        <DevelopmentTrackEventTag
          onClick={() => onClick(item.trim())}
          key={item}
          role="button"
          to={tagRedirectLink(item)}
        >
          <VerifiedIcon className={styles['verified-tag']} />
          <span className={styled(cn({ 'verified-tag-text': recommended )})}>{item}</span>
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
