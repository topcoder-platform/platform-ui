import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";

import { profileContext } from "~/libs/core";
import { Breadcrumb, Button, IconOutline, LoadingSpinner, PageDivider } from "~/libs/ui";

import { triggerAutoSave } from "../../../actions/autoSave";
import { resetIntakeForm, saveBranding } from "../../../actions/form";
import { setProgressItem } from "../../../actions/progress";
import { Progress, WebsiteDesignBannerLegacy } from "../../../components/legacy";
import { PageContent, PageFoot, PageH2 } from "../../../components/page-elements";
import { ROUTES } from "../../../config";
import { getDynamicPriceAndTimelineEstimate } from "../../../utils";

import BrandingForm from "./components/BrandingForm";
import styles from "./styles.module.scss";

/**
 * Branding Page
 */
const BrandingLegacy = ({ saveBranding, setProgressItem, isLoggedIn }) => {

  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    theme: { title: "Style & Theme", option: "", value: null },
    inspiration: [
      {
        website: { title: "Website Address", value: "", option: "" },
        feedback: { title: "What Do You Like", value: "", option: "" },
      },
    ],
    colorOption: { title: "Color Option", value: [], option: [] },
    specificColor: { title: "Custom Color", option: "", value: "" },
    fontOption: { title: "Fonts", option: "", value: -1 },
    fontUrl: { title: "Custom Font URL", value: "", option: "" },
    fontUsageDescription: {
      title: "How to Use Your Fonts",
      value: "",
      option: "",
    },
    assetsUrl: { title: "Custom Assets URL", value: "" },
    anythingToAvoid: { title: "Anything to Avoid?", option: "", value: "" },
    allowStockOption: {
      title: "Allow Stock Photos",
      option: "",
      value: null,
    },
    selectedDeliverableOption: {
      title: "Final Deliverable Option",
      option: "",
      value: null,
    },
    customDeliverable: { title: "Custom Deliverable", option: "", value: "" },
  });

  const { initialized } = useContext(profileContext)

  const dispatch = useDispatch();
  const workType = useSelector((state) => state.form.workType);
  const branding = useSelector((state) => state.form.branding);
  const currentStep = useSelector((state) => state.progress.currentStep);
  const fullState = useSelector((state) => state);

  const [firstMounted, setFirstMounted] = useState(true);
  useEffect(() => {
    if (!firstMounted) {
      return;
    }

    setProgressItem(5);

    if (currentStep === 0) {
      navigate("/self-service/wizard");
    }

    if (branding) {
      setFormData(branding);
    }

    setFirstMounted(false);

    return () => {
      dispatch(triggerAutoSave(true, isLoggedIn));
    };
  }, [currentStep, branding, dispatch, setProgressItem, firstMounted, navigate, isLoggedIn]);

  const isFormValid =
    formData?.theme?.value &&
    formData?.selectedDeliverableOption?.value !== null &&
    (formData?.colorOption.value.length > 0 ||
      formData?.specificColor.value.trim() !== "") &&
    (formData?.selectedDeliverableOption.option !== "Other" ||
      formData?.customDeliverable.value.trim() !== "") &&
    (formData?.fontOption.option !== null ||
      formData?.fontUrl.value.trim() !== "");

  const onBack = () => {
    navigate("/self-service/work/new/website-design-legacy/page-details");
  };

  const onNext = () => {
    navigate("/self-service/work/new/website-design-legacy/review");
    saveBranding(formData);
    setProgressItem(6);
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
    { url: ROUTES.WEBSITE_DESIGN_PURPOSE_LEGACY, name: "Website purpose" },
    { url: ROUTES.WEBSITE_DESIGN_PAGE_DETAILS_LEGACY, name: "Page details" },
    { url: "#", name: "Branding" },
  ];

  return (
    <>
      <LoadingSpinner hide={initialized} />
      <Breadcrumb items={breadcrumbs} />
      <WebsiteDesignBannerLegacy />
      <PageContent>
        <div className={styles["title-wrapper"]}>
          <PageH2>BRANDING</PageH2>
        </div>
        <Progress level={5} setStep={setProgressItem} />
        <PageDivider />

        <BrandingForm
          estimate={getDynamicPriceAndTimelineEstimate(fullState)}
          serviceType={workType?.selectedWorkTypeDetail}
          formData={formData}
          setFormData={setFormData}
          saveBranding={saveBranding}
        />


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
  saveBranding,
  setProgressItem,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BrandingLegacy);
