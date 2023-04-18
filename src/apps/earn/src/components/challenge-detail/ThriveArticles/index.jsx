import PT from 'prop-types';
import { map } from 'lodash';
import config from '@earn/config';
import moment from 'moment';

import { LinkButton } from '~/libs/ui';

import { ReactComponent as CalendarIcon } from '@earn/assets/images/calendar.svg';
import { styled as styledCss } from "../../../utils";

import styles from './style.scss';
const styled = styledCss(styles);

export default function ThriveArticles({ articles }) {
  const formatTitle = (title) => {
    if (title.length <= 28) {
      return title;
    }
    if (title[28] === '') {
      return `${title.substr(0, 29)}..`;
    }
    return `${title.substr(0, 28)}..`;
  };

  const getPageUrl = article => (article.externalArticle && article.contentUrl
    ? article.contentUrl
    : `${config.URL.THRIVE}${config.TC_EDU_ARTICLES_PATH}/${article.slug || article.title}`);

  const items = map(articles, (a, idx) => (
    <div className={styles.article} key={idx}>
      <div className={styles['article-left']}>
        <div className={styles['article-read-time']}>{a.fields.readTime}</div>
        <div className={styles['article-title']}><a href={getPageUrl(a.fields)} target="_blank" rel="noopener noreferrer" title={a.fields.title}>{formatTitle(a.fields.title)}</a></div>
        <div className={styles['article-create-time']}><CalendarIcon />{moment(a.creationDate).format('MMM DD, YYYY')}</div>
      </div>
      <div
        className={styled("article-right")}
        style={{
          backgroundImage: `url(${a.fields.featuredImage ? a.fields.featuredImage.file.url : ''})`,
        }}
      />
    </div>
  ));
  return (
    <div id="recommendedThriveArticles" className={styles.container}>
      <hr className={styles.hr} />
      <div className={styles['header-container']}>
        <div className={styles.header}>
          Recommended THRIVE Articles
        </div>
        <LinkButton
            secondary
            target='_blank'
            rel='noopener noreferrer'
            to={config.URL.THRIVE}
        >
          EXPLORE THRIVE
        </LinkButton>
      </div>
      <div className={styles.articles}>
        {items}
      </div>
    </div>
  );
}

ThriveArticles.defaultProps = {
  articles: [],
};

ThriveArticles.propTypes = {
  articles: PT.arrayOf(PT.object),
};
