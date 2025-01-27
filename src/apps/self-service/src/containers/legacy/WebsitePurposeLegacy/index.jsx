import React, { useEffect, useState } from "react";
import { connect, useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Button, Breadcrumb, IconOutline, LoadingSpinner, PageDivider } from "~/libs/ui";

import { ROUTES, selfServiceRootRoute, selfServiceStartRoute } from "../../../config";
import { getDynamicPriceAndTimelineEstimate } from "../../../utils";
import { triggerAutoSave } from "../../../actions/autoSave";
import { resetIntakeForm, saveWebsitePurpose } from "../../../actions/form";
import { setProgressItem } from "../../../actions/progress";
import { Progress, WebsiteDesignBannerLegacy } from "../../../components/legacy";
import { PageContent, PageFoot, PageH2 } from "../../../components/page-elements";

import WebsitePurposeForm from "./components/WebsitePurposeForm";
import styles from "./styles.module.scss";


/**
 * Website Purpose Page
 */
const WebsitePurposeLegacy = ({ saveWebsitePurpose, setProgressItem, isLoggedIn }) => {

  const navigate = useNavigate()

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
    navigate(`${selfServiceRootRoute}/new/website-design-legacy/basic-info`);
  };

  const onNext = () => {
    saveWebsitePurpose(formData);
    navigate(`${selfServiceRootRoute}/new/website-design-legacy/page-details`);
    setProgressItem(4);
  };

  const [firstMounted, setFirstMounted] = useState(true);
  useEffect(() => {
    if (!firstMounted) {
      return;
    }

    setProgressItem(3);

    if (currentStep === 0) {
      navigate(selfServiceStartRoute);
    }

    if (websitePurpose) {
      setFormData(websitePurpose);
    }

    setFirstMounted(false);

    return () => {
      dispatch(triggerAutoSave(true, isLoggedIn));
    };
  }, [currentStep, websitePurpose, dispatch, setProgressItem, firstMounted, navigate, isLoggedIn]);

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
      <LoadingSpinner hide={!isLoading} overlay />
      <Breadcrumb items={breadcrumbs} />
      <WebsiteDesignBannerLegacy />
      <PageContent>
        <div className={styles["title-wrapper"]}>
          <PageH2>WEBSITE PURPOSE</PageH2>
        </div>
        <Progress level={3} setStep={setProgressItem} />
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
                size='lg'
                secondary
                onClick={onBack}
                icon={IconOutline.ChevronLeftIcon}
                iconToLeft
              />
            </div>
            <div className={styles["footer-right"]}>
              <Button
                primary
                disabled={!isFormValid}
                size='lg'
                onClick={onNext}
              >
                NEXT
              </Button>
            </div>
          </div>
        </PageFoot>
      </PageContent>
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
