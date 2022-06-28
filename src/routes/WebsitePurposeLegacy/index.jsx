import React, { useEffect, useState } from "react";
import { connect, useSelector, useDispatch } from "react-redux";
import { navigate, redirectTo } from "@reach/router";

import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import Page from "../../components/Page";
import PageContent from "../../components/PageContent";
import PageDivider from "../../components/PageDivider";
import PageFoot from "../../components/PageElements/PageFoot";
import PageH2 from "../../components/PageElements/PageH2";
import Progress from "../../components/Progress";
import { BUTTON_SIZE, BUTTON_TYPE, ROUTES } from "../../constants/";
import { getDynamicPriceAndTimelineEstimate } from "../../utils/";
import { triggerAutoSave } from "../../actions/autoSave";
import { resetIntakeForm, saveWebsitePurpose } from "../../actions/form";
import { setProgressItem } from "../../actions/progress";
import { ReactComponent as BackIcon } from "../../assets/images/icon-back-arrow.svg";
import { WebsiteDesignBannerLegacy } from "../../components/Banners/WebsiteDesignBannerLegacy";

import WebsitePurposeForm from "./components/WebsitePurposeForm";
import styles from "./styles.module.scss";

import { Breadcrumb } from "../../../src-ts";

/**
 * Website Purpose Page
 */
const WebsitePurposeLegacy = ({ saveWebsitePurpose, setProgressItem }) => {
  const [isLoading] = useState(false);
  const [formData, setFormData] = useState({
    industry: { title: "Your Industry", option: "", value: null },
    description: { title: "Description", option: "", value: "" },
    userStory: { title: "User Story", option: "", value: "" },
    existingWebsite: { title: "Existing Website?", option: "", value: "" },
    existingWebsiteInfo: {
      title: "Existing Website Information",
      option: "",
      value: "",
    },
  });
  const dispatch = useDispatch();
  const workType = useSelector((state) => state.form.workType);
  const websitePurpose = useSelector((state) => state.form.websitePurpose);
  const currentStep = useSelector((state) => state.progress.currentStep);
  const fullState = useSelector((state) => state);

  const isFormValid =
    formData?.industry?.value &&
    formData?.description?.value.length &&
    formData?.userStory?.value.length;

  const onBack = () => {
    navigate("/self-service/work/new/website-design/basic-info");
  };

  const onNext = () => {
    saveWebsitePurpose(formData);
    navigate("/self-service/work/new/website-design/page-details");
    setProgressItem(4);
  };

  const [firstMounted, setFirstMounted] = useState(true);
  useEffect(() => {
    if (!firstMounted) {
      return;
    }

    setProgressItem(3);

    if (currentStep === 0) {
      redirectTo("/self-service");
    }

    if (websitePurpose) {
      setFormData(websitePurpose);
    }

    setFirstMounted(false);

    return () => {
      dispatch(triggerAutoSave(true));
    };
  }, [currentStep, websitePurpose, dispatch, setProgressItem, firstMounted]);

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
    { url: "#", name: "Website purpose" },
  ];

  return (
    <>
      <LoadingSpinner show={isLoading} />
      <Page>
        <Breadcrumb items={breadcrumbs} />
        <WebsiteDesignBannerLegacy />
        <PageContent>
          <PageH2>WEBSITE PURPOSE</PageH2>
          <PageDivider />

          <WebsitePurposeForm
            estimate={getDynamicPriceAndTimelineEstimate(fullState)}
            serviceType={workType?.selectedWorkTypeDetail}
            formData={formData}
            setFormData={setFormData}
            saveWebsitePurpose={saveWebsitePurpose}
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

          <Progress level={3} setStep={setProgressItem} />
        </PageContent>
      </Page>
    </>
  );
};

const mapStateToProps = ({ form }) => form;

const mapDispatchToProps = {
  saveWebsitePurpose,
  setProgressItem,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WebsitePurposeLegacy);
