import "./styles.scss";
import React, { useCallback } from "react";
import Button from "components/Button";
import { makeLoginUrl, makeRegisterUrl } from "utils/url";

const LoginRequest = () => {
  const onClickBtnLogin = useCallback(() => {
    location.href = makeLoginUrl(location.href);
  }, []);

  return (
    <div styleName="container">
      <div styleName="title">You must be a Topcoder member to apply!</div>
      <div styleName="controls">
        <Button isPrimary size="large" onClick={onClickBtnLogin}>
          LOGIN
        </Button>
      </div>
      <div styleName="hint">
        Not a member? Register <a href={makeRegisterUrl(location.href)}>here</a>
        .
      </div>
    </div>
  );
};

export default LoginRequest;
