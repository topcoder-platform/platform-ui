import { navigate } from "@reach/router";
import Button from "components/Button";
import LoadingSpinner from "components/LoadingSpinner";
import { BUTTON_SIZE, BUTTON_TYPE, ROUTES } from "constants/";
import {
  getIsLoggedIn,
  getIsLoggingIn,
} from "hoc/withAuthentication/selectors";
import { checkIfLoggedIn } from "hoc/withAuthentication/thunks";
import React, { useCallback, useEffect, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import WelcomeImage from "../../assets/images/welcome.png";
import "./styles.module.scss";
import {
  clearAutoSavedForm,
  clearCachedChallengeId,
  setCookie,
} from "../../../src/autoSaveBeforeLogin";
import { resetIntakeForm } from "../../../src/actions/form";

/**
 * Home Page
 */
const Home = () => {
  const [isLoading, setLoading] = useState(true);
  const isLoggedIn = useSelector(getIsLoggedIn);
  const isLoggingIn = useSelector(getIsLoggingIn);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkIfLoggedIn());
  }, [dispatch]);

  useEffect(() => {
    if (isLoggedIn) {
      navigate(ROUTES.DASHBOARD_PAGE);
    } else {
      if (!isLoggingIn) {
        setLoading(false);
      }
    }
  }, [isLoggedIn, isLoggingIn]);

  const handleClick = useCallback(() => {
    clearCachedChallengeId();
    clearAutoSavedForm();
    dispatch(resetIntakeForm(true));
    navigate(ROUTES.INTAKE_FORM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <LoadingSpinner show={isLoading} />
      {!isLoading && (
        <div styleName="container">
          <div styleName="leftContent">
            <img styleName="welcomeImage" src={WelcomeImage} alt="welcome" />
          </div>

          <div styleName="rightContent">
            <h2 styleName="title">put our great talent to work for you</h2>
            <p styleName="description">
              Amazing talent. Passionate people.
              <br />
              Start something great today.
            </p>

            <Button
              styleName="createWorkButton"
              type={BUTTON_TYPE.SECONDARY}
              size={BUTTON_SIZE.MEDIUM}
              onClick={handleClick}
            >
              CREATE WORK
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

const mapStateToProps = ({ form }) => form;
const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Home);
