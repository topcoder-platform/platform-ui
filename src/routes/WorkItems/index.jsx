import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import _ from "lodash";
import PT from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import { connect } from "react-redux";

import LoadingSpinner from "../../components/LoadingSpinner";
import Page from "../../components/Page";
import PageContent from "../../components/PageContent";
import { ROUTES } from "../../constants/";
import workUtil from "../../utils/work";
import Forum from "../Forum";

import {
  getWork,
  getSummary,
  getDetails,
  getSolutions,
  getSolutionsCount,
  downloadSolution,
  saveSurvey,
  setIsSavingSurveyDone,
  getForumNotifications,
} from "../../actions/work";
import { toggleSupportModal } from "../../actions/form";

import {
  Breadcrumb,
  ChallengeMetadataName,
  TabsNavbar,
  workContext,
  WorkDetailDetails,
  WorkDetailHeader,
  WorkDetailSummary,
  WorkFeedback,
  WorkStatusItem,
  WorkDetailSolutions,
  profileContext,
} from "../../../src-ts";

import styles from "./styles.module.scss";

/**
 * Work Item Page
 */
const WorkItem = ({
  work,
  workItem,
  isLoadingWork,
  isLoadingSolutions,
  isSavingSurveyDone,
  forumNotifications,
  getWork,
  getSummary,
  getDetails,
  getSolutions,
  getSolutionsCount,
  downloadSolution,
  saveSurvey,
  setIsSavingSurveyDone,
  getForumNotifications,
}) => {

  const { workItemId } = useParams()

  const [selectedTab, setSelectedTab] = useState("summary");
  const [showSurvey, setShowSurvey] = useState(false);
  const { profile } = useContext(profileContext)
  const navigate = useNavigate()

  const workContextData = useContext(workContext);
  const workStatus = !!work
    ? workContextData.getStatusFromChallenge(work)
    : undefined;

  useEffect(() => {
    getWork(workItemId);
  }, [workItemId, getWork]);

  const { summary, details, solutions, solutionsCount } = useMemo(
    () => workItem,
    [workItem]
  );

  const isReviewPhaseEnded = useMemo(() => {
    if (work) {
      return workUtil.isReviewPhaseEnded(work);
    }
  }, [work]);

  useEffect(() => {
    if (!work) {
      return;
    }

    if (profile) {
      if (work.createdBy !== profile.handle) {
        navigate(ROUTES.HOME_PAGE);
      }
    }

    if (selectedTab === "summary") {
      if (!summary) {
        getSummary(work);
      }
    } else if (selectedTab === "solutions") {
      if (!solutions) {
        isReviewPhaseEnded && getSolutions(work.id);
      }
    } else if (selectedTab === "details") {
      if (!details) {
        getDetails(work);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    work,
    profile,
    selectedTab,
    summary,
    solutions,
    details,
    getSummary,
    getSolutions,
    getDetails,
    isReviewPhaseEnded,
  ]);

  useEffect(() => {
    if (!work) {
      return;
    }

    if (selectedTab === "messaging") {
      getForumNotifications(work.id, profile);
    }
  }, [
    work,
    selectedTab,
    getForumNotifications,
    profile,
  ]);

  useEffect(() => {
    if (!work) {
      return;
    }

    if (isReviewPhaseEnded) {
      getSolutionsCount(work.id);
    }
  }, [isReviewPhaseEnded, getSolutionsCount, work]);

  useEffect(() => {
    if (isSavingSurveyDone) {
      getSummary(work);
      setIsSavingSurveyDone(false);
    }
  }, [work, isSavingSurveyDone, setIsSavingSurveyDone, getSummary]);

  // TODO: get routes from a provider
  const breadcrumb = [
    {
      name: "My work",
      url: ROUTES.DASHBOARD_PAGE,
    },
    {
      name: work?.name,
      url: "", // this isn't necessary bc it's not a link
    },
  ];

  const navTabs = useMemo(
    () =>
      [
        { id: "summary", title: "Summary" },
        { id: "details", title: "Details" },
        work &&
        !workUtil.isMessagesDisabled(work) && {
          id: "messaging",
          title: "Messages",
          badges: [
            forumNotifications?.unreadNotifications && {
              count: +forumNotifications?.unreadNotifications,
              type: "info",
            },
          ].filter(Boolean),
        },
        {
          id: "solutions",
          title: "Solutions",
          badges: [
            isReviewPhaseEnded &&
            !!solutionsCount && {
              count: solutionsCount,
              type: "info",
            },
          ].filter(Boolean),
        },
      ].filter(Boolean),
    [
      work,
      solutionsCount,
      isReviewPhaseEnded,
      forumNotifications,
    ]
  );

  const onTabChange = useCallback((tabId) => {
    window.history.replaceState(window.history.state, "", `?tab=${tabId}`);
    setSelectedTab(tabId);
  }, []);

  function saveFeedback(updatedCustomerFeedback) {
    const metadata = (work.metadata || []).filter(
      (item) => item.name !== ChallengeMetadataName.feedback
    );

    metadata.push({
      name: ChallengeMetadataName.feedback,
      value: JSON.stringify(updatedCustomerFeedback),
    });

    saveSurvey(work.id, metadata);
    setShowSurvey(false);
  }

  return (
    <>
      <LoadingSpinner show={isLoadingWork || isLoadingSolutions} />
      <Page className={styles["page"]}>
        <PageContent className={styles["pageContent"]}>
          <Breadcrumb items={breadcrumb} />
          <WorkDetailHeader
            challenge={work}
            markAsDone={() => setShowSurvey(true)}
          />

          {work && (
            <div className={styles["status-line"]}>
              {work.tags[0] && (
                <div className={styles["status-label"]}>{work.tags[0]}</div>
              )}
              <WorkStatusItem workStatus={workStatus} />
            </div>
          )}

          <TabsNavbar
            tabs={navTabs}
            defaultActive="summary"
            onChange={onTabChange}
          />

          <div className={styles["tabs-contents"]}>
            {selectedTab === "summary" && (
              <div>
                {summary && (
                  <WorkDetailSummary challenge={work} status={workStatus} />
                )}
              </div>
            )}

            {selectedTab === "details" && (
              <div>
                <WorkDetailDetails
                  formData={_.get(details, "intake-form.form", {})}
                />
              </div>
            )}

            {selectedTab === "solutions" && work && (
              <div>
                <WorkDetailSolutions
                  challenge={work}
                  onDownload={downloadSolution}
                  solutions={solutions}
                />
              </div>
            )}

            {selectedTab === "messaging" && (
              <div>{work && <Forum challengeId={work.id} />}</div>
            )}

            {selectedTab === "history" && <div />}
          </div>
        </PageContent>
      </Page>

      <WorkFeedback
        challenge={work}
        onClose={() => setShowSurvey(false)}
        saveSurvey={saveFeedback}
        showSurvey={showSurvey}
      />
    </>
  );
};

WorkItem.propTypes = {
  work: PT.shape(),
  workItem: PT.shape(),
  isLoadingWork: PT.bool,
  isLoadingSolutions: PT.bool,
  isSavingSurveyDone: PT.bool,
  getWork: PT.func,
  getSummary: PT.func,
  getDetails: PT.func,
  getSolutions: PT.func,
  downloadSolution: PT.func,
  saveSurvey: PT.func,
  setIsSavingSurveyDone: PT.func,
};

const mapStateToProps = (state) => {
  const {
    work,
    workItem,
    isLoadingWork,
    isLoadingSolutions,
    isSavingSurveyDone,
    forumNotifications,
  } = state.work;

  return {
    work,
    workItem,
    isLoadingWork,
    isLoadingSolutions,
    isSavingSurveyDone,
    forumNotifications,
  };
};

const mapDispatchToProps = {
  getWork,
  getSummary,
  getDetails,
  getSolutions,
  getSolutionsCount,
  downloadSolution,
  saveSurvey,
  setIsSavingSurveyDone,
  getForumNotifications,
  toggleSupportModal,
};

export default connect(mapStateToProps, mapDispatchToProps)(WorkItem);
