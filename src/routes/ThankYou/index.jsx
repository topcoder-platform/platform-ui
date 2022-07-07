import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useDispatch, connect } from "react-redux";

import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import Page from "../../components/Page";
import PageContent from "../../components/PageContent";
import PageH2 from "../../components/PageElements/PageH2";
import { BUTTON_SIZE, MAX_COMPLETED_STEP } from "../../constants/";
import { setCookie } from "../../autoSaveBeforeLogin";
import { resetIntakeForm } from "../../actions/form";

import styles from "./styles.module.scss";

/**
 * Thank You Page
 */
const ThankYou = () => {

  const dispatch = useDispatch();
  const [isLoading] = useState(false);
  const navigate = useNavigate()

  useEffect(() => {
    clearPreviousForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearPreviousForm = () => {
    dispatch(resetIntakeForm(true));
    setCookie(MAX_COMPLETED_STEP, "", -1);
  };

  const onDone = async () => {
    navigate("/self-service");
  };

  return (
    <>
      <LoadingSpinner show={isLoading} />
      <Page>
        <PageContent>
          <div className={styles["container"]}>
            <div className={styles["content"]}>
              <PageH2>THANK YOU</PageH2>

              <div className={styles["content-container"]}>
                <p>Your payment has been processed successfully.</p>

                <p>
                  You can now go to the Dashboard to manage the work you've
                  submitted.
                </p>

                <p>
                  If your changes do not appear immediately, please reload the
                  page.
                </p>
              </div>

              <div className={styles["btn"]}>
                <Button size={BUTTON_SIZE.MEDIUM} onClick={onDone}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </PageContent>
      </Page>
    </>
  );
};

const mapStateToProps = ({ form }) => form;

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(ThankYou);
