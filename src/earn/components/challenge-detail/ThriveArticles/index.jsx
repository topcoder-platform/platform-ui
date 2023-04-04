import React from "react";
import PT from "prop-types";
import { map } from "lodash";
import config from "@earn/config";
import moment from "moment";
import { ReactComponent as CalendarIcon } from "../../../assets/images/calendar.svg";

import "./style.module.scss";

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
    <div styleName="article" key={idx}>
      <div styleName="article-left">
        <div styleName="article-read-time">{a.fields.readTime}</div>
        <div styleName="article-title">
          <a
            href={getPageUrl(a.fields)}
            target="_blank"
            rel="noopener noreferrer"
            title={a.fields.title}
          >
            {formatTitle(a.fields.title)}
          </a>
        </div>
        <div styleName="article-create-time">
          <CalendarIcon />
          {moment(a.creationDate).format("MMM DD, YYYY")}
        </div>
      </div>
      <div
        styleName="article-right"
        style={{
          backgroundImage: `url(${
            a.fields.featuredImage ? a.fields.featuredImage.file.url : ""
          })`,
        }}
      />
    </div>
  ));
  return (
    <div id="recommendedThriveArticles" styleName="container">
      <div styleName="header-container">
        <div styleName="header">Recommended THRIVE Articles</div>
        <div styleName="right-url">
          <a href={config.URL.THRIVE} rel="noopener noreferrer" target="_blank">
            Explore THRIVE
          </a>
        </div>
      </div>
      <div styleName="articles">{items}</div>
    </div>
  );
}

ThriveArticles.defaultProps = {
  articles: [],
};

ThriveArticles.propTypes = {
  articles: PT.arrayOf(PT.object),
};
