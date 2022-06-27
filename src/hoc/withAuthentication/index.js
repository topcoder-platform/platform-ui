/**
 * Authentication
 *
 * wrap component for authentication
 *
 * - checks if user is logged-in, and if not, then redirects to the login page
 *
 * Also, this component load important data for `hasPermission` method:
 * - decodes user token and set in Redux Store `authUser.userId, handle, roles`
 *   - we need to know user `roles` to check if user user has Topcoder Roles
 */
import { useParams } from "@reach/router";
import { getAuthUserTokens, login } from "@topcoder/mfe-header";
import _ from "lodash";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { decodeToken } from "tc-auth-lib";
import LoadingIndicator from "../../components/LoadingIndicator";
import { authUserError, authUserSuccess } from "./actions";

export default function withAuthentication(Component) {
  const AuthenticatedComponent = (props) => {
    const dispatch = useDispatch();
    const { isLoggedIn, authError } = useSelector((state) => state.authUser);
    const params = useParams();

    /*
      Check if user is logged-in or redirect ot the login page
    */
    useEffect(() => {
      // prevent page redirecting to login page when unmount
      let isUnmount = false;

      if (!isLoggedIn) {
        getAuthUserTokens()
          .then(({ tokenV3 }) => {
            if (!!tokenV3) {
              const tokenData = decodeToken(tokenV3);
              dispatch(
                authUserSuccess(
                  _.pick(tokenData, ["userId", "handle", "roles"])
                )
              );
            } else if (!isUnmount) {
              login();
            }
          })
          .catch((error) => dispatch(authUserError(error)));
      }

      return () => {
        isUnmount = true;
      };
    }, [dispatch, isLoggedIn]);

    return (
      <>
        {/* Show loading indicator until we know if user is logged-in or no.
            In we got error during this process, show error */}
        {isLoggedIn === null && <LoadingIndicator error={authError} />}

        {/* Show component only if user is logged-in */}
        {isLoggedIn === true ? <Component {...props} /> : null}
      </>
    );
  };

  return AuthenticatedComponent;
}
