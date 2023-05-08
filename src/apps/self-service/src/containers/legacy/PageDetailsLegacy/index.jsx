import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";

import { Breadcrumb, Button, IconOutline, LoadingSpinner, PageDivider } from "~/libs/ui";

import { ROUTES } from "../../../config";
import { getDynamicPriceAndTimelineEstimate } from "../../../utils";
import { triggerAutoSave } from "../../../actions/autoSave";
import { resetIntakeForm, savePageDetails } from "../../../actions/form";
import { setProgressItem } from "../../../actions/progress";
import { Progress, WebsiteDesignBannerLegacy } from "../../../components/legacy";
import { PageContent, PageFoot, PageH2 } from "../../../components/page-elements";

import PageDetailsForm from "./components/PageDetailsForm";
import styles from "./styles.module.scss";

/**
 * Page Details Page
 */
const PageDetailsLegacy = ({ savePageDetails, setProgressItem, isLoggedIn }) => {

  const navigate = useNavigate()
  const [isLoading] = useState(false);
  const [listInputs, setListInputs] = useState({
    pages: [
      {
        pageName: "",
        pageDetails: "",
      },
    ],
  });
  const dispatch = useDispatch();
  const workType = useSelector((state) => state.form.workType);
  const pageDetails = useSelector((state) => state.form.pageDetails);
  const currentStep = useSelector((state) => state.progress.currentStep);
  const fullState = useSelector((state) => state);
  const estimate = getDynamicPriceAndTimelineEstimate(fullState);

  const onBack = () => {
    navigate("/self-service/work/new/website-design-legacy/website-purpose");
  };

  const [firstMounted, setFirstMounted] = useState(true);
  useEffect(() => {
    if (!firstMounted) {
      return;
    }

    setProgressItem(4);

    if (currentStep === 0) {
      navigate("/self-service/wizard");
    }

    if (pageDetails) {
      setListInputs(pageDetails);
    }

    setFirstMounted(false);

    return () => {
      dispatch(triggerAutoSave(true, isLoggedIn));
    };
  }, [currentStep, pageDetails, dispatch, setProgressItem, firstMounted, navigate, isLoggedIn]);

  const onNext = () => {
    navigate("/self-service/work/new/website-design-legacy/login-prompt");
    savePageDetails(listInputs);
    setProgressItem(5);
  };

  const isFormValid = () => {
    let isValid = true;
    (listInputs?.pages || []).forEach((item) => {
      if (!item.pageName.length || !item.pageDetails.length) {
        isValid = false;
      }
    });
    return isValid;
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
    { url: "#", name: "Page details" },
  ];

  return (
    <>
      <LoadingSpinner hide={!isLoading} overlay />
      <Breadcrumb items={breadcrumbs} />
      <WebsiteDesignBannerLegacy />
      <PageContent>
        <div className={styles["title-wrapper"]}>
          <PageH2>PAGE DETAILS</PageH2>
        </div>
        <Progress level={4} setStep={setProgressItem} />
        <PageDivider />

        <PageDetailsForm
          estimate={estimate}
          savePageDetails={savePageDetails}
          serviceType={workType?.selectedWorkTypeDetail}
          listInputs={listInputs}
          setListInputs={setListInputs}
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
                disabled={!isFormValid()}
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
  savePageDetails,
  setProgressItem,
};

export default connect(mapStateToProps, mapDispatchToProps)(PageDetailsLegacy);
