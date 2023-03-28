import React, { useEffect, useState } from "react";
import { connect, useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import _ from "lodash";

import {
  Breadcrumb,
  ContactSupportModal,
  WorkType,
  SaveForLaterIcon,
} from "../../../../../src-ts";

import Button from "../../../../components/Button";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import Page from "../../../../components/Page";
import PageContent from "../../../../components/PageContent";
import PageDivider from "../../../../components/PageDivider";
import PageFoot from "../../../../components/PageElements/PageFoot";
import {
  BUTTON_SIZE,
  BUTTON_TYPE,
  PageOptions,
  PrimaryDataChallengeOptions,
} from "../../../../constants/";
import {
  saveBasicInfo,
  toggleSupportModal,
  savePageDetails,
  saveWorkType,
  resetIntakeForm,
} from "../../../../actions/form";
import { triggerAutoSave, triggerCookieClear } from "../../../../actions/autoSave";
import { setProgressItem } from "../../../../actions/progress";
import { ReactComponent as BackIcon } from "../../../../assets/images/icon-back-arrow.svg";

import BasicInfoForm from "../BasicInfoForm";
import {
  getDynamicPriceAndTimeline,
  getDataAdvisoryPriceAndTimelineEstimate,
  currencyFormat,
  getDataExplorationPriceAndTimelineEstimate,
  getFindMeDataPriceAndTimelineEstimate,
  getWebsiteDesignPriceAndTimelineEstimate,
} from "../../../../utils/";
import FeaturedWorkTypeBanner from "../../../../components/Banners/FeaturedWorkTypeBanner";

import styles from "./styles.module.scss";

/**
 * Basic Info Page
 */
const BasicInfo = ({
  saveBasicInfo,
  saveWorkType,
  setProgressItem,
  toggleSupportModal,
  workItemConfig,
  isLoggedIn,
  triggerCookieClear,
  breadcrumb = [],
}) => {

  const defaultFormData = {
    projectTitle: { title: "Project Title", option: "", value: "" },
    description: { title: "Description", option: "", value: "" },
    assetsUrl: { title: "Shareable URL Link(s)", value: "" },
    assetsDescription: { title: "About Your Assets", value: "" },
    goals: { title: "Goals & Data Description", option: "", value: null },
    analysis: { title: "What Data Do You Need?", option: "", value: "" },
    feedback: { title: "What Data Do You like?", option: "", value: "" },
    yourIndustry: { title: "Your Industry", option: "", value: "" },
    colorOption: { title: "Color Option", value: [], option: [] },
    likedStyles: { title: "Liked Styles", value: [], option: [] },
    dislikedStyles: { title: "Disliked Styles", value: [], option: [] },
    specificColor: { title: "Custom Color", option: "", value: "" },
    primaryDataChallenge: {
      title: "Primary Data Challenge",
      option: PrimaryDataChallengeOptions[0].label,
      value: 0,
    },
    primaryDataChallengeOther: {
      title: "Primary Data Challenge (Other Option)",
      option: "",
      value: "",
    },
    inspiration: [
      {
        website: { title: "Website Address", value: "", option: "" },
        feedback: { title: "What Do You Like", value: "", option: "" },
      },
    ],
    sampleData: { title: "Sample Data", option: "", value: "" },
  };

  const navigate = useNavigate()

  const [formData, setFormData] = useState(defaultFormData);
  const isFindMeData = workItemConfig.type === WorkType.findData;
  const isWebsiteDesign = workItemConfig.type === WorkType.design;
  const isWebsiteDesignFormValid = formData?.projectTitle?.value?.trim().length;
  const isDataExploration = workItemConfig.type === WorkType.data;
  const isDataAdvisory = workItemConfig.type === WorkType.problem;
  const isDataExplorationFormValid =
    formData?.projectTitle?.value?.trim().length &&
    formData?.goals?.value?.trim().length;
  const isDataAdvisoryFormValid =
    formData?.projectTitle?.value?.trim().length &&
    formData?.goals?.value?.trim().length;
  const isFindMeDataFormValid =
    formData?.projectTitle?.value?.trim().length &&
    formData?.analysis?.value?.trim().length &&
    ((formData?.primaryDataChallenge?.value >= 0 &&
      formData?.primaryDataChallenge?.value < 3) ||
      (formData?.primaryDataChallenge?.value === 3 &&
        formData?.primaryDataChallengeOther?.value?.trim().length)) &&
    formData?.sampleData?.value?.trim().length;

  let isFormValid;
  if (isDataExploration) {
    isFormValid = isDataExplorationFormValid;
  } else if (isFindMeData) {
    isFormValid = isFindMeDataFormValid;
  } else if (isWebsiteDesign) {
    isFormValid = isWebsiteDesignFormValid;
  } else if (isDataAdvisory) {
    isFormValid = isDataAdvisoryFormValid;
  }

  const dispatch = useDispatch();
  const [isLoading] = useState(false);
  const workType = useSelector((state) => state.form.workType);
  const basicInfo = useSelector((state) => state.form.basicInfo);
  const currentStep = useSelector((state) => state.progress.currentStep);
  const pageDetails = useSelector((state) => state.form.pageDetails);
  const showSupportModal = useSelector((state) => state.form.showSupportModal);
  const challenge = useSelector((state) => state.challenge);

  const estimate =
    workType?.selectedWorkType === WorkType.design
      ? getWebsiteDesignPriceAndTimelineEstimate()
      : isDataExploration
        ? getDataExplorationPriceAndTimelineEstimate()
        : isDataAdvisory
          ? getDataAdvisoryPriceAndTimelineEstimate()
          : getFindMeDataPriceAndTimelineEstimate();

  const onBack = () => {
    dispatch(triggerCookieClear());
    saveBasicInfo(defaultFormData);
    navigate("/self-service/wizard");
  };

  const baseUrl = `/self-service/work/new/${workItemConfig.basePath}`;

  const onNext = () => {
    setProgressItem(isLoggedIn ? 7 : 5);
    saveBasicInfo(formData);
    dispatch(triggerAutoSave(true, isLoggedIn, true));
    navigate(isLoggedIn ? `${baseUrl}/review` : `${baseUrl}/login-prompt`);
  };

  const [firstMounted, setFirstMounted] = useState(true);

  useEffect(() => {
    if (!firstMounted) {
      return;
    }

    setProgressItem(2);

    if (currentStep === 0) {
      saveWorkType({
        selectedWorkType: workItemConfig.type,
        selectedWorkTypeDetail: workItemConfig.title,
      });
      dispatch(triggerAutoSave(true, isLoggedIn));
    }

    if (!!basicInfo?.projectTitle?.value?.length) {
      setFormData(basicInfo);
    }

    setFirstMounted(false);

    return () => {
      dispatch(triggerAutoSave(true, isLoggedIn, false));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basicInfo, currentStep, dispatch, setProgressItem, firstMounted]);

  useEffect(() => {
    if (
      formData?.primaryDataChallenge?.value !== 3 &&
      formData?.primaryDataChallengeOther?.value?.trim().length > 0
    ) {
      setFormData({
        ...formData,
        primaryDataChallengeOther: {
          ...formData.primaryDataChallengeOther,
          option: "",
          value: "",
        },
      });
    } else {
      if (formData) {
        saveBasicInfo(formData);
      }
    }
  }, [formData, formData.selectedDevices, saveBasicInfo]);

  const onShowSupportModal = () => {
    toggleSupportModal(true);
  };
  const onHideSupportModal = () => {
    toggleSupportModal(false);
  };

  const saveForm = (autoSave) => {
    saveBasicInfo(formData);
    dispatch(triggerAutoSave(autoSave, isLoggedIn, true));
    if (autoSave) navigate("/self-service");
  };

  const onClickBreadcrumbItem = (item) => {
    if (item.name === "Start work") {
      dispatch(resetIntakeForm(true));
      dispatch(triggerCookieClear());
      saveBasicInfo(defaultFormData);
    }
  };

  return (
    <>
      <LoadingSpinner show={isLoading} />
      <ContactSupportModal
        challengeId={challenge?.id}
        isOpen={showSupportModal}
        isSelfService={true}
        onClose={onHideSupportModal}
      />
      <Page>
        <Breadcrumb
          items={breadcrumb.map((item) => ({
            ...item,
            onClick: onClickBreadcrumbItem,
          }))}
        />
        <FeaturedWorkTypeBanner
          title={workItemConfig.title}
          subTitle={workItemConfig.subTitle}
          workType={workItemConfig.type}
        />
        <PageContent styledName={"container"}>
          <BasicInfoForm
            pageListOptions={_.map(PageOptions, (o, i) => ({
              ...o,
              value: i === (pageDetails?.pages?.length || 0) - 1,
              label: `${o.label} (${currencyFormat(
                getDynamicPriceAndTimeline(
                  i + 1,
                  formData?.selectedDevice?.value?.length || 0
                ).total
              )})`,
            }))}
            estimate={estimate}
            formData={formData}
            serviceType={workType?.selectedWorkTypeDetail}
            onFormUpdate={setFormData}
            numOfPages={pageDetails?.pages?.length || 0}
            onShowSupportModal={onShowSupportModal}
            bannerData={workItemConfig}
            saveForm={saveForm}
          />

          <PageDivider />
          <PageFoot>
            <div className={styles["footerContent"]}>
              <div>
                <Button
                  size={BUTTON_SIZE.MEDIUM}
                  type={BUTTON_TYPE.SECONDARY}
                  onClick={onBack}
                >
                  <div className={styles["backButtonWrapper"]}>
                    <BackIcon />
                  </div>
                </Button>
              </div>
              <div className={styles["footer-right"]}>
                {isLoggedIn && (
                  <Button
                    className={styles["saveForLater"]}
                    disabled={!isFormValid}
                    size={BUTTON_SIZE.MEDIUM}
                    type={BUTTON_TYPE.SECONDARY}
                    onClick={() => saveForm(true)}
                  >
                    <SaveForLaterIcon />
                    <span>SAVE FOR LATER</span>
                  </Button>
                )}
                <Button
                  className={styles["reviewAndSubmit"]}
                  disabled={!isFormValid}
                  size={BUTTON_SIZE.MEDIUM}
                  onClick={onNext}
                >
                  <span>
                    <span className={styles["desktop"]}>REVIEW &amp;</span> SUBMIT
                  </span>
                </Button>
              </div>
            </div>
          </PageFoot>
        </PageContent>
      </Page>
    </>
  );
};

const mapStateToProps = ({ form }) => form;

const mapDispatchToProps = {
  saveBasicInfo,
  setProgressItem,
  savePageDetails,
  toggleSupportModal,
  saveWorkType,
  triggerCookieClear,
};

export default connect(mapStateToProps, mapDispatchToProps)(BasicInfo);
