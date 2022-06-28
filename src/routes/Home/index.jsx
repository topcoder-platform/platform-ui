import { useNavigate } from "react-router-dom";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { connect, useDispatch } from "react-redux";

import { profileContext } from '../../../src-ts'

import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import { BUTTON_SIZE, BUTTON_TYPE, ROUTES } from "../../constants/";
import WelcomeImage from "../../assets/images/welcome.png";
import {
  clearAutoSavedForm,
  clearCachedChallengeId,
} from "../../autoSaveBeforeLogin";
import { resetIntakeForm } from "../../actions/form";

import styles from "./styles.module.scss";

/**
 * Home Page
 */
const Home = () => {

  const [isLoading, setLoading] = useState(true);
  const { initialized, isLoggedIn } = useContext(profileContext)
  const navigate = useNavigate()

  const dispatch = useDispatch();

  useEffect(() => {
    if (isLoggedIn) {
      navigate(ROUTES.DASHBOARD_PAGE);
    } else {
      if (!initialized) {
        setLoading(false);
      }
    }
  }, [isLoggedIn, initialized]);

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
        <div className={styles["container"]}>
          <div className={styles["leftContent"]}>
            <img className={styles["welcomeImage"]} src={WelcomeImage} alt="welcome" />
          </div>

          <div className={styles["rightContent"]}>
            <h2 className={styles["title"]}>put our great talent to work for you</h2>
            <p className={styles["description"]}>
              Amazing talent. Passionate people.
              <br />
              Start something great today.
            </p>

            <Button
              className={styles["createWorkButton"]}
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
