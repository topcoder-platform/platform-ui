import PT from "prop-types";
import _ from "lodash";

import { EnvironmentConfig } from "~/config";
import { LinkButton } from "~/libs/ui";
import { ReactComponent as TopcoderLogo } from "@earn/assets/icons/logo_topcoder.svg";

import { ACCESS_DENIED_REASON } from "../../constants";
import { styled as styledCss } from "../../utils";

import styles from "./styles.module.scss";
const styled = styledCss(styles)

const AccessDenied = ({ cause, redirectLink, children }) => {
  switch (cause) {
    case ACCESS_DENIED_REASON.NOT_AUTHENTICATED: {
      return (
        <div className={styled("access-denied")}>
          <TopcoderLogo />
          <div className={styled("msg")}>
            You must be authenticated to access this page.
          </div>
          <div className={styled("msg")}>
            <a
              className="tc-btn-md tc-btn-primary"
              href={`${EnvironmentConfig.AUTH.ACCOUNTS_APP_CONNECTOR}/member`}
              onClick={(event) => {
                const retUrl = encodeURIComponent(window.location.href);
                window.location = `${EnvironmentConfig.AUTH.ACCOUNTS_APP_CONNECTOR}/member?retUrl=${retUrl}`;
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
        <div className={styled("access-denied")}>
          <TopcoderLogo />
          <div className={styled("msg")}>You are not authorized to access this page.</div>
          {children}
        </div>
      );
    case ACCESS_DENIED_REASON.HAVE_NOT_SUBMITTED_TO_THE_CHALLENGE:
      return (
        <div className={styled("access-denied")}>
          <TopcoderLogo />
          <div className={styled("msg")}>You have not submitted to this challenge</div>
          <LinkButton primary size='md' to={redirectLink}>Back to the challenge</LinkButton>
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
