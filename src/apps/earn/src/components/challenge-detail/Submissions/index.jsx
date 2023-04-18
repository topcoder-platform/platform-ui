/* eslint jsx-a11y/no-static-element-interactions:0 */
/**
 * Submissions tab component.
 */

import React from 'react';
import PT from 'prop-types';
import moment from 'moment';
import { isMM as checkIsMM, isRDM as checkIsRDM } from '@earn/utils/challenge';
import _ from 'lodash';
import { connect } from 'react-redux';
import config from '@earn/config';
import * as submissionUtils from '@earn/utils/submission';

import { getService } from '@earn/services/submissions';
import { isTokenExpired } from "@earn/utils/token";
import Button from '../Button';
import { ReactComponent as DateSortIcon } from '@earn/assets/images/icon-date-sort.svg';
import { ReactComponent as SortIcon } from '@earn/assets/images/icon-sort.svg';
import { getSubmissionId } from '@earn/utils/submissions';
import { compressFiles } from '@earn/utils/files';

import sortList from '@earn/utils/challenge-detail/sort';
import challengeDetailsActions from '@earn/actions/page/challenge-details';
import LoadingIndicator from '@earn/components/LoadingIndicator';
import { goToLogin, getRatingLevel, CHALLENGE_STATUS } from '@earn/utils/tc';
import { ReactComponent as Lock } from '../icons/lock.svg';
import { ReactComponent as ViewAsListActive } from '../icons/view-as-list-active.svg';
import { ReactComponent as ViewAsListInactive } from '../icons/view-as-list-inactive.svg';
import { ReactComponent as ViewAsTableActive } from '../icons/view-as-table-active.svg';
import { ReactComponent as ViewAsTableInactive } from '../icons/view-as-table-inactive.svg';
import SubmissionRow from './SubmissionRow';
import SubmissionInformationModal from './SubmissionInformationModal';
import { styled as styledCss } from "../../../utils";

import styles from "./style.scss";
const styled = styledCss(styles)

const { getProvisionalScore, getFinalScore } = submissionUtils;

class SubmissionsComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isShowInformation: false,
      memberOfModal: '',
      sortedSubmissions: [],
      ratingClicked: false,
      usernameClicked: false,
      dateClicked: false,
      initialScoreClicked: false,
      finalScoreClicked: false,
      finalRankClicked: false,
      provisionalRankClicked: false,
      provisionalScoreClicked: false,
      downloadingAll: false,
    };
    this.onHandleInformationPopup = this.onHandleInformationPopup.bind(this);
    this.getSubmissionsSortParam = this.getSubmissionsSortParam.bind(this);
    this.getFlagFirstTry = this.getFlagFirstTry.bind(this);
    this.updateSortedSubmissions = this.updateSortedSubmissions.bind(this);
    this.sortSubmissions = this.sortSubmissions.bind(this);
    this.checkIsReviewPhaseComplete = this.checkIsReviewPhaseComplete.bind(this);
  }

  componentDidMount() {
    const { challenge, loadMMSubmissions, auth } = this.props;
    const isMM = this.isMM();

    // Check auth token, go to login page if invalid
    if (isMM && (_.isEmpty(auth) || _.isEmpty(auth.tokenV3) || isTokenExpired(auth.tokenV3))) {
      goToLogin('community-app-main');
      return;
    }

    if (isMM) {
      loadMMSubmissions(challenge.id, auth.tokenV3);
    }
    this.updateSortedSubmissions();
  }

  componentDidUpdate(prevProps) {
    const isMM = this.isMM();

    const { submissions, mmSubmissions, submissionsSort } = this.props;
    if (
      (!isMM && !_.isEqual(prevProps.submissions, submissions))
        || (isMM && !_.isEqual(prevProps.mmSubmissions, mmSubmissions))
        || !_.isEqual(prevProps.submissionsSort, submissionsSort)
    ) {
      this.updateSortedSubmissions();
    }
  }

  onHandleInformationPopup(status, submissionId = null, member = '') {
    const { loadSubmissionInformation, auth, challenge } = this.props;
    this.setState({
      isShowInformation: status,
      memberOfModal: member,
    });

    if (status) {
      loadSubmissionInformation(challenge.id, submissionId, auth.tokenV3);
    }
  }

  /**
     * Check if it have flag for first try
     * @param {Object} registrant registrant info
     */
  getFlagFirstTry(registrant) {
    const { notFoundCountryFlagUrl } = this.props;
    if (!registrant.countryInfo || notFoundCountryFlagUrl[registrant.countryInfo.countryCode]) {
      return null;
    }

    return registrant.countryInfo.countryFlag;
  }

  /**
     * Get submission sort parameter
     */
  getSubmissionsSortParam(isMM, isReviewPhaseComplete) {
    const {
      submissionsSort,
    } = this.props;
    let { field, sort } = submissionsSort;
    if (!field) {
      field = 'Submission Date'; // default field for submission sorting
      if (isMM) {
        if (isReviewPhaseComplete) {
          field = 'Final Rank';
        } else {
          field = 'Provisional Rank';
        }
      }
    }

    if (!sort) {
      sort = 'asc'; // default order for submission sorting
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
    const isMM = this.isMM();
    const { submissions, mmSubmissions } = this.props;
    const sortedSubmissions = _.cloneDeep(isMM ? mmSubmissions : submissions);
    this.sortSubmissions(sortedSubmissions);
    this.setState({ sortedSubmissions });
  }

  /**
     * Sort array of submission
     * @param {Array} submissions array of submission
     */
  sortSubmissions(submissions) {
    const isMM = this.isMM();
    const isReviewPhaseComplete = this.checkIsReviewPhaseComplete();
    const { field, sort } = this.getSubmissionsSortParam(isMM, isReviewPhaseComplete);
    let isHaveFinalScore = false;
    if (field === 'Initial Score' || 'Final Score') {
      isHaveFinalScore = _.some(submissions, s => !_.isNil(
        s.reviewSummation && s.reviewSummation[0].aggregateScore,
      ));
    }
    return sortList(submissions, field, sort, (a, b) => {
      let valueA = 0;
      let valueB = 0;
      let valueIsString = false;
      switch (field) {
        case 'Country': {
          valueA = a.registrant ? a.registrant.countryCode : '';
          valueB = b.registrant ? b.registrant.countryCode : '';
          valueIsString = true;
          break;
        }
        case 'Rating': {
          valueA = a.registrant ? a.registrant.rating : 0;
          valueB = b.registrant ? b.registrant.rating : 0;
          break;
        }
        case 'Username': {
          if (isMM) {
            valueA = `${a.member || ''}`.toLowerCase();
            valueB = `${b.member || ''}`.toLowerCase();
          } else {
            valueA = _.get(a.registrant, 'memberHandle', '').toLowerCase();
            valueB = _.get(b.registrant, 'memberHandle', '').toLowerCase();
          }
          valueIsString = true;
          break;
        }
        case 'Time':
          valueA = new Date(a.submissions && a.submissions[0].submissionTime);
          valueB = new Date(b.submissions && b.submissions[0].submissionTime);
          break;
        case 'Submission Date': {
          valueA = new Date(a.created);
          valueB = new Date(b.created);
          break;
        }
        case 'Initial Score': {
          if (isHaveFinalScore) {
            valueA = getFinalScore(a);
            valueB = getFinalScore(b);
          } else {
            valueA = !_.isEmpty(a.review) && a.review[0].score;
            valueB = !_.isEmpty(b.review) && b.review[0].score;
          }
          break;
        }
        case 'Final Rank': {
          if (this.checkIsReviewPhaseComplete()) {
            valueA = a.finalRank ? a.finalRank : 0;
            valueB = b.finalRank ? b.finalRank : 0;
          }
          break;
        }
        case 'Provisional Rank': {
          valueA = a.provisionalRank ? a.provisionalRank : 0;
          valueB = b.provisionalRank ? b.provisionalRank : 0;
          break;
        }
        case 'Final Score': {
          valueA = getFinalScore(a);
          valueB = getFinalScore(b);
          break;
        }
        case 'Provisional Score': {
          valueA = getProvisionalScore(a);
          valueB = getProvisionalScore(b);
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

  isMM() {
    const { challenge } = this.props;
    return challenge.track.toLowerCase() === 'data science' || checkIsMM(challenge);
  }

  /**
     * Check if review phase complete
     */
  checkIsReviewPhaseComplete() {
    const {
      challenge,
    } = this.props;

    const allPhases = challenge.phases || [];

    let isReviewPhaseComplete = false;
    _.forEach(allPhases, (phase) => {
      if (phase.name === 'Review' && !phase.isOpen && moment(phase.scheduledStartDate).isBefore()) {
        isReviewPhaseComplete = true;
      }
    });
    return isReviewPhaseComplete;
  }

  render() {
    const {
      challenge, toggleSubmissionHistory,
      submissionHistoryOpen,
      mmSubmissions,
      loadingMMSubmissionsForChallengeId,
      isLoadingSubmissionInformation,
      submissionInformation,
      toggleSubmissionTestcase,
      submissionTestcaseOpen,
      clearSubmissionTestcaseOpen,
      onGetFlagImageFail,
      onSortChange,
      hasRegistered,
      submissionEnded,
      unregistering,
      isLegacyMM,
      challengesUrl,
      viewAsTable,
      setViewAsTable,
      numWinners,
      auth,
    } = this.props;
    const {
      checkpoints,
      id: challengeId,
      track,
      type,
      tags,
    } = challenge;

    const isMM = this.isMM();
    const isRDM = checkIsRDM(challenge);
    const isLoggedIn = !_.isEmpty(auth.tokenV3);
    const isReviewPhaseComplete = this.checkIsReviewPhaseComplete();

    const { field, sort } = this.getSubmissionsSortParam(isMM, isReviewPhaseComplete);
    const revertSort = (sort === 'desc') ? 'asc' : 'desc';

    const {
      isShowInformation,
      memberOfModal,
      sortedSubmissions,
      ratingClicked,
      usernameClicked,
      dateClicked,
      initialScoreClicked,
      finalScoreClicked,
      finalRankClicked,
      provisionalRankClicked,
      provisionalScoreClicked,
      downloadingAll,
    } = this.state;

    const sortOptionClicked = {
      ratingClicked: false,
      usernameClicked: false,
      dateClicked: false,
      initialScoreClicked: false,
      finalScoreClicked: false,
      finalRankClicked: false,
      provisionalRankClicked: false,
      provisionalScoreClicked: false,
    };

    const modalSubmissionBasicInfo = () => _.find(mmSubmissions,
      item => item.member === memberOfModal);

    const renderSubmission = (s) => (
      <div className={styled("submission")} key={s.id}>
        <a
          href={`${config.URL.STUDIO}?module=DownloadSubmission&sbmid=${s.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            alt=""
            src={`${config.URL.STUDIO}/studio.jpg?module=DownloadSubmission&sbmid=${s.id}&sbt=small&sfi=1`}
          />
        </a>
        <div className={styled("bottom-info")}>
          <div className={styled("links")}>
            <a
              href={`${config.URL.STUDIO}?module=DownloadSubmission&sbmid=${s.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {`#${s.id}`}
            </a>
            <a
              href={`${window.origin}/members/${_.get(s.registrant, 'memberHandle', '')}`}
              target={`${_.includes(window.origin, 'www') ? '_self' : '_blank'}`}
              rel="noopener noreferrer"
              className={styled(`level-${getRatingLevel(
                _.get(s.registrant, "rating", 0)
              )}`)}
            >
              {_.get(s.registrant, 'memberHandle', '')}
            </a>
          </div>
          <div>
            {moment(s.submissionTime)
              .format('MMM DD,YYYY HH:mm')}
          </div>
        </div>
      </div>
    );

    const isF2F = type === 'First2Finish';
    const isBugHunt = _.includes(tags, 'Bug Hunt');

    // copy colorStyle from registrants to submissions
    _.forEach(sortedSubmissions, (s) => {
      if (s.registrant && s.registrant.colorStyle && !s.colorStyle) {
        const { colorStyle } = s.registrant;
        /* eslint-disable no-param-reassign */
        s.colorStyle = JSON.parse(colorStyle.replace(/(\w+):\s*([^;]*)/g, '{"$1": "$2"}'));
        /* eslint-enable no-param-reassign */
      }

      if (s.registrant && s.registrant.rating && !s.rating) {
        const { rating } = s.registrant;
        /* eslint-disable no-param-reassign */
        s.rating = rating;
        /* eslint-enable no-param-reassign */
      }
    });

    if (track.toLowerCase() === 'design') {
      return challenge.submissionViewable === 'true' ? (
        <div className={styled('container view')}>
          <div className={styles.title}>
            ROUND 2 (FINAL) SUBMISSIONS
          </div>
          <div className={styles.content}>
            {
                sortedSubmissions.map(renderSubmission)
              }
          </div>
          {
              checkpoints.length > 0
              && (
                <div className={styles.title}>
                  ROUND 1 (CHECKPOINT) SUBMISSIONS
                </div>
              )
            }
          {
              checkpoints.length > 0
              && (
                <div className={styles.content}>
                  {
                    checkpoints.map(renderSubmission)
                  }
                </div>
              )
            }
        </div>
      )
        : (
          <div className={styled('container no-view')}>
            <Lock className={styles.lock} />
            <div className={styles['lock-title']}>
              Private Challenge
            </div>
            <div className={styles['lock-subtitle']}>
              Submissions are not viewable for this challenge
            </div>
            <span className={styles['lock-desc']}>
              There are many reason why the submissions may not be viewable, such
              as the allowance of stock art, or a client&apos;s desire to keep the work private.
            </span>
          </div>
        );
    }

    if (!_.isEmpty(loadingMMSubmissionsForChallengeId)) {
      return <div className={styles.loading}><LoadingIndicator /></div>;
    }

    return (
      <div className={styled(`container dev ${isMM ? 'mm' : 'non-mm'}`)}>
        {
          isMM ? (
            <div className={styles['view-as']}>
              <span className={styles.title}>View as</span>
              {
                viewAsTable ? (
                  <React.Fragment>
                    <ViewAsListInactive className={styles['list-icon']} onClick={() => setViewAsTable(false)} />
                    <ViewAsTableActive className={styles['table-icon']} onClick={() => setViewAsTable(true)} />
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <ViewAsListActive className={styles['list-icon']} onClick={() => setViewAsTable(false)} />
                    <ViewAsTableInactive className={styles['table-icon']} onClick={() => setViewAsTable(true)} />
                  </React.Fragment>
                )
              }
            </div>
          ) : null
        }
        <div className={styled(`${viewAsTable ? 'view-as-table' : ''}`)}>
          {
            ((numWinners > 0 || challenge.status === CHALLENGE_STATUS.COMPLETED)
            && (isMM || isRDM) && isLoggedIn) && (
              <div className={styles['block-download-all']}>
                <button
                  disabled={downloadingAll}
                  className={styled('download MM')}
                  onClick={() => {
                    // download submission
                    this.setState({
                      downloadingAll: true,
                    });
                    const submissionsService = getService(auth.m2mToken);
                    const allFiles = [];
                    let downloadedFile = 0;
                    const checkToCompressFiles = () => {
                      if (downloadedFile === sortedSubmissions.length) {
                        if (downloadedFile > 0) {
                          compressFiles(allFiles, 'all-submissions.zip', () => {
                            this.setState({
                              downloadingAll: false,
                            });
                          });
                        } else {
                          this.setState({
                            downloadingAll: false,
                          });
                        }
                      }
                    };
                    checkToCompressFiles();
                    _.forEach(sortedSubmissions, (submission) => {
                      const mmSubmissionId = submission.submissions
                        ? getSubmissionId(submission.submissions) : submission.id;
                      submissionsService.downloadSubmission(mmSubmissionId)
                        .then((blob) => {
                          const file = new File([blob], `submission-${mmSubmissionId}.zip`);
                          allFiles.push(file);
                          downloadedFile += 1;
                          checkToCompressFiles();
                        }).catch(() => {
                          downloadedFile += 1;
                          checkToCompressFiles();
                        });
                    });
                  }}
                  type="button"
                >
                  Download All
                </button>
              </div>
            )
          }
          {
            !isMM && (
              <div className={styles.head}>
                {
                  !isF2F && !isBugHunt && (
                    <button
                      type="button"
                      onClick={() => {
                        onSortChange({
                          field: 'Rating',
                          sort: (field === 'Rating') ? revertSort : 'desc',
                        });
                        this.setState({ ...sortOptionClicked, ratingClicked: true });
                      }}
                      className={styled('col-2 header-sort')}
                    >
                      <span>Rating</span>
                      <div
                        className={styled(
                          'col-arrow',
                          {
                            'col-arrow-sort-asc': (field === 'Rating') && (sort === 'asc'),
                            'col-arrow-is-sorting': field === 'Rating',
                          },
                        )}
                      >{ ratingClicked ? <DateSortIcon /> : <SortIcon /> }
                      </div>
                    </button>
                  )
                }
                <button
                  type="button"
                  onClick={() => {
                    onSortChange({
                      field: 'Username',
                      sort: (field === 'Username') ? revertSort : 'desc',
                    });
                    this.setState({ ...sortOptionClicked, usernameClicked: true });
                  }}
                  className={styled('col-3 header-sort')}
                >
                  <span>Username</span>
                  <div
                    className={styled(
                      'col-arrow',
                      {
                        'col-arrow-sort-asc': (field === 'Username') && (sort === 'asc'),
                        'col-arrow-is-sorting': field === 'Username',
                      },
                    )}
                  >{ usernameClicked ? <DateSortIcon /> : <SortIcon /> }
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSortChange({
                      field: 'Submission Date',
                      sort: (field === 'Submission Date') ? revertSort : 'desc',
                    });
                    this.setState({ ...sortOptionClicked, dateClicked: true });
                  }}
                  className={styled('col-4 header-sort')}
                >
                  <span>Submission Date</span>
                  <div
                    className={styled(
                      'col-arrow',
                      {
                        'col-arrow-sort-asc': (field === 'Submission Date') && (sort === 'asc'),
                        'col-arrow-is-sorting': field === 'Submission Date',
                      },
                    )}
                  >{ dateClicked ? <DateSortIcon /> : <SortIcon /> }
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSortChange({
                      field: 'Initial Score',
                      sort: (field === 'Initial Score') ? revertSort : 'desc',
                    });
                    this.setState({ ...sortOptionClicked, initialScoreClicked: true });
                  }}
                  className={styled('col-5 header-sort')}
                >
                  <span>Initial Score</span>
                  <div
                    className={styled(
                      'col-arrow',
                      {
                        'col-arrow-sort-asc': (field === 'Initial Score') && (sort === 'asc'),
                        'col-arrow-is-sorting': field === 'Initial Score',
                      },
                    )}
                  >{ initialScoreClicked ? <DateSortIcon /> : <SortIcon /> }
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSortChange({
                      field: 'Final Score',
                      sort: (field === 'Final Score') ? revertSort : 'desc',
                    });
                    this.setState({ ...sortOptionClicked, finalScoreClicked: true });
                  }}
                  className={styled('col-6 header-sort')}
                >
                  <span>Final Score</span>
                  <div
                    className={styled(
                      'col-arrow',
                      {
                        'col-arrow-sort-asc': (field === 'Final Score') && (sort === 'asc'),
                        'col-arrow-is-sorting': field === 'Final Score',
                      },
                    )}
                  >{ finalScoreClicked ? <DateSortIcon /> : <SortIcon /> }
                  </div>
                </button>
              </div>
            )
          }
          {
            isMM && (
              <div className={styled(`sub-head ${viewAsTable ? 'sub-head-table' : ''}`)}>
                <div className={styled('col-1 col')}>
                  <button
                    type="button"
                    onClick={() => {
                      onSortChange({
                        field: 'Final Rank',
                        sort: (field === 'Final Rank') ? revertSort : 'desc',
                      });
                      this.setState({ ...sortOptionClicked, finalRankClicked: true });
                    }}
                    className={styled('col header-sort')}
                  >
                    <span>FINAL RANK</span>
                    <div
                      className={styled(
                        'col-arrow',
                        {
                          'col-arrow-sort-asc': (field === 'Final Rank') && (sort === 'asc'),
                          'col-arrow-is-sorting': field === 'Final Rank',
                        },
                      )}
                    >{finalRankClicked ? <DateSortIcon /> : <SortIcon />}
                    </div>
                  </button>
                </div>
                <div className={styled('col-2 col')}>
                  <button
                    type="button"
                    onClick={() => {
                      onSortChange({
                        field: 'Provisional Rank',
                        sort: (field === 'Provisional Rank') ? revertSort : 'desc',
                      });
                      this.setState({ ...sortOptionClicked, provisionalRankClicked: true });
                    }}
                    className={styled('col header-sort')}
                  >
                    <span>PROVISIONAL RANK</span>
                    <div
                      className={styled(
                        'col-arrow',
                        {
                          'col-arrow-sort-asc': (field === 'Provisional Rank') && (sort === 'asc'),
                          'col-arrow-is-sorting': field === 'Provisional Rank',
                        },
                      )}
                    >{provisionalRankClicked ? <DateSortIcon /> : <SortIcon /> }
                    </div>
                  </button>
                </div>
                <div className={styled('col-3 col')}>
                  <button
                    type="button"
                    onClick={() => {
                      onSortChange({
                        field: 'Rating',
                        sort: (field === 'Rating') ? revertSort : 'desc',
                      });
                      this.setState({ ...sortOptionClicked, ratingClicked: true });
                    }}
                    className={styles['header-sort']}
                  >
                    <span>RATING</span>
                    <div
                      className={styled(
                        'col-arrow',
                        {
                          'col-arrow-sort-asc': (field === 'Rating') && (sort === 'asc'),
                          'col-arrow-is-sorting': field === 'Rating',
                        },
                      )}
                    >{ ratingClicked ? <DateSortIcon /> : <SortIcon /> }
                    </div>
                  </button>
                </div>
                <div className={styled('col-4 col')}>
                  <button
                    type="button"
                    onClick={() => {
                      onSortChange({
                        field: 'Username',
                        sort: (field === 'Username') ? revertSort : 'desc',
                      });
                      this.setState({ ...sortOptionClicked, usernameClicked: true });
                    }}
                    className={styled('col header-sort')}
                  >
                    <span>USERNAME</span>
                    <div
                      className={styled(
                        'col-arrow',
                        {
                          'col-arrow-sort-asc': (field === 'Username') && (sort === 'asc'),
                          'col-arrow-is-sorting': field === 'Username',
                        },
                      )}
                    >{ usernameClicked ? <DateSortIcon /> : <SortIcon /> }
                    </div>
                  </button>
                </div>
                <div className={styled('col-5 col')}>
                  <button
                    type="button"
                    onClick={() => {
                      onSortChange({
                        field: 'Final Score',
                        sort: (field === 'Final Score') ? revertSort : 'desc',
                      });
                      this.setState({ ...sortOptionClicked, finalScoreClicked: true });
                    }}
                    className={styled('col header-sort')}
                  >
                    <span>FINAL SCORE</span>
                    <div
                      className={styled(
                        'col-arrow',
                        {
                          'col-arrow-sort-asc': (field === 'Final Score') && (sort === 'asc'),
                          'col-arrow-is-sorting': field === 'Final Score',
                        },
                      )}
                    >{ finalScoreClicked ? <DateSortIcon /> : <SortIcon /> }
                    </div>
                  </button>
                </div>
                <div className={styled('col-6 col')}>
                  <button
                    type="button"
                    onClick={() => {
                      onSortChange({
                        field: 'Provisional Score',
                        sort: (field === 'Provisional Score') ? revertSort : 'desc',
                      });
                      this.setState({ ...sortOptionClicked, provisionalScoreClicked: true });
                    }}
                    className={styled('col header-sort')}
                  >
                    <span>PROVISIONAL SCORE</span>
                    <div
                      className={styled(
                        'col-arrow',
                        {
                          'col-arrow-sort-asc': (field === 'Provisional Score') && (sort === 'asc'),
                          'col-arrow-is-sorting': field === 'Provisional Score',
                        },
                      )}
                    >{ provisionalScoreClicked ? <DateSortIcon /> : <SortIcon /> }
                    </div>
                  </button>
                </div>
                <div className={styled('col-7 col')}>
                  <button
                    type="button"
                    onClick={() => {
                      onSortChange({
                        field: 'Time',
                        sort: (field === 'Time') ? revertSort : 'desc',
                      });
                      this.setState({ ...sortOptionClicked, dateClicked: true });
                    }}
                    className={styled('col header-sort')}
                  >
                    <span>TIME</span>
                    <div
                      className={styled(
                        'col-arrow',
                        {
                          'col-arrow-sort-asc': (field === 'Time') && (sort === 'asc'),
                          'col-arrow-is-sorting': field === 'Time',
                        },
                      )}
                    >{ dateClicked ? <DateSortIcon /> : <SortIcon /> }
                    </div>
                  </button>
                </div>
                <div className={styled('col-8 col')}>
                  <span>ACTIONS</span>
                </div>
              </div>
            )
          }
          {
            isMM && (
              sortedSubmissions.map((submission, index) => (
                <SubmissionRow
                  submissions={sortedSubmissions}
                  isReviewPhaseComplete={isReviewPhaseComplete}
                  isMM={isMM}
                  isRDM={isRDM}
                  key={submission.member}
                  {...submission}
                  challengeStatus={challenge.status}
                  toggleHistory={() => { toggleSubmissionHistory(index); }}
                  openHistory={(submissionHistoryOpen[index.toString()] || false)}
                  isLoadingSubmissionInformation={isLoadingSubmissionInformation}
                  submissionInformation={submissionInformation}
                  onShowPopup={this.onHandleInformationPopup}
                  getFlagFirstTry={this.getFlagFirstTry}
                  onGetFlagImageFail={onGetFlagImageFail}
                  submissionDetail={submission}
                  viewAsTable={viewAsTable}
                  numWinners={numWinners}
                  auth={auth}
                  isLoggedIn={isLoggedIn}
                />
              ))
            )
          }
          {
            !isMM && (
              sortedSubmissions.map(s => (
                <div key={_.get(s.registrant, 'memberHandle', '') + s.created} className={styles.row}>
                  {
                    !isF2F && !isBugHunt && (
                      <React.Fragment>
                        <div className={styles['mobile-header']}>RATING</div>
                        <div className={styled(`col-2 level-${getRatingLevel(_.get(s.registrant, 'rating', 0))}`)}>
                          { (s.registrant && !_.isNil(s.registrant.rating)) ? s.registrant.rating : '-'}
                        </div>
                      </React.Fragment>
                    )
                  }
                  <div className={styles['col-3']}>
                    <div className={styles['mobile-header']}>USERNAME</div>
                    <a
                      href={`${window.origin}/members/${_.get(s.registrant, 'memberHandle', '')}`}
                      target={`${_.includes(window.origin, 'www') ? '_self' : '_blank'}`}
                      rel="noopener noreferrer"
                      className={styled(`handle level-${getRatingLevel(_.get(s.registrant, 'rating', 0))}`)}
                    >
                      {_.get(s.registrant, 'memberHandle', '')}
                    </a>
                  </div>
                  <div className={styles['col-4']}>
                    <div className={styles['mobile-header']}>SUBMISSION DATE</div>
                    <p>
                      {moment(s.created).format('MMM DD, YYYY HH:mm')}
                    </p>
                  </div>
                  <div className={styles['col-5']}>
                    <div className={styles['mobile-header']}>INITIAL SCORE</div>
                    <p>
                      {
                        (!_.isEmpty(s.review) && !_.isEmpty(s.review[0]) && s.review[0].score)
                          ? s.review[0].score.toFixed(2)
                          : 'N/A'
                      }
                    </p>
                  </div>
                  <div className={styles['col-6']}>
                    <div className={styles['mobile-header']}>FINAL SCORE</div>
                    <p>
                      {
                        (s.reviewSummation && s.reviewSummation[0].aggregateScore)
                          ? s.reviewSummation[0].aggregateScore.toFixed(2)
                          : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              ))
            )
          }
          {
          isMM && <div className={styles['bottom-line']} />
        }
        </div>
        {isMM && (
          <div className={styles['btn-add-submission']}>
            <Button
              disabled={!hasRegistered || unregistering || submissionEnded || isLegacyMM}
              theme={{ button: styles.challengeAction }}
              to={`${challengesUrl}/${challengeId}/submit`}
            >
              Add Submission
            </Button>
          </div>
        )}
        {
            isMM && isShowInformation && (
              <SubmissionInformationModal
                isLoadingSubmissionInformation={isLoadingSubmissionInformation}
                submissionInformation={submissionInformation}
                onClose={this.onHandleInformationPopup}
                toggleTestcase={toggleSubmissionTestcase}
                openTestcase={submissionTestcaseOpen}
                clearTestcaseOpen={clearSubmissionTestcaseOpen}
                submission={modalSubmissionBasicInfo()}
                isReviewPhaseComplete={isReviewPhaseComplete}
              />
            )
          }
      </div>
    );
  }
}

SubmissionsComponent.defaultProps = {
  isLoadingSubmissionInformation: false,
  submissionInformation: null,
  submissions: [],
  submissionsSort: {},
  onSortChange: () => {},
  onGetFlagImageFail: () => {},
};

SubmissionsComponent.propTypes = {
  auth: PT.shape().isRequired,
  challenge: PT.shape({
    id: PT.any,
    checkpoints: PT.arrayOf(PT.object),
    submissions: PT.arrayOf(PT.object),
    submissionViewable: PT.string,
    track: PT.string.isRequired,
    type: PT.string.isRequired,
    tags: PT.arrayOf(PT.string),
    registrants: PT.any,
    status: PT.string.isRequired,
    phases: PT.any,
  }).isRequired,
  toggleSubmissionHistory: PT.func.isRequired,
  submissionHistoryOpen: PT.shape({}).isRequired,
  loadMMSubmissions: PT.func.isRequired,
  mmSubmissions: PT.arrayOf(PT.shape()).isRequired,
  loadingMMSubmissionsForChallengeId: PT.string.isRequired,
  isLoadingSubmissionInformation: PT.bool,
  submissionInformation: PT.shape(),
  loadSubmissionInformation: PT.func.isRequired,
  toggleSubmissionTestcase: PT.func.isRequired,
  clearSubmissionTestcaseOpen: PT.func.isRequired,
  submissionTestcaseOpen: PT.shape({}).isRequired,
  submissions: PT.arrayOf(PT.shape()),
  submissionsSort: PT.shape({
    field: PT.string,
    sort: PT.string,
  }),
  onSortChange: PT.func,
  notFoundCountryFlagUrl: PT.objectOf(PT.bool).isRequired,
  onGetFlagImageFail: PT.func,
  hasRegistered: PT.bool.isRequired,
  unregistering: PT.bool.isRequired,
  submissionEnded: PT.bool.isRequired,
  isLegacyMM: PT.bool.isRequired,
  challengesUrl: PT.string.isRequired,
  viewAsTable: PT.bool.isRequired,
  setViewAsTable: PT.func.isRequired,
  numWinners: PT.number.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    toggleSubmissionHistory: index => dispatch(
      challengeDetailsActions.page.challengeDetails.submissions.toggleSubmissionHistory(index),
    ),
    toggleSubmissionTestcase: index => dispatch(
      challengeDetailsActions.page.challengeDetails.submissions.toggleSubmissionTestcase(index),
    ),
    clearSubmissionTestcaseOpen: () => dispatch(
      challengeDetailsActions.page.challengeDetails.submissions.clearSubmissionTestcaseOpen(),
    ),
  };
}

function mapStateToProps(state) {
  return {
    submissionHistoryOpen: state.page.challengeDetails.submissionHistoryOpen,
    submissionTestcaseOpen: state.page.challengeDetails.submissionTestcaseOpen,
    isLoadingSubmissionInformation:
        Boolean(state.challenge.loadingSubmissionInformationForSubmissionId),
    submissionInformation: state.challenge.submissionInformation,
  };
}

const Submissions = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SubmissionsComponent);

export default Submissions;