import { useEffect, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toastr } from "react-redux-toastr";
import { loadStripe } from "@stripe/stripe-js/pure";
import { Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import _ from "lodash";

import { EnvironmentConfig } from "~/config";
import { Breadcrumb, Button, IconOutline, LoadingSpinner, OrderContractModal, PageDivider } from "~/libs/ui";

import { resetIntakeForm } from "../../../actions/form";
import { MAX_COMPLETED_STEP, ROUTES } from "../../../config";
import { triggerAutoSave } from "../../../actions/autoSave";
import { setProgressItem } from "../../../actions/progress";
import * as services from "../../../services/payment";
import { activateChallenge } from "../../../services/challenge";
import { getDynamicPriceAndTimelineEstimate, currencyFormat } from "../../../utils";
import {
  loadChallengeId,
  setCookie,
  clearCachedChallengeId,
} from "../../../utils/autoSaveBeforeLogin";
import { PageContent, PageFoot, PageH2 } from "../../../components/page-elements";
import { Progress } from "../../../components/legacy";
import { WorkServicePrice } from "../../../components/work-service-price";
import AboutYourProject from "../../products/review/components/AboutYourProject";
import PaymentForm from "../../products/review/components/PaymentForm";

import ReviewTableLegacy from "./components/ReviewTableLegacy";
import styles from "./styles.module.scss";

let stripePromise;

/**
 *  Review Legacy Page
 */
const ReviewLegacy = ({
  setProgressItem,
  showProgress,
  introText,
  banner,
  icon,
  showIcon,
  enableEdit = true,
  secondaryBanner,
  isLoggedIn,
}) => {

  const dispatch = useDispatch();
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const intakeFormData = useSelector((state) => state?.form);
  const [formData, setFormData] = useState({
    cardName: null,
    cardNumber: false, // value is bool indicating if it's valid or not
    country: null,
    cvc: false, // value is bool indicating if it's valid or not
    expiryDate: false, // value is bool indicating if it's valid or not
    zipCode: null,
    checked: false, // value to toggle terms and conditions checkbox
  });
  const navigate = useNavigate()

  const currentStep = useSelector((state) => state?.progress.currentStep);
  const workType = useSelector((state) => state.form.workType);
  const stripe = useStripe();
  const elements = useElements();
  const fullState = useSelector((state) => state);
  const [isOrderContractModalOpen, setIsOrderContractModalOpen] =
    useState(false);
  const estimate = getDynamicPriceAndTimelineEstimate(fullState);

  const [firstMounted, setFirstMounted] = useState(true);

  useEffect(() => {
    if (!firstMounted) {
      return;
    }

    setProgressItem(7);

    if (currentStep === 0) {
      navigate("/self-service");
    }

    setFirstMounted(false);

    return () => {
      dispatch(triggerAutoSave(true, isLoggedIn));
    };
  }, [currentStep, formData, dispatch, setProgressItem, firstMounted, navigate, isLoggedIn]);

  const [anotherFirstMounted, setAnotherFirstMounted] = useState(true);
  useEffect(() => {
    if (!anotherFirstMounted) {
      return;
    }

    if (currentStep === 0) {
      navigate("/self-service");
    }

    setAnotherFirstMounted(false);
  }, [currentStep, anotherFirstMounted, navigate]);

  const onBack = () => {
    navigate("/self-service/work/new/website-design-legacy/branding");
  };

  const clearPreviousForm = () => {
    setCookie(MAX_COMPLETED_STEP, "", -1);
    clearCachedChallengeId();
    dispatch(resetIntakeForm(true));
  };

  const challengeId = loadChallengeId();
  const onNext = async () => {
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setPaymentFailed(false);

    const numOfPages = _.get(fullState, "form.pageDetails.pages.length", 1);
    const numOfDevices = _.get(
      fullState,
      "form.basicInfo.selectedDevice.option.length",
      1
    );
    const additionalPaymentInfo = `\n${numOfPages} Pages\n${numOfDevices} Devices`;

    const description = `Work Item #${challengeId}\n${_.get(
      fullState,
      "form.basicInfo.projectTitle.value",
      ""
    ).slice(0, 355)}\n${_.get(
      fullState,
      "form.workType.selectedWorkType"
    )}${additionalPaymentInfo}`;

    services
      .processPayment(
        stripe,
        elements,
        estimate.total,
        challengeId,
        formData.email,
        description
      )
      .then((res) => {
        activateChallenge(challengeId);
        clearPreviousForm();
        navigate("/self-service/work/new/website-design-legacy/thank-you");
        setProgressItem(8);
        setPaymentFailed(false);
      })
      .catch(() => {
        setPaymentFailed(true);
        toastr.error("Error", "There was an error processing the payment");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const isFormValid =
    formData.cardName &&
    formData.cardNumber &&
    formData.country &&
    formData.cvc &&
    formData.expiryDate &&
    formData.zipCode &&
    formData.checked;

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
    { url: ROUTES.WEBSITE_DESIGN_BRANDING_LEGACY, name: "Branding" },
    { url: "#", name: "Review" },
  ];

  return (
    <>
      <OrderContractModal
        isOpen={isOrderContractModalOpen}
        onClose={() => setIsOrderContractModalOpen(false)}
      />
      <LoadingSpinner hide={!isLoading} />
      <Breadcrumb items={breadcrumbs} />
      {banner}
      <PageContent styleName={"container"}>
        <div className={styles["title-wrapper"]}>
          <PageH2>REVIEW & PAYMENT</PageH2>
        </div>
        {showProgress && <Progress level={6} setStep={setProgressItem} />}
        <PageDivider />
        <WorkServicePrice
          hideTitle
          showIcon={showIcon}
          icon={icon}
          price={estimate.total}
          duration={estimate.totalDuration}
          stickerPrice={estimate?.stickerPrice}
          serviceType={workType?.selectedWorkTypeDetail}
        />
        {secondaryBanner}
        {introText && <div className={styles["infoAlert"]}>{introText}</div>}
        <PageDivider />
        <div className={styles["splitView"]}>
          <div className={styles["reviewContainer"]}>
            <ReviewTableLegacy
              formData={intakeFormData}
              enableEdit={enableEdit}
            />
            <div className={styles["hideMobile"]}>
              <AboutYourProject />
            </div>
          </div>
          <div className={styles["paymentWrapper"]}>
            <div className={styles["paymentBox"]}>
              <div className={styles["total"]}>
                {estimate.stickerPrice && (
                  <span className={styles["originalPrice"]}>
                    {currencyFormat(estimate.stickerPrice)}
                  </span>
                )}
                {currencyFormat(estimate.total)}
              </div>

              <div className={styles["totalInfo"]}>Total Payment</div>

              <PageDivider className={styles["pageDivider"]} />

              <PaymentForm
                formData={formData}
                setFormData={setFormData}
                onOpenContractModal={setIsOrderContractModalOpen}
              />
              {paymentFailed && (
                <div className={styles["error"]}>
                  Your card was declined. Please try a different card.
                </div>
              )}

              <div className={styles["paymentButtonContainer"]}>
                <Button
                  primary
                  disabled={!isFormValid || isLoading}
                  size='lg'
                  onClick={onNext}
                  className={styles["wideButton"]}
                >
                  PAY ${estimate.total}
                </Button>
              </div>
            </div>
          </div>
          <div className={styles["showOnlyMobile"]}>
            <AboutYourProject />
          </div>
        </div>

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
          </div>
        </PageFoot>
      </PageContent>
    </>
  );
};

const ReviewWrapper = (props) => {
  if (!stripePromise) {
    stripePromise = loadStripe(EnvironmentConfig.STRIPE.API_KEY, {
      apiVersion: EnvironmentConfig.STRIPE.API_VERSION,
    });
  }

  return (
    <Elements stripe={stripePromise}>
      <ReviewLegacy {...props} />
    </Elements>
  );
};

const mapStateToProps = ({ form }) => form;

const mapDispatchToProps = {
  setProgressItem,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReviewWrapper);
