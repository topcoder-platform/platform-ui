import React from "react";
import PT from "prop-types";
import { map } from "lodash";
import moment from "moment";

import config from "../../../config";
import { ReactComponent as CalendarIcon } from "../../../assets/images/calendar.svg";

import styles from "./style.module.scss";
import { styled as styledCss } from "../../../utils";
const styled = styledCss(styles)

export default function ThriveArticles({ articles }) {
  const formatTitle = (title) => {
    if (title.length <= 28) {
      return title;
    }
    if (title[28] === "") {
      return `${title.substr(0, 29)}..`;
    }
    return `${title.substr(0, 28)}..`;
  };

  const getPageUrl = (article) =>
    article.externalArticle && article.contentUrl
      ? article.contentUrl
      : `${config.URL.BASE}${config.TC_EDU_BASE_PATH}${
          config.TC_EDU_ARTICLES_PATH
        }/${article.slug || article.title}`;

  const items = map(articles, (a, idx) => (
    <div className={styled("article")} key={idx}>
      <div className={styled("article-left")}>
        <div className={styled("article-read-time")}>{a.fields.readTime}</div>
        <div className={styled("article-title")}>
          <a
            href={getPageUrl(a.fields)}
            target="_blank"
            rel="noopener noreferrer"
            title={a.fields.title}
          >
            {formatTitle(a.fields.title)}
          </a>
        </div>
        <div className={styled("article-create-time")}>
          <CalendarIcon />
          {moment(a.creationDate).format("MMM DD, YYYY")}
        </div>
      </div>
      <div
        className={styled("article-right")}
        style={{
          backgroundImage: `url(${
            a.fields.featuredImage ? a.fields.featuredImage.file.url : ""
          })`,
        }}
      />
    </div>
  ));
  return (
    <div id="recommendedThriveArticles" className={styled("container")}>
      <div className={styled("header-container")}>
        <div className={styled("header")}>Recommended THRIVE Articles</div>
        <div className={styled("right-url")}>
          <a href={config.URL.THRIVE} rel="noopener noreferrer" target="_blank">
            Explore THRIVE
          </a>
        </div>
      </div>
      <div className={styled("articles")}>{items}</div>
    </div>
  );
}

ThriveArticles.defaultProps = {
  articles: [],
};

ThriveArticles.propTypes = {
  articles: PT.arrayOf(PT.object),
};
