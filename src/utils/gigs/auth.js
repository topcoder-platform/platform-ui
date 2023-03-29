import _ from "lodash";
import { profileGetLoggedInAsync } from '../../../src-ts/lib/profile-provider/profile-functions/'
import { tokenGetAsync } from "../../../src-ts/lib/functions/token-functions/"

//TODO: Fix all these for uninav
export async function getUserId() {
  const profile = await profileGetLoggedInAsync()
  
  return profile ? profile.handle : null;
}

export async function isLoggedIn() {
  const token = await tokenGetAsync()
  return token != null;
}

export function logIn() {
  //login();
}
