import { useNavigate } from "react-router-dom";
import { Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js/pure";
import { toastr } from "react-redux-toastr";
import { useEffect, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import _ from "lodash";

import { EnvironmentConfig } from "~/config";
import {
    Breadcrumb,
    Button,
    IconOutline,
    LoadingSpinner,
    PageDivider,
} from "~/libs/ui";
import { OrderContractModal } from "~/libs/shared";

import { MAX_COMPLETED_STEP, selfServiceRootRoute, selfServiceStartRoute } from "../../../config";
import { resetIntakeForm } from "../../../actions/form";
import { triggerAutoSave, triggerCookieClear } from "../../../actions/autoSave";
import { setProgressItem } from "../../../actions/progress";
import * as services from "../../../services/payment";
import { activateChallenge } from "../../../services/challenge";
import {
  getWebsiteDesignPriceAndTimelineEstimate,
  getDataExplorationPriceAndTimelineEstimate,
  getFindMeDataPriceAndTimelineEstimate,
  getDataAdvisoryPriceAndTimelineEstimate,
  currencyFormat,
} from "../../../utils";
import { WorkType } from "../../../lib";
import { PageContent, PageFoot } from "../../../components/page-elements";
import { clearCachedChallengeId, loadChallengeId, setCookie } from "../../../utils/autoSaveBeforeLogin";
import { WorkServicePrice } from "../../../components/work-service-price";

import PaymentForm from "./components/PaymentForm";
import ReviewTable from "./components/ReviewTable";
import AboutYourProject from "./components/AboutYourProject";
import styles from "./styles.module.scss";

let stripePromise;

/**
 * Review Page
 */
const Review = ({
  setProgressItem,
  previousPageUrl,
  nextPageUrl,
  introText,
  banner,
  icon,
  showIcon,
  secondaryBanner,
  workItemConfig,
  breadcrumb,
  isLoggedIn
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

  let estimate;
  switch (workType?.selectedWorkType) {
    case WorkType.design:
      estimate = getWebsiteDesignPriceAndTimelineEstimate();
      break;
    case WorkType.data:
      estimate = getDataExplorationPriceAndTimelineEstimate();
      break;
    case WorkType.problem:
      estimate = getDataAdvisoryPriceAndTimelineEstimate();
      break;
    case WorkType.findData:
      estimate = getFindMeDataPriceAndTimelineEstimate();
      break;
    default:
      estimate = getFindMeDataPriceAndTimelineEstimate();
      break;
  }

  const [firstMounted, setFirstMounted] = useState(true);
  useEffect(() => {
    if (!firstMounted) {
      return;
    }

    setProgressItem(7);

    if (currentStep === 0) {
      navigate(selfServiceStartRoute);
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
      navigate(selfServiceRootRoute);
    }

    setAnotherFirstMounted(false);
  }, [currentStep, anotherFirstMounted, navigate]);

  const onBack = () => {
    navigate(previousPageUrl || `${selfServiceRootRoute}/branding`);
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

    const description = `Work Item #${challengeId}\n${_.get(
      fullState,
      "form.basicInfo.projectTitle.value",
      ""
    ).slice(0, 355)}\n${_.get(fullState, "form.workType.selectedWorkType")}`;

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
        navigate(nextPageUrl || `${selfServiceRootRoute}/thank-you`);
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

  const onClickBreadcrumbItem = (item) => {
    if (item.name === "Start work") {
      dispatch(resetIntakeForm(true));
      dispatch(triggerCookieClear());
    }
  };

  return (
    <>
      <OrderContractModal
        isOpen={isOrderContractModalOpen}
        onClose={() => setIsOrderContractModalOpen(false)}
      />
      <LoadingSpinner hide={!isLoading} overlay />
      <Breadcrumb
        items={breadcrumb.map((item) => ({
          ...item,
          onClick: onClickBreadcrumbItem,
        }))}
      />
      {banner}
      <PageContent styleName={"container"}>
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
        <div className={styles["splitView"]}>
          <div className={styles["reviewContainer"]}>
            <ReviewTable
              workItemConfig={workItemConfig}
              formData={intakeFormData}
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
                  size="lg"
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
      <Review {...props} />
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
