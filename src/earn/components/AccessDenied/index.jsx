/* global window */

import React from "react";
import PT from "prop-types";
import _ from "lodash";
import { PrimaryButton } from "../Buttons";
import { ReactComponent as TopcoderLogo } from "../../assets/icons/logo_topcoder.svg";
import { ACCESS_DENIED_REASON } from "../../constants";
import config from '@earn/config';

import "./style.scss";

const AccessDenied = ({ cause, redirectLink, children }) => {
  switch (cause) {
    case ACCESS_DENIED_REASON.NOT_AUTHENTICATED: {
      return (
        <div styleName="access-denied">
          <TopcoderLogo />
          <div styleName="msg">
            You must be authenticated to access this page.
          </div>
          <div styleName="msg">
            <a
              className="tc-btn-md tc-btn-primary"
              href={`${config.URL.AUTH}/member`}
              onClick={(event) => {
                const retUrl = encodeURIComponent(window.location.href);
                window.location = `${config.URL.AUTH}/member?retUrl=${retUrl}`;
                event.preventDefault();
              }}
            >
              Log In Here
            </a>
          </div>
        </div>
      );
    }
    case ACCESS_DENIED_REASON.NOT_AUTHORIZED:
      return (
        <div styleName="access-denied">
          <TopcoderLogo />
          <div styleName="msg">You are not authorized to access this page.</div>
          {children}
        </div>
      );
    case ACCESS_DENIED_REASON.HAVE_NOT_SUBMITTED_TO_THE_CHALLENGE:
      return (
        <div styleName="access-denied">
          <TopcoderLogo />
          <div styleName="msg">You have not submitted to this challenge</div>
          <PrimaryButton to={redirectLink}>Back to the challenge</PrimaryButton>
        </div>
      );
    default:
      return <div />;
  }
};

AccessDenied.defaultProps = {
  cause: ACCESS_DENIED_REASON.NOT_AUTHENTICATED,
  redirectLink: "",
  children: null,
};

AccessDenied.propTypes = {
  cause: PT.oneOf(_.toArray(ACCESS_DENIED_REASON)),
  redirectLink: PT.string,
  children: PT.node,
};

export default AccessDenied;
