import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";

import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import Page from "../../components/Page";
import PageContent from "../../components/PageContent";
import PageH2 from "../../components/PageElements/PageH2";
import { BUTTON_SIZE, BUTTON_TYPE, ROUTES } from "../../constants/";
import { setProgressItem } from "../../actions/progress";
import config from "../../../config";
import PageFoot from "../../components/PageElements/PageFoot";
import PageDivider from "../../components/PageDivider";
import { ReactComponent as BackIcon } from "../../assets/images/icon-back-arrow.svg";

import styles from "./styles.module.scss";

/**
 * Log in Page
 */
const LoginPrompt = ({
  isLoggedIn,
  setProgressItem,
  previousPageUrl,
  nextPageUrl,
}) => {
  const [isLoading] = useState(false);
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoggedIn) {
      navigate(nextPageUrl || ROUTES.DASHBOARD_PAGE);
      setProgressItem(5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const onLogin = () => {
    window.location.href = config.SIGN_IN_URL
  };

  const onSignUp = () => {
    window.location.href = config.SIGN_UP_URL
  };

  const onBack = () => {
    navigate(
      previousPageUrl || "/self-service/work/new/website-design-legacy/page-details"
    );
  };

  return (
    <>
      <LoadingSpinner show={isLoading} />
      <Page>
        <PageContent>
          <div className={styles["container"]}>
            <div className={styles["content"]}>
              <PageH2 className={styles["loginTitle"]}>
                Log in or create an account
              </PageH2>
              <p>
                You are about to share secured information. To ensure your
                security, please log in or create an account.
              </p>

              <div className={styles["btn"]}>
                <Button size={BUTTON_SIZE.MEDIUM} onClick={onLogin}>
                  LOG IN
                </Button>
                <span className={styles["separator"]}>OR</span>
                <Button size={BUTTON_SIZE.MEDIUM} onClick={onSignUp}>
                  SIGN UP
                </Button>
              </div>
            </div>
          </div>

          <PageDivider />
          <PageFoot align="between">
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
            </div>
          </PageFoot>
        </PageContent>
      </Page>
    </>
  );
};

const mapStateToProps = ({ form }) => form;

const mapDispatchToProps = {
  setProgressItem,
};

export default connect(mapStateToProps, mapDispatchToProps)(LoginPrompt);
