import { navigate, redirectTo } from "@reach/router";
import Button from "components/Button";
import LoadingSpinner from "components/LoadingSpinner";
import config from "../../../config";
import { Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Page from "components/Page";
import PageContent from "components/PageContent";
import PageDivider from "components/PageDivider";
import PageFoot from "components/PageElements/PageFoot";
import { resetIntakeForm } from "../../actions/form";
import { toastr } from "react-redux-toastr";
import Progress from "components/Progress";
import { BUTTON_SIZE, BUTTON_TYPE, MAX_COMPLETED_STEP } from "constants/";
import React, { useEffect, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import PaymentForm from "./components/PaymentForm";
import { triggerAutoSave, triggerCookieClear } from "../../actions/autoSave";
import { setProgressItem } from "../../actions/progress";
import BackIcon from "../../assets/images/icon-back-arrow.svg";
import ReviewTable from "./components/ReviewTable";
import withAuthentication from "../../hoc/withAuthentication";
import ServicePrice from "components/ServicePrice";
import * as services from "../../services/payment";
import { getUserProfile } from "../../thunks/profile";
import { activateChallenge } from "../../services/challenge";
import "./styles.module.scss";
import {
  getWebsiteDesignPriceAndTimelineEstimate,
  getDataExplorationPriceAndTimelineEstimate,
  getFindMeDataPriceAndTimelineEstimate,
  getDataAdvisoryPriceAndTimelineEstimate,
  currencyFormat,
} from "utils/";
import _ from "lodash";
import {
  loadChallengeId,
  setCookie,
  clearCachedChallengeId,
} from "../../autoSaveBeforeLogin";
import { Breadcrumb, OrderContractModal, WorkType } from "../../../src-ts";
import AboutYourProject from "./components/AboutYourProject";

const stripePromise = loadStripe(config.STRIPE.API_KEY, {
  apiVersion: config.STRIPE.API_VERSION,
});

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
      redirectTo("/self-service");
    }

    setFirstMounted(false);

    return () => {
      dispatch(triggerAutoSave(true));
    };
  }, [currentStep, formData, dispatch, setProgressItem, firstMounted]);

  const [anotherFirstMounted, setAnotherFirstMounted] = useState(true);
  useEffect(() => {
    if (!anotherFirstMounted) {
      return;
    }

    if (currentStep === 0) {
      redirectTo("/self-service");
    }

    setAnotherFirstMounted(false);
  }, [currentStep, anotherFirstMounted]);

  const onBack = () => {
    navigate(previousPageUrl || "/self-service/branding");
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
        navigate(nextPageUrl || "/self-service/thank-you");
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

  useEffect(() => {
    dispatch(getUserProfile());
  }, [dispatch]);

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
      <LoadingSpinner show={isLoading} />
      <Page>
        <Breadcrumb
          items={breadcrumb.map((item) => ({
            ...item,
            onClick: onClickBreadcrumbItem,
          }))}
        />
        {banner}
        <PageContent styleName="container">
          <ServicePrice
            hideTitle
            showIcon={showIcon}
            icon={icon}
            price={estimate.total}
            duration={estimate.totalDuration}
            stickerPrice={estimate?.stickerPrice}
            serviceType={workType?.selectedWorkTypeDetail}
          />
          <br styleName="mobileHidden" />
          <br styleName="mobileHidden" />
          {secondaryBanner}
          {introText && <div styleName="infoAlert">{introText}</div>}
          <div styleName="splitView">
            <div styleName="reviewContainer">
              <ReviewTable
                workItemConfig={workItemConfig}
                formData={intakeFormData}
              />
              <div styleName="hideMobile">
                <AboutYourProject />
              </div>
            </div>
            <div styleName="paymentWrapper">
              <div styleName="paymentBox">
                <div styleName="total">
                  {estimate.stickerPrice && (
                    <span styleName="originalPrice">
                      {currencyFormat(estimate.stickerPrice)}
                    </span>
                  )}
                  {currencyFormat(estimate.total)}
                </div>

                <div styleName="totalInfo">Total Payment</div>

                <PageDivider styleName="pageDivider" />

                <PaymentForm
                  formData={formData}
                  setFormData={setFormData}
                  onOpenContractModal={setIsOrderContractModalOpen}
                />
                {paymentFailed && (
                  <div styleName="error">
                    Your card was declined. Please try a different card.
                  </div>
                )}

                <div styleName="paymentButtonContainer">
                  <Button
                    disabled={!isFormValid || isLoading}
                    size={BUTTON_SIZE.MEDIUM}
                    onClick={onNext}
                    styleName="wideButton"
                  >
                    PAY ${estimate.total}
                  </Button>
                </div>
              </div>
            </div>
            <div styleName="showOnlyMobile">
              <AboutYourProject />
            </div>
          </div>
          <PageDivider />

          <PageFoot>
            <div styleName="footerContent">
              <div>
                <Button
                  size={BUTTON_SIZE.MEDIUM}
                  type={BUTTON_TYPE.SECONDARY}
                  onClick={onBack}
                >
                  <div styleName="backButtonWrapper">
                    <BackIcon />
                  </div>
                </Button>
              </div>
            </div>
          </PageFoot>
        </PageContent>
      </Page>
    </>
  );
};

const ReviewWrapper = (props) => {
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
)(withAuthentication(ReviewWrapper));
