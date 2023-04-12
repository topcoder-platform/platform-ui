/**
 * Actions related to the news feed.
 */

/**
 * TODO: REMOVE FILE?? used??
 */

import _ from 'lodash';
import { toJson } from '@earn/utils/xml2json';
import { createActions } from 'redux-actions';

/* global fetch */
import 'isomorphic-fetch';

/**
 * Gets XML news feed from the specified URL.
 * @param {String} url
 */
function getNews(url) {
  return fetch(url)
    .then(res => (res.ok ? res.text() : new Error(res.statusText)))
    .then(res => toJson(res));
}

export default createActions({
  TC_COMMUNITIES: {
    NEWS: {
      DROP: _.noop,
      GET_NEWS_INIT: _.noop,
      GET_NEWS_DONE: getNews,
    },
  },
});
