/*
  Component renders my submission detail
*/

import React from 'react';
import PT from 'prop-types';
import _ from 'lodash';

import sortList from '@earn/utils/challenge-detail/sort';
import { ReactComponent as ArrowDown } from '@earn/assets/images/arrow-down.svg';
import { styled as styledCss } from '@earn/utils';
import { Tooltip } from '~/libs/ui';

import { ReactComponent as IconFail } from '../../icons/failed.svg';

import styles from './styles.scss';

const styled = styledCss(styles);

class SubmissionsDetailView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sortedSubmissions: [],
    };
    this.sortSubmissions = this.sortSubmissions.bind(this);
    this.getSubmissionsSortParam = this.getSubmissionsSortParam.bind(this);
    this.updateSortedSubmissions = this.updateSortedSubmissions.bind(this);
    this.getReviewName = this.getReviewName.bind(this);
  }

  componentDidMount() {
    this.updateSortedSubmissions();
  }

  componentDidUpdate(prevProps) {
    const { submission: { review }, submissionsSort } = this.props;
    if (
      !_.isEqual(prevProps.submission.review, review)
      || !_.isEqual(prevProps.submissionsSort, submissionsSort)
    ) {
      this.updateSortedSubmissions();
    }
  }

  /**
   * Get submission sort parameter
   */
  getSubmissionsSortParam() {
    const {
      submissionsSort,
    } = this.props;
    let { sort } = submissionsSort;
    const { field } = submissionsSort;
    if (!field) {
      return {
        field: null,
        sort: null,
      };
    }

    if (!sort) {
      sort = 'desc'; // default order for submission sorting
    }

    return {
      field,
      sort,
    };
  }

  /**
   * Get review name
   * @param {Object} review review object
   */
  getReviewName(review) {
    const { reviewTypes } = this.props;
    const reviewType = _.find(reviewTypes, { id: review.typeId });
    if (reviewType) {
      return reviewType.name;
    }
    return '';
  }

  /**
   * Update sorted submission array
   */
  updateSortedSubmissions() {
    const { submission: { review } } = this.props;
    const sortedSubmissions = _.cloneDeep(review || []);
    this.sortSubmissions(sortedSubmissions);
    this.setState({ sortedSubmissions });
  }

  /**
   * Sort array of submission
   * @param {Array} submissions array of submission
   */
  sortSubmissions(submissions) {
    const { field, sort } = this.getSubmissionsSortParam();
    if (!field) {
      return submissions;
    }
    return sortList(submissions, field, sort, (a, b) => {
      let valueA = 0;
      let valueB = 0;
      let valueIsString = false;
      switch (field) {
        case 'Review Type': {
          valueA = this.getReviewName(a);
          valueB = this.getReviewName(b);
          break;
        }
        case 'Reviewer': {
          valueA = 'TC System';
          valueB = 'TC System';
          break;
        }
        case 'Score': {
          valueA = a.score;
          valueB = b.score;
          break;
        }
        case 'Status': {
          valueA = a.status;
          valueB = b.status;
          valueIsString = true;
          break;
        }
        default:
      }

      if (valueIsString === false) {
        if (valueA === '-') valueA = 0;
        if (valueB === '-') valueB = 0;
      }

      return {
        valueA,
        valueB,
        valueIsString,
      };
    });
  }

  render() {
    const { onCancel, submission, onSortChange } = this.props;
    let { finalScore } = submission;
    const { sortedSubmissions } = this.state;

    const { field, sort } = this.getSubmissionsSortParam();
    const revertSort = (sort === 'desc') ? 'asc' : 'desc';

    if (_.isNumber(finalScore)) {
      if (finalScore > 0) {
        finalScore = finalScore.toFixed(2);
      }
    } else {
      finalScore = '-';
    }
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Submission Details</h2>
        </div>
        <hr className={styles.hr} />
        <div className={styles['inner-content']}>
          <div className={styles['sub-header']}>
            <span>Submission: </span>
            <span className={styles['title-detail']}>{submission.id} ({submission.submissionId})</span>
          </div>
          <div className={styled('table-row table-content-header')}>
            <div
              className={styled('table-column column-1')}
            >
              <button
                type="button"
                className={styles['header-sort']}
                onClick={() => {
                  onSortChange({
                    field: 'Review Type',
                    sort: (field === 'Review Type') ? revertSort : 'desc',
                  });
                }}
              >
                <span>Review Type</span>
                {
                  field === 'Review Type' && (
                    <div
                      className={styled(
                        'col-arrow',
                        'col-arrow-is-sorting',
                        {
                          'col-arrow-sort-asc': (sort === 'asc'),
                        },
                      )}
                    ><ArrowDown />
                    </div>
                  )
                }
              </button>
            </div>
            <div
              className={styled(
                'table-column',
              )}
            >
              <button
                type="button"
                className={styles['header-sort']}
                onClick={() => {
                  onSortChange({
                    field: 'Reviewer',
                    sort: (field === 'Reviewer') ? revertSort : 'desc',
                  });
                }}
              >
                <span>Reviewer</span>
                {
                  field === 'Reviewer' && (
                    <div
                      className={styled(
                        'col-arrow',
                        'col-arrow-is-sorting',
                        {
                          'col-arrow-sort-asc': (sort === 'asc'),
                        },
                      )}
                    ><ArrowDown />
                    </div>
                  )
                }
              </button>
            </div>
            <div
              className={styled(
                'table-column',
              )}
            >
              <button
                type="button"
                className={styles['header-sort']}
                onClick={() => {
                  onSortChange({
                    field: 'Score',
                    sort: (field === 'Score') ? revertSort : 'desc',
                  });
                }}
              >
                <span>Score</span>
                {
                  field === 'Score' && (
                    <div
                      className={styled(
                        'col-arrow',
                        'col-arrow-is-sorting',
                        {
                          'col-arrow-sort-asc': (sort === 'asc'),
                        },
                      )}
                    ><ArrowDown />
                    </div>
                  )
                }
              </button>
            </div>
            <div
              className={styled(
                'table-column',
              )}
            >
              <button
                type="button"
                className={styles['header-sort']}
                onClick={() => {
                  onSortChange({
                    field: 'Status',
                    sort: (field === 'Status') ? revertSort : 'desc',
                  });
                }}
              >
                <span>Status</span>
                {
                  field === 'Status' && (
                    <div
                      className={styled(
                        'col-arrow',
                        'col-arrow-is-sorting',
                        {
                          'col-arrow-sort-asc': (sort === 'asc'),
                        },
                      )}
                    ><ArrowDown />
                    </div>
                  )
                }
              </button>
            </div>
          </div>
          {
            sortedSubmissions.map((review) => {
              let { score } = review;
              if (_.isNumber(score)) {
                if (score > 0) {
                  score = score.toFixed(2);
                }
              } else {
                score = '-';
              }
              return (
                <div key={review.id} className={styles['table-row']}>
                  <div
                    className={styled(
                      'table-column column-1',
                    )}
                  >
                    <div className={styles['mobile-header']}>Review Type</div>
                    <span>{this.getReviewName(review)}</span>
                  </div>
                  <div
                    className={styled(
                      'table-column',
                    )}
                  >
                    <div className={styles['mobile-header']}>Reviewer</div>
                    <span>TC System</span>
                  </div>
                  <div
                    className={styled(
                      'table-column',
                    )}
                  >
                    <div className={styles['mobile-header']}>Score</div>

                    {(score < 0) ? (
                      <Tooltip content="Failed Submission" className="toolTipPadding" place="top">
                        <IconFail />
                      </Tooltip>
                    ) : (<span>{score}</span>)}
                  </div>
                  <div
                    className={styled(
                      'table-column',
                    )}
                  >
                    <div className={styles['mobile-header']}>Status</div>

                    {(review.status === 'completed') ? (
                      <span className={styles['status-complete']}>Complete</span>
                    ) : (
                      <span className={styles['status-failed']}>Failed</span>
                    )}
                  </div>
                </div>
              );
            })
          }
          <div className={styled('table-row table-content-footer')}>
            <div className={styled('table-column column-1')}>
              <div className={styles['mobile-header']}>Review Type</div>
              <span>Final Score</span>
            </div>
            <div className={styles['table-column']}>
              <div className={styles['mobile-header']}>Reviewer</div>
              <span>N/A</span>
            </div>
            <div className={styles['table-column']}>
              <div className={styles['mobile-header']}>Score</div>
              <span>{finalScore || 'N/A'}</span>
            </div>
            <div className={styles['table-column']}>
              <div className={styles['mobile-header']}>Status</div>
              {submission.provisionalScoringIsCompleted ? (
                <span className={styles['status-complete']}>Complete</span>
              ) : (<span className={styles['status-in-queue']}>In Queue</span>)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

SubmissionsDetailView.defaultProps = {
  onCancel: () => {},
  onSortChange: () => {},
};

SubmissionsDetailView.propTypes = {
  onCancel: PT.func,
  submission: PT.shape({
    id: PT.number,
    finalScore: PT.any,
    submissionId: PT.string,
    provisionalScoringIsCompleted: PT.bool,
    review: PT.arrayOf(PT.shape()),
  }).isRequired,
  reviewTypes: PT.arrayOf(PT.shape()).isRequired,
  submissionsSort: PT.shape({
    field: PT.string,
    sort: PT.string,
  }).isRequired,
  onSortChange: PT.func,
};

export default SubmissionsDetailView;
