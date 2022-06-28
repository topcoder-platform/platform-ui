import { navigate } from "@reach/router";
import Button from "components/Button";
import LoadingSpinner from "components/LoadingSpinner";
import Page from "components/Page";
import PageContent from "components/PageContent";
import PageH2 from "components/PageElements/PageH2";
import { BUTTON_SIZE, BUTTON_TYPE } from "constants/";
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { setProgressItem } from "actions/progress";
import config from "../../../config";
import "./styles.module.scss";
import PageFoot from "components/PageElements/PageFoot";
import PageDivider from "components/PageDivider";
import BackIcon from "../../assets/images/icon-back-arrow.svg";
import { ROUTES } from "../../constants";

/**
 * Log in Page
 */
const LoginPrompt = ({
  isLoggedIn,
  setProgressItem,
  previousPageUrl,
  nextPageUrl,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      navigate(nextPageUrl || ROUTES.DASHBOARD_PAGE);
      setProgressItem(5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const onLogin = () => {
    navigate(config.SIGN_IN_URL);
  };

  const onSingUp = () => {
    navigate(config.SIGN_UP_URL);
  };

  const onBack = () => {
    navigate(
      previousPageUrl || "/self-service/work/new/website-design/page-details"
    );
  };

  return (
    <>
      <LoadingSpinner show={isLoading} />
      <Page>
        <PageContent>
          <div styleName="container">
            <div styleName="content">
              <PageH2 styleName="loginTitle">
                Log in or create an account
              </PageH2>
              <p>
                You are about to share secured information. To ensure your
                security, please log in or create an account.
              </p>

              <div styleName="btn">
                <Button size={BUTTON_SIZE.MEDIUM} onClick={onLogin}>
                  LOG IN
                </Button>
                <span styleName="separator">OR</span>
                <Button size={BUTTON_SIZE.MEDIUM} onClick={onSingUp}>
                  SIGN UP
                </Button>
              </div>
            </div>
          </div>

          <PageDivider />
          <PageFoot align="between">
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

const mapStateToProps = ({ form }) => form;

const mapDispatchToProps = {
  setProgressItem,
};

export default connect(mapStateToProps, mapDispatchToProps)(LoginPrompt);
