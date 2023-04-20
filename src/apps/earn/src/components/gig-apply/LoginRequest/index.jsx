import styles from "./styles.scss";

import { LinkButton } from "~/libs/ui";

import { makeLoginUrl, makeRegisterUrl } from "../../../utils/url";

const LoginRequest = () => {

  return (
    <div className={styles.container}>
      <div className={styles.title}>You must be a Topcoder member to apply!</div>
      <div className={styles.controls}>
        <LinkButton primary size="lg" to={makeLoginUrl(window.location.href)}>
          LOGIN
        </LinkButton>
      </div>
      <div className={styles.hint}>
        Not a member? Register <a href={makeRegisterUrl(window.location.href)}>here</a>
        .
      </div>
    </div>
  );
};

export default LoginRequest;
