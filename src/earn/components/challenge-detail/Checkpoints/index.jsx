/* global document */
import React from 'react';
import PT from 'prop-types';

import ArrowDown from '@earn/assets/images/icon-arrow-down-black.svg';
import ArrowUp from '@earn/assets/images/icon-arrow-up-black.svg';

import './styles.scss';

function Checkpoints(props) {
  const {
    checkpoints,
    toggleCheckpointFeedback,
  } = props;
  const {
    checkpointResults,
    generalFeedback,
  } = checkpoints;

  return (
    <div styleName="challenge-detail-checkpoints">
      {/* <div styleName="challenge-checkpoint-list">
        {
          checkpointResults && checkpointResults.map((item, index) => (
            <button
              key={item.submissionId}
              styleName="challenge-checkpoint-li"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementsByClassName(style['challenge-checkpoint-winners'])[index]
                  .scrollIntoView(true);
                toggleCheckpointFeedback(item.submissionId, true);
              }}
              type="button"
            >
              #
              {item.submissionId}
            </button>
          ))
        }
      </div> */}
      <div styleName="challenge-checkpoint-detail">
        <h2>
          Checkpoint Winners & General Feedback
        </h2>
        <h5>Check forums for general feedback</h5>
        <p
          dangerouslySetInnerHTML={{ // eslint-disable-line react/no-danger
            __html: generalFeedback || '',
          }}
        />
        {
          checkpointResults && checkpointResults.map(item => (
            <div key={item.submissionId} styleName="challenge-checkpoint-winners">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleCheckpointFeedback(item.submissionId, !item.expanded);
                }}
                styleName="challenge-checkpoint-submission"
                type="button"
              >
                <span>
                  <span styleName="feedback-text">
                    Feedback
                    {' '}
                  </span>
                  #
                  {item.submissionId}
                </span>
                <span styleName="challenge-checkpoint-expander">
                  {
                    item.expanded ? <ArrowUp /> : <ArrowDown />
                  }
                </span>
              </button>
              {
                item.expanded
                && (
                <p
                  styleName="challenge-checkpoint-feedback"
                  dangerouslySetInnerHTML={{ // eslint-disable-line react/no-danger
                    __html: item.feedback || '<span>Empty Feedback</span>',
                  }}
                />
                )
              }
            </div>
          ))
        }
      </div>
    </div>
  );
}

Checkpoints.propTypes = {
  checkpoints: PT.shape({
    checkpointResults: PT.arrayOf(PT.shape()).isRequired,
    generalFeedback: PT.string,
  }).isRequired,
  toggleCheckpointFeedback: PT.func.isRequired,
};

export default Checkpoints;
