import cookies from "browser-cookies";

import { tokenGetAsync } from "../../../src-ts/lib/functions/token-functions";
import store from '../../store';
import actions from '../actions';

export const initAuth = async () => {
  const { auth } = store.getState().earn;
  const { token: tokenV3 } = await tokenGetAsync();
  const tokenV2 = cookies.get("tcjwt");

  if (!auth.isInitialized) {
    store.dispatch(actions.auth.loadProfile(tokenV3 || null));
    store.dispatch(actions.auth.setTcTokenV3(tokenV3));
    store.dispatch(actions.auth.setTcTokenV2(tokenV2));
    store.dispatch(actions.auth.setAuthDone());
  }

  return { tokenV3, tokenV2 };
}