import styles from "./styles.scss";
import React, { useCallback } from "react";
import GigsButton from "../../../../components/GigsButton";
import { makeLoginUrl, makeRegisterUrl } from "../../../../utils/gigs/url";

const LoginRequest = () => {
  const onClickBtnLogin = useCallback(() => {
    window.location.href = makeLoginUrl(window.location.href);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.title}>You must be a Topcoder member to apply!</div>
      <div className={styles.controls}>
        <GigsButton isPrimary size="lg" onClick={onClickBtnLogin}>
          LOGIN
        </GigsButton>
      </div>
      <div className={styles.hint}>
        Not a member? Register <a href={makeRegisterUrl(window.location.href)}>here</a>
        .
      </div>
    </div>
  );
};

export default LoginRequest;
