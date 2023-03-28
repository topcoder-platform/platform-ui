import _ from "lodash";
import cookies from "browser-cookies";

import { tokenGetAsync } from "../../../src-ts/lib/functions/token-functions";
import store from "../../store";

/**
 * Get authenticated user tokens.
 */
export const getAuthUserTokens = async () => {
  const { token: tokenV3 } = await tokenGetAsync();
  const tokenV2 = cookies.get("tcjwt");

  return { tokenV3, tokenV2 };
};

/**
 * Get authenticated user profile.
 */
export const getAuthUserProfile = () => {
  const { auth } = store.getState();

  if (auth.isProfileLoaded) {
    return Promise.resolve(auth.profile);
  } else {
    return new Promise((resolve, reject) => {
      store.subscribe(() => {
        const { auth } = store.getState();

        if (auth.isProfileLoaded) {
          if (auth.profile !== null) {
            resolve(auth.profile);
          } else {
            reject("Failed to load user profile.");
          }
        }
      });
    });
  }
};

export async function getUserId() {
  const profile = await getAuthUserProfile();
  return profile.userId;
}

export async function isLoggedIn() {
  const { tokenV3, tokenV2 } = await getAuthUserTokens();
  return tokenV3 != null || tokenV2 != null;
}

export function logIn() {
  console.log('TODO: implement login');
}
