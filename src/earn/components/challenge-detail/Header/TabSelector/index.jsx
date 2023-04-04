/* eslint jsx-a11y/no-static-element-interactions:0,jsx-a11y/anchor-is-valid:0 */
/*
  Stateless tab control to switch between various views available in
  challenge detail page.
*/

import _ from "lodash";
import React from "react";
import PT from "prop-types";
import { TABS as DETAIL_TABS } from "@earn/actions/page/challenge-details";
import config from "@earn/config";

import style from "./style.module.scss";

function getSelectorStyle(selectedView, currentView) {
  return `challenge-selector-common ${
    selectedView === currentView
      ? "challenge-selected-view"
      : "challenge-unselected-view"
  }`;
}

export default function ChallengeViewSelector(props) {
  const {
    isLoggedIn,
    challenge,
    isMM,
    checkpointCount,
    numOfRegistrants,
    numOfCheckpointSubmissions,
    numOfSubmissions,
    numWinners,
    onSelectorClicked,
    selectedView,
    trackLower,
    hasRegistered,
    mySubmissions,
  } = props;

  const numOfSub = numOfSubmissions + (numOfCheckpointSubmissions || 0);
  const forumId = _.get(challenge, "legacy.forumId") || 0;
  const discuss = _.get(challenge, "discussions", []).filter(
    (d) => d.type === "challenge" && !_.isEmpty(d.url)
  );
  const roles = _.get(challenge, "userDetails.roles") || [];
  const isDesign = trackLower === "design";

  const forumEndpoint = isDesign
    ? `/?module=ThreadList&forumID=${forumId}`
    : `/?module=Category&categoryID=${forumId}`;

  const handleSelectorClicked = (e, selector) => {
    /* eslint-env browser */
    e.preventDefault();
    onSelectorClicked(selector);
  };

  const handleScroll = (e) => {
    const scrollElement = e.target;

    const cname = style.mask;
    /* eslint-env browser */
    const masks = document.getElementsByClassName(cname);
    const mask1 = masks[0];
    const mask2 = masks[1];
    // When the scrollbar reaches end, disable right mask.
    if (
      scrollElement.scrollWidth - scrollElement.scrollLeft ===
      scrollElement.clientWidth
    ) {
      mask2.style.display = "none";
    } else if (scrollElement.scrollLeft === 0) {
      // At the beginning, disable left mask.
      mask1.style.display = "none";
    } else {
      // Show both masks in between.
      mask1.style.display = "block";
      mask2.style.display = "block";
    }
  };

  return (
    <div styleName="container" onScroll={handleScroll}>
      <div styleName="mask left" />
      <div styleName="mask right" />
      <div styleName="challenge-view-selector">
        <a
          tabIndex="0"
          role="tab"
          aria-selected={selectedView === DETAIL_TABS.DETAILS}
          onClick={(e) => {
            handleSelectorClicked(e, DETAIL_TABS.DETAILS);
          }}
          onKeyPress={(e) => {
            handleSelectorClicked(e, DETAIL_TABS.DETAILS);
          }}
          styleName={getSelectorStyle(selectedView, DETAIL_TABS.DETAILS)}
        >
          DETAILS
        </a>
        {numOfRegistrants ? (
          <a
            tabIndex="0"
            role="tab"
            aria-selected={selectedView === DETAIL_TABS.REGISTRANTS}
            onClick={(e) => {
              handleSelectorClicked(e, DETAIL_TABS.REGISTRANTS);
            }}
            onKeyPress={(e) => {
              handleSelectorClicked(e, DETAIL_TABS.REGISTRANTS);
            }}
            styleName={getSelectorStyle(selectedView, DETAIL_TABS.REGISTRANTS)}
          >
            REGISTRANTS ({numOfRegistrants})
          </a>
        ) : null}
        {isDesign && checkpointCount > 0 && (
          <a
            tabIndex="0"
            role="tab"
            aria-selected={selectedView === DETAIL_TABS.CHECKPOINTS}
            onClick={(e) => {
              handleSelectorClicked(e, DETAIL_TABS.CHECKPOINTS);
            }}
            onKeyPress={(e) => {
              handleSelectorClicked(e, DETAIL_TABS.CHECKPOINTS);
            }}
            styleName={getSelectorStyle(selectedView, DETAIL_TABS.CHECKPOINTS)}
          >
            CHECKPOINTS ({checkpointCount})
          </a>
        )}
        {numOfSub && isLoggedIn ? (
          <a
            tabIndex="0"
            role="tab"
            aria-selected={selectedView === DETAIL_TABS.SUBMISSIONS}
            onClick={(e) => {
              handleSelectorClicked(e, DETAIL_TABS.SUBMISSIONS);
            }}
            onKeyPress={(e) => {
              handleSelectorClicked(e, DETAIL_TABS.SUBMISSIONS);
            }}
            styleName={getSelectorStyle(selectedView, DETAIL_TABS.SUBMISSIONS)}
          >
            SUBMISSIONS ({numOfSub})
          </a>
        ) : null}
        {hasRegistered && isMM && mySubmissions ? (
          <a
            tabIndex="0"
            role="tab"
            aria-selected={selectedView === DETAIL_TABS.MY_SUBMISSIONS}
            onClick={(e) => {
              handleSelectorClicked(e, DETAIL_TABS.MY_SUBMISSIONS);
            }}
            onKeyPress={(e) => {
              handleSelectorClicked(e, DETAIL_TABS.MY_SUBMISSIONS);
            }}
            styleName={getSelectorStyle(
              selectedView,
              DETAIL_TABS.MY_SUBMISSIONS
            )}
          >
            MY SUBMISSIONS ({mySubmissions.length})
          </a>
        ) : null}
        {hasRegistered && mySubmissions.length > 0 && (
          <a
            href={`${config.URL.SUBMISSION_REVIEW}/challenges/${challenge.legacyId}`}
            styleName="challenge-selector-common challenge-unselected-view"
            target="_blank"
            rel="oopener noreferrer"
          >
            SUBMISSION REVIEW
          </a>
        )}
        {numWinners ? (
          <a
            tabIndex="0"
            role="tab"
            aria-selected={selectedView === DETAIL_TABS.WINNERS}
            onClick={(e) => {
              handleSelectorClicked(e, DETAIL_TABS.WINNERS);
            }}
            onKeyPress={(e) => {
              handleSelectorClicked(e, DETAIL_TABS.WINNERS);
            }}
            styleName={getSelectorStyle(selectedView, DETAIL_TABS.WINNERS)}
          >
            WINNERS ({numWinners})
          </a>
        ) : null}
        {(() => {
          if (hasRegistered || Boolean(roles.length)) {
            if (!_.isEmpty(discuss)) {
              return discuss.map((d) => (
                <a
                  href={d.url}
                  styleName={getSelectorStyle(
                    selectedView,
                    DETAIL_TABS.CHALLENGE_FORUM
                  )}
                  target="_blank"
                  rel="oopener noreferrer"
                >
                  CHALLENGE DISCUSSION
                </a>
              ));
            }
            if (forumId > 0) {
              return (
                <a
                  href={`${config.URL.FORUMS}${forumEndpoint}`}
                  styleName={getSelectorStyle(
                    selectedView,
                    DETAIL_TABS.CHALLENGE_FORUM
                  )}
                  target="_blank"
                  rel="oopener noreferrer"
                >
                  CHALLENGE FORUM
                </a>
              );
            }
          }
          return "";
        })()}
      </div>
    </div>
  );
}

ChallengeViewSelector.defaultProps = {
  isLoggedIn: false,
  challenge: {},
  isMM: false,
  checkpointCount: 0,
  numOfRegistrants: 0,
  numOfCheckpointSubmissions: 0,
  numOfSubmissions: 0,
};

ChallengeViewSelector.propTypes = {
  isLoggedIn: PT.bool,
  challenge: PT.shape({
    legacyId: PT.oneOfType([PT.string, PT.number]),
    legacy: PT.shape({
      forumId: PT.number,
    }),
    userDetails: PT.shape({
      roles: PT.arrayOf(PT.string),
    }),
  }),
  isMM: PT.bool,
  checkpointCount: PT.number,
  numOfRegistrants: PT.number,
  numOfCheckpointSubmissions: PT.number,
  numOfSubmissions: PT.number,
  numWinners: PT.number.isRequired,
  onSelectorClicked: PT.func.isRequired,
  selectedView: PT.string.isRequired,
  trackLower: PT.string.isRequired,
  hasRegistered: PT.bool.isRequired,
  mySubmissions: PT.arrayOf(PT.shape()).isRequired,
};
