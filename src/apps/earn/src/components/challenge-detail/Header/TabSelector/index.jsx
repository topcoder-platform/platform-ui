/* eslint jsx-a11y/no-static-element-interactions:0 */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*
  Stateless tab control to switch between various views available in
  challenge detail page.
*/

import _ from 'lodash';
import { useMemo, useState } from 'react';
import PT from 'prop-types';
import cn from 'classnames';
import { useMediaQuery } from 'react-responsive';

import { TabsNavbar } from '~/libs/ui';

import { TABS as DETAIL_TABS } from "../../../../actions/page/challenge-details";
import config from "../../../../config";
import { ReactComponent as CloseIcon } from '../../../../assets/images/icon-close-green.svg';
import { ReactComponent as SortIcon } from '../../../../assets/images/icon-sort-mobile.svg';

import {
    MarathonSortOptions,
    MySubmissionsSortOptions,
    RegistrationSortOptions,
    SubmissionSortOptions,
} from './sort.options';
import styles from './style.scss';

export default function ChallengeViewSelector(props) {
    let showDashboard;
    const { type, tags, metadata } = props.challenge;
    const dashboardMetadata = _.find(metadata, { name: 'show_data_dashboard' });
    if (dashboardMetadata) {
        showDashboard = dashboardMetadata.value;
    }

    const [currentSelected, setCurrentSelected] = useState(props.selectedView ?? DETAIL_TABS.DETAILS);
    const [expanded, setExpanded] = useState(false);
    const [selectedSortOption, setSelectedSortOption] = useState();
    const isF2F = type === 'First2Finish';
    const isBugHunt = _.includes(tags, 'Bug Hunt');
    const isDesign = props.trackLower === 'design';

    const sortOptions = useMemo(() => {
        if (isF2F || isBugHunt) {
            return SubmissionSortOptions.slice(2);
        }

        if (props.isMM) {
            return MarathonSortOptions;
        }

        if (isDesign) {
            return RegistrationSortOptions.slice(2);
        }

        if (currentSelected === DETAIL_TABS.MY_SUBMISSIONS) {
            return MySubmissionsSortOptions;
        }

        return currentSelected === DETAIL_TABS.SUBMISSIONS
            ? SubmissionSortOptions : RegistrationSortOptions;
    }, [currentSelected, isBugHunt, isDesign, isF2F, props.isMM]);

    const numOfSub = props.numOfSubmissions + (props.numOfCheckpointSubmissions || 0);
    const forumId = _.get(props.challenge, 'legacy.forumId') || 0;
    const discuss = _.get(props.challenge, 'discussions', []).filter(d => (
        d.type === 'challenge' && !_.isEmpty(d.url)
    ));
    const roles = _.get(props.challenge, 'userDetails.roles') || [];

    const forumEndpoint = isDesign
        ? `/?module=ThreadList&forumID=${forumId}`
        : `/?module=Category&categoryID=${forumId}`;

    const handleSelectorClicked = (selected) => {
        setCurrentSelected(selected);
        props.onSelectorClicked(selected);
    };

    const desktop = useMediaQuery({ minWidth: 1024 });

    const tabs = useMemo(() => [
        {
            id: DETAIL_TABS.DETAILS,
            title: 'Details',
        },
        props.numOfRegistrants && {
            id: DETAIL_TABS.REGISTRANTS,
            title: 'Registrants',
            badges: [
                {count: props.numOfRegistrants, type: 'info'}
            ]
        },
        (isDesign && props.checkpointCount) > 0 && {
            id: DETAIL_TABS.CHECKPOINTS,
            title: 'Checkpoints',
            badges: [
                {count: props.checkpointCount, type: 'info'}
            ]
        },
        (numOfSub && props.isLoggedIn) > 0 && {
            id: DETAIL_TABS.SUBMISSIONS,
            title: 'Submissions',
            badges: [
                {count: numOfSub, type: 'info'}
            ]
        },
        (props.hasRegistered && props.isMM && props.mySubmissions) && {
            id: DETAIL_TABS.MY_SUBMISSIONS,
            title: 'My Submissions',
            badges: [
                {count: props.mySubmissions.length, type: 'info'}
            ]
        },
        (props.hasRegistered && props.mySubmissions.length > 0) && {
            id: 'SUBMISSION REVIEW',
            title: 'Submission Review',
            url: `${config.URL.SUBMISSION_REVIEW}/challenges/${props.challenge.legacyId}`,
        },
        props.numWinners && {
            id: DETAIL_TABS.WINNERS,
            title: 'Winners',
            badges: [
                {count: props.numWinners.length, type: 'info'}
            ]
        },
        ...(((props.hasRegistered || Boolean(roles.length)) && discuss?.map(d => ({
            id: DETAIL_TABS.CHALLENGE_FORUM,
            title: 'Challenge Discussion',
            url: d.url
        }))) || []),
        (props.hasRegistered || Boolean(roles.length)) && _.isEmpty(discuss) && (forumId > 0) && {
            id: DETAIL_TABS.CHALLENGE_FORUM,
            title: 'Challenge Forum',
            url: `${config.URL.FORUMS}${forumEndpoint}`
        },
        (props.challenge.track.toLowerCase() === 'data science' && showDashboard) && {
            id: DETAIL_TABS.MM_DASHBOARD,
            title: 'Dashboard',
        },
    ].filter(Boolean), [
        props.challenge.legacyId,
        props.challenge.track,
        props.checkpointCount,
        discuss,
        forumEndpoint,
        forumId,
        props.hasRegistered,
        isDesign,
        props.isLoggedIn,
        props.isMM,
        props.mySubmissions,
        props.numOfRegistrants,
        numOfSub,
        props.numWinners,
        roles.length,
        showDashboard,
    ]);

    const isSubmissionTabSelected = isDesign && !(props.challenge.submissionViewable === 'true')
        ? currentSelected === DETAIL_TABS.REGISTRANTS
        : (currentSelected === DETAIL_TABS.SUBMISSIONS
            || currentSelected === DETAIL_TABS.REGISTRANTS
            || currentSelected === DETAIL_TABS.MY_SUBMISSIONS
        );

    return (
        <div className={styles.container}>
            <TabsNavbar tabs={tabs} defaultActive={currentSelected} onChange={handleSelectorClicked} />
            {!desktop && (
                <>
                    {/* show SORT button/dropwdown on mobile */}
                    {isSubmissionTabSelected && !props.viewAsTable && (
                        <div
                            className={styles['mobile-sort-icon']}
                            role="button"
                            tabIndex={0}
                            onClick={() => setExpanded(!expanded)}
                        >
                            <SortIcon />
                        </div>
                    )}
                    {expanded && (
                        <div className={styles['sort-overlay']}>
                            <div className={styles['sort-header']}>
                                <p>SORT</p>
                                <div role="button" onClick={() => setExpanded(false)} tabIndex={0}>
                                    <CloseIcon />
                                </div>
                            </div>
                            <div className={styles['sort-body']}>
                                {sortOptions.map(option => (
                                    <div
                                        key={`sort-option-${option.name}`}
                                        className={styles['sort-item']}
                                        onClick={() => {
                                            setSelectedSortOption(option.name);
                                            props.onSort(currentSelected, option);
                                            setExpanded(false);
                                        }}
                                    >
                                        <span className={cn(option.name === selectedSortOption && styles.bold)}>
                                            {option.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
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
    id: PT.string,
    legacyId: PT.oneOfType([PT.string, PT.number]),
    legacy: PT.shape({
      forumId: PT.number,
    }),
    userDetails: PT.shape({
      roles: PT.arrayOf(PT.string),
    }),
    type: PT.string,
    track: PT.string,
    tags: PT.arrayOf(PT.shape()),
    metadata: PT.arrayOf(PT.string),
    submissionViewable: PT.string,
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
  onSort: PT.func.isRequired,
  viewAsTable: PT.bool.isRequired,
};
