/*
  Component renders my submissions list
*/

import React from 'react';
import cn from 'classnames';
import _ from 'lodash';
import moment from 'moment';
import { PrimaryButton } from '@earn/components/challenge-detail/buttons';
import Modal from '@earn/components/challenge-detail/Modal'
import PT from 'prop-types';
import { getService } from '@earn/services/submissions';
import sortList from '@earn/utils/challenge-detail/sort';

import { ReactComponent as IconClose } from '@earn/assets/images/icon-close-green.svg';
import { ReactComponent as DateSortIcon } from '@earn/assets/images/icon-date-sort.svg';
import { ReactComponent as SortIcon } from '@earn/assets/images/icon-sort.svg';
import Tooltip from '../../Tooltip';
import { ReactComponent as IconFail } from '../../icons/failed.svg';
import { ReactComponent as DownloadIcon } from '../../../SubmissionManagement/Icons/IconSquareDownload.svg';
import { ReactComponent as ZoomIcon } from '../../../SubmissionManagement/Icons/IconZoom.svg';
import { styled as styledCss } from "../../../../utils";

// import SearchIcon from '../../../SubmissionManagement/Icons/IconSearch.svg';
import styles from './styles.scss';

const styled = styledCss(styles)

class SubmissionsListView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sortedSubmissions: [],
      submissionIdClicked: false,
      statusClicked: false,
      finalClicked: false,
      provisionClicked: false,
      timeClicked: false,
      openModal: false,
      selectedSubmission: {},
    };
    this.sortSubmissions = this.sortSubmissions.bind(this);
    this.getSubmissionsSortParam = this.getSubmissionsSortParam.bind(this);
    this.updateSortedSubmissions = this.updateSortedSubmissions.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }

  componentDidMount() {
    this.updateSortedSubmissions();
  }

  componentDidUpdate(prevProps) {
    const { mySubmissions, submissionsSort } = this.props;
    if (
      !_.isEqual(prevProps.mySubmissions, mySubmissions)
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
    let { field, sort } = submissionsSort;
    if (!field) {
      field = 'Submission ID';
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
   * Update sorted submission array
   */
  updateSortedSubmissions() {
    const { mySubmissions } = this.props;
    const sortedSubmissions = _.cloneDeep(mySubmissions);
    this.sortSubmissions(sortedSubmissions);
    this.setState({ sortedSubmissions });
  }

  /**
   * Sort array of submission
   * @param {Array} submissions array of submission
   */
  sortSubmissions(submissions) {
    const { field, sort } = this.getSubmissionsSortParam();
    return sortList(submissions, field, sort, (a, b) => {
      let valueA = 0;
      let valueB = 0;
      const valueIsString = false;
      switch (field) {
        case 'Submission ID': {
          valueA = a.id;
          valueB = b.id;
          break;
        }
        case 'Status': {
          valueA = a.provisionalScoringIsCompleted;
          valueB = b.provisionalScoringIsCompleted;
          break;
        }
        case 'Final': {
          valueA = a.finalScore;
          valueB = b.finalScore;
          break;
        }
        case 'Provision': {
          valueA = a.provisionalScore;
          valueB = b.provisionalScore;
          break;
        }
        case 'Time': {
          valueA = new Date(a.submissionTime);
          valueB = new Date(b.submissionTime);
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

  toggleModal(selectedSubmission) {
    const { openModal } = this.state;
    this.setState({ openModal: !openModal, selectedSubmission });
  }

  render() {
    const {
      selectSubmission,
      challengesUrl,
      challenge,
      hasRegistered,
      unregistering,
      submissionEnded,
      isLegacyMM,
      auth,
      onSortChange,
    } = this.props;

    const isButtonDisabled = !hasRegistered || unregistering || submissionEnded || isLegacyMM;

    const { field, sort } = this.getSubmissionsSortParam();
    const revertSort = (sort === 'desc') ? 'asc' : 'desc';

    const {
      id: challengeId,
    } = challenge;
    const {
      sortedSubmissions,
      submissionIdClicked,
      statusClicked,
      finalClicked,
      provisionClicked,
      timeClicked,
      selectedSubmission,
      openModal,
    } = this.state;

    const sortOptionClicked = {
      submissionIdClicked: false,
      statusClicked: false,
      finalClicked: false,
      provisionClicked: false,
      timeClicked: false,
    };

    return (
      <div className={styles.wrapper}>
        <div className={styles['submission-table']}>
          <div className={styled('submission-table-header submission-table-row')}>
            <div className={styled('submission-table-column column-1')}>
              <div
                className={styled(
                  'submission-table-column column-1-1',
                  {
                    'is-highlight': field === 'Submission ID',
                  },
                )}
              >
                <button
                  type="button"
                  className={styled("header-sort")}
                  onClick={() => {
                    onSortChange({
                      field: 'Submission ID',
                      sort: (field === 'Submission ID') ? revertSort : 'desc',
                    });
                    this.setState({ ...sortOptionClicked, submissionIdClicked: true });
                  }}
                >
                  <span>Submission ID</span>
                  <div
                    className={styled(
                      'col-arrow',
                      {
                        'col-arrow-sort-asc': (field === 'Submission ID') && (sort === 'asc'),
                        'col-arrow-is-sorting': field === 'Submission ID',
                      },
                    )}
                  >{ submissionIdClicked ? <DateSortIcon /> : <SortIcon /> }
                  </div>
                </button>
              </div>
              <div
                className={styled(
                  'submission-table-column column-1-2',
                  {
                    'is-highlight': field === 'Status',
                  },
                )}
              >
                <button
                  type="button"
                  className={styled("header-sort")}
                  onClick={() => {
                    onSortChange({
                      field: 'Status',
                      sort: (field === 'Status') ? revertSort : 'desc',
                    });
                    this.setState({ ...sortOptionClicked, statusClicked: true });
                  }}
                >
                  <span>Status</span>
                  <div
                    className={styled(
                      'col-arrow',
                      {
                        'col-arrow-sort-asc': (field === 'Status') && (sort === 'asc'),
                        'col-arrow-is-sorting': field === 'Status',
                      },
                    )}
                  >{ statusClicked ? <DateSortIcon /> : <SortIcon /> }
                  </div>
                </button>
              </div>
            </div>
            <div className={styled("submission-table-column column-2")}>
              <div
                className={styled(
                  'submission-table-column column-2-1',
                  {
                    'is-highlight': field === 'Final',
                  },
                )}
              >
                <button
                  type="button"
                  className={styled("header-sort")}
                  onClick={() => {
                    onSortChange({
                      field: 'Final',
                      sort: (field === 'Final') ? revertSort : 'desc',
                    });
                    this.setState({ ...sortOptionClicked, finalClicked: true });
                  }}
                >
                  <span>Final Score</span>
                  <div
                    className={styled(
                      'col-arrow',
                      {
                        'col-arrow-sort-asc': (field === 'Final') && (sort === 'asc'),
                        'col-arrow-is-sorting': field === 'Final',
                      },
                    )}
                  >{ finalClicked ? <DateSortIcon /> : <SortIcon /> }
                  </div>
                </button>
              </div>
              <div
                className={styled(
                  'submission-table-column column-2-2',
                  {
                    'is-highlight': field === 'Provision',
                  },
                )}
              >
                <button
                  type="button"
                  className={styled("header-sort")}
                  onClick={() => {
                    onSortChange({
                      field: 'Provision',
                      sort: (field === 'Provision') ? revertSort : 'desc',
                    });
                    this.setState({ ...sortOptionClicked, provisionClicked: true });
                  }}
                >
                  <span>Provision Score</span>
                  <div
                    className={styled(
                      'col-arrow',
                      {
                        'col-arrow-sort-asc': (field === 'Provision') && (sort === 'asc'),
                        'col-arrow-is-sorting': field === 'Provision',
                      },
                    )}
                  >{ provisionClicked ? <DateSortIcon /> : <SortIcon /> }
                  </div>
                </button>
              </div>
              <div
                className={styled(
                  'submission-table-column column-2-3',
                  {
                    'is-highlight': field === 'Time',
                  },
                )}
              >
                <button
                  type="button"
                  className={styled("header-sort")}
                  onClick={() => {
                    onSortChange({
                      field: 'Time',
                      sort: (field === 'Time') ? revertSort : 'desc',
                    });
                    this.setState({ ...sortOptionClicked, timeClicked: true });
                  }}
                >
                  <span>Time</span>
                  <div
                    className={styled(
                      'col-arrow',
                      {
                        'col-arrow-sort-asc': (field === 'Time') && (sort === 'asc'),
                        'col-arrow-is-sorting': field === 'Time',
                      },
                    )}
                  >{ timeClicked ? <DateSortIcon /> : <SortIcon /> }
                  </div>
                </button>
              </div>
              <div className={styled('submission-table-column column-2-4')}>
                <span className={styles['actions-col']}>ACTIONS</span>
              </div>
            </div>
          </div>
          {
            sortedSubmissions.map((mySubmission) => {
              let { finalScore, provisionalScore } = mySubmission;
              if (_.isNumber(finalScore)) {
                if (finalScore > 0) {
                  finalScore = finalScore.toFixed(2);
                }
              } else {
                finalScore = 'N/A';
              }
              if (_.isNumber(provisionalScore)) {
                if (provisionalScore > 0) {
                  provisionalScore = provisionalScore.toFixed(2);
                }
              } else {
                provisionalScore = 'N/A';
              }
              return (
                <div key={mySubmission.submissionId} className={styles['submission-table-row']}>
                  <div
                    className={styled(
                      'submission-table-column column-1',
                    )}
                  >
                    <div
                      className={styled(
                        'submission-table-column column-1-1',
                      )}
                    >
                      <div className={styles['mobile-header']}>Submission Id</div>
                      <span>{mySubmission.id}</span>
                    </div>
                    <div
                      className={styled(
                        'submission-table-column column-1-2 status-row',
                      )}
                    >
                      <div className={styles['mobile-header']}>Status</div>
                      {mySubmission.provisionalScoringIsCompleted ? (
                        <span className={styles.accepted}>Accepted</span>
                      ) : <span className={styles.queue}>In Queue</span>}
                    </div>
                  </div>
                  <div className={styled('submission-table-column column-2')}>
                    <div
                      className={styled(
                        'submission-table-column column-2-1 final-score-row',
                      )}
                    >
                      <div className={styles['mobile-header']}>Final Score</div>
                      {(finalScore < 0) ? (<IconFail />) : (<span>{finalScore}</span>)}
                    </div>
                    <div
                      className={styled(
                        'submission-table-column column-2-2 provisional-score-row',
                      )}
                    >
                      <div className={styles['mobile-header']}>Provisional Score</div>
                      {(provisionalScore < 0) ? (
                        <Tooltip content="Failed Submission" className="toolTipPadding">
                          <IconFail />
                        </Tooltip>
                      ) : (<span>{provisionalScore}</span>)}
                    </div>
                    <div
                      className={styled(
                        'submission-table-column column-2-3 time-row',
                      )}
                    >
                      <div className={styles['mobile-header']}>Time</div>
                      <span>{moment(mySubmission.submissionTime).format('MMM DD, YYYY HH:mm:ss')}</span>
                    </div>
                    <div className={styled('submission-table-column column-2-4')}>
                      <button
                        onClick={() => {
                          // download submission
                          const submissionsService = getService(auth.tokenV3);
                          submissionsService.downloadSubmission(mySubmission.submissionId)
                            .then((blob) => {
                              const url = window.URL.createObjectURL(new Blob([blob]));
                              const link = document.createElement('a');
                              link.href = url;
                              link.setAttribute('download', `submission-${mySubmission.submissionId}.zip`);
                              document.body.appendChild(link);
                              link.click();
                              link.parentNode.removeChild(link);
                            });
                        }}
                        type="button"
                      >
                        <DownloadIcon />
                      </button>

                      <button onClick={() => selectSubmission(mySubmission)} type="button">
                        <ZoomIcon className={styles['icon-zoom']} />
                      </button>

                      {/* <button onClick={() => this.toggleModal(mySubmission)} type="button">
                        <SearchIcon className={styles['icon-search']} />
                      </button> */}
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>
        <PrimaryButton
          theme={{
            button: isButtonDisabled ? styles.challengeActionDisabled : styles.challengeAction,
          }}
          disabled={isButtonDisabled}
          to={`${challengesUrl}/${challengeId}/submit`}
        >
          Add Submission
        </PrimaryButton>
        {
          openModal && (
            <Modal onCancel={this.toggleModal} theme={styles}>
              <div className={styles.mySubModal}>
                <div className={styles.header}>
                  <h2 className={styles.title}>Submission Details</h2>
                  <div className={styles.icon} role="presentation" onClick={() => this.toggleHistory({})}>
                    <IconClose />
                  </div>
                </div>
                <hr />
                <div className={styles['submission-text']}>
                  Submission: <span>{selectedSubmission.submissionId}</span>
                </div>
                <div className={styles['detail-row']}>
                  <div className={styled('col-1 col')}>
                    Review Type
                  </div>
                  <div className={styled('col-2 col')}>
                    Reviewer
                  </div>
                  <div className={styled('col-3 col')}>
                    Score
                  </div>
                  <div className={styled('col-4 col')}>
                    Status
                  </div>
                </div>
                <div className={styles['close-btn']} onClick={() => this.toggleHistory({})} role="presentation">
                  <span>CLOSE</span>
                </div>
              </div>
            </Modal>
          )
        }
      </div>
    );
  }
}

SubmissionsListView.defaultProps = {
  selectSubmission: () => {},
  onSortChange: () => {},
};

SubmissionsListView.propTypes = {
  selectSubmission: PT.func,
  challengesUrl: PT.string.isRequired,
  challenge: PT.shape({
    id: PT.any,
    checkpoints: PT.arrayOf(PT.object),
    submissions: PT.arrayOf(PT.object),
    submissionViewable: PT.string,
    registrants: PT.any,
  }).isRequired,
  hasRegistered: PT.bool.isRequired,
  unregistering: PT.bool.isRequired,
  submissionEnded: PT.bool.isRequired,
  isLegacyMM: PT.bool.isRequired,
  mySubmissions: PT.arrayOf(PT.shape()).isRequired,
  auth: PT.shape().isRequired,
  submissionsSort: PT.shape({
    field: PT.string,
    sort: PT.string,
  }).isRequired,
  onSortChange: PT.func,
};

export default SubmissionsListView;
