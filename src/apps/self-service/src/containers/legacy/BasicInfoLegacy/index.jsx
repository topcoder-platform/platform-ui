import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { connect, useSelector, useDispatch } from "react-redux";
import _ from "lodash";

import {
    Breadcrumb,
    Button,
    IconOutline,
    LoadingSpinner,
    PageDivider,
} from "~/libs/ui";
import { ContactSupportModal } from "~/libs/shared";

import { Progress, WebsiteDesignBannerLegacy } from "../../../components/legacy";
import { PageOptions, ROUTES, selfServiceRootRoute, selfServiceStartRoute } from "../../../config";
import {
  saveBasicInfo,
  toggleSupportModal,
  savePageDetails,
  saveWorkType,
  resetIntakeForm,
} from "../../../actions/form";
import { triggerAutoSave } from "../../../actions/autoSave";
import { setProgressItem } from "../../../actions/progress";
import {
    getDynamicPriceAndTimeline,
    getDynamicPriceAndTimelineEstimate,
    currencyFormat,
} from "../../../utils";
import { PageContent, PageFoot, PageH2 } from "../../../components/page-elements";

import BasicInfoFormLegacy from "./components/BasicInfoFormLegacy";
import styles from "./styles.module.scss";

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
    navigate(selfServiceStartRoute);
  };

  const onNext = () => {
    setProgressItem(3);
    saveBasicInfo(formData);
    navigate(`${selfServiceRootRoute}/new/website-design-legacy/website-purpose`);
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
      <LoadingSpinner hide={!isLoading} overlay />
      <ContactSupportModal
        workId={challenge?.id}
        isOpen={showSupportModal}
        isSelfService={true}
        onClose={onHideSupportModal}
      />
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
  saveBasicInfo,
  setProgressItem,
  savePageDetails,
  toggleSupportModal,
  saveWorkType,
};

export default connect(mapStateToProps, mapDispatchToProps)(BasicInfoLegacy);
