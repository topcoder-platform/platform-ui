import React, { useEffect, useState } from "react";
import { connect, useSelector, useDispatch } from "react-redux";
import _ from "lodash";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import Page from "../../components/Page";
import PageContent from "../../components/PageContent";
import PageDivider from "../../components/PageDivider";
import PageFoot from "../../components/PageElements/PageFoot";
import PageH2 from "../../components/PageElements/PageH2";
import Progress from "../../components/Progress";
import { WebsiteDesignBannerLegacy } from "../../components/Banners/WebsiteDesignBannerLegacy";
import {
  BUTTON_SIZE,
  BUTTON_TYPE,
  PageOptions,
  ROUTES,
} from "../../constants/";
import {
  saveBasicInfo,
  toggleSupportModal,
  savePageDetails,
  saveWorkType,
  resetIntakeForm,
} from "../../actions/form";
import { triggerAutoSave } from "../../actions/autoSave";
import { setProgressItem } from "../../actions/progress";
import { ReactComponent as BackIcon } from "../../assets/images/icon-back-arrow.svg";
import BasicInfoFormLegacy from "./components/BasicInfoFormLegacy";
import styles from "./styles.module.scss";
import {
  getDynamicPriceAndTimeline,
  getDynamicPriceAndTimelineEstimate,
  currencyFormat,
} from "../../utils/";

import { Breadcrumb, ContactSupportModal } from "../../../src-ts";
import { useNavigate } from "react-router-dom";

/**
 * Basic Info Page
 */
const BasicInfoLegacy = ({
  saveBasicInfo,
  setProgressItem,
  savePageDetails,
  toggleSupportModal,
  saveWorkType,
  isLoggedIn,
}) => {
  const [formData, setFormData] = useState({
    projectTitle: { title: "Project Title", option: "", value: "" },
    numberOfPages: { title: "How Many Pages?", option: "", value: "" },
    selectedDevice: {
      title: "Device Types",
      option: ["Computer"],
      value: [0],
    },
  });
  const isFormValid = formData?.projectTitle?.value.length;
  const dispatch = useDispatch();
  const navigate = useNavigate()
  const [isLoading] = useState(false);
  const workType = useSelector((state) => state.form.workType);
  const basicInfo = useSelector((state) => state.form.basicInfo);
  const currentStep = useSelector((state) => state.progress.currentStep);
  const pageDetails = useSelector((state) => state.form.pageDetails);
  const showSupportModal = useSelector((state) => state.form.showSupportModal);
  const challenge = useSelector((state) => state.challenge);
  const fullState = useSelector((state) => state);
  const estimate = getDynamicPriceAndTimelineEstimate(fullState);

  const onBack = () => {
    dispatch(resetIntakeForm(true));
    navigate("/self-service/wizard");
  };

  const onNext = () => {
    setProgressItem(3);
    saveBasicInfo(formData);
    navigate("/self-service/work/new/website-design-legacy/website-purpose");
  };

  const updateNumOfPages = (newNumOfPages) => {
    let newPages = pageDetails?.pages || [];
    if (newNumOfPages < newPages.length) {
      newPages.length = newNumOfPages;
    } else if (newNumOfPages !== newPages.length) {
      for (let i = newPages.length; i < newNumOfPages; i += 1) {
        newPages.push({
          pageName: "",
          pageDetails: "",
        });
      }
    }

    savePageDetails({
      ...pageDetails,
      pages: newPages,
    });
    setFormData({
      ...formData,
      numberOfPages: {
        title: "How Many Pages?",
        option: newNumOfPages === 1 ? "1 Screen" : `${newNumOfPages} Screens`,
        value: newNumOfPages === 1 ? "1 Screen" : `${newNumOfPages} Screens`,
      },
    });
  };

  const [firstMounted, setFirstMounted] = useState(true);

  useEffect(() => {
    if (!firstMounted) {
      return;
    }

    setProgressItem(2);

    if (currentStep === 0) {
      saveWorkType({
        selectedWorkType: "Website Design Legacy",
        selectedWorkTypeDetail: "Website Design Legacy",
      });
      dispatch(triggerAutoSave(true, isLoggedIn));
    }

    if (basicInfo && basicInfo?.projectTitle?.value.length > 0) {
      setFormData(basicInfo);
    }

    setFirstMounted(false);

    return () => {
      dispatch(triggerAutoSave(true, isLoggedIn));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basicInfo, currentStep, dispatch, setProgressItem, firstMounted]);

  useEffect(() => {
    if (formData) {
      saveBasicInfo(formData);
    }
  }, [formData, formData.selectedDevices, saveBasicInfo]);

  const onShowSupportModal = () => {
    toggleSupportModal(true);
  };
  const onHideSupportModal = () => {
    toggleSupportModal(false);
  };

  const breadcrumbs = [
    { url: ROUTES.DASHBOARD_PAGE, name: "My work" },
    {
      url: ROUTES.INTAKE_FORM,
      name: "Start work",
      onClick: () => {
        dispatch(resetIntakeForm(true));
      },
    },
    { url: ROUTES.WEBSITE_DESIGN_LEGACY, name: "Basic Info" },
  ];

  return (
    <>
      <LoadingSpinner show={isLoading} />
      <ContactSupportModal
        workId={challenge?.id}
        isOpen={showSupportModal}
        isSelfService={true}
        onClose={onHideSupportModal}
      />
      <Page>
        <Breadcrumb items={breadcrumbs} />
        <WebsiteDesignBannerLegacy />
        <PageContent styleName={"container"}>
          <div className={styles["title-wrapper"]}>
            <PageH2>BASIC INFO</PageH2>
          </div>
          <Progress level={2} setStep={setProgressItem} />
          <PageDivider />

          <BasicInfoFormLegacy
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
            updateNumOfPages={updateNumOfPages}
            onShowSupportModal={onShowSupportModal}
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
                <Button
                  disabled={!isFormValid}
                  size={BUTTON_SIZE.MEDIUM}
                  onClick={onNext}
                >
                  NEXT
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
};

export default connect(mapStateToProps, mapDispatchToProps)(BasicInfoLegacy);
