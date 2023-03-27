import _ from "lodash";
import { profileGetLoggedInAsync } from '../../../src-ts/lib/profile-provider/profile-functions/'

//TODO: Fix all these for uninav
export async function getUserId() {
  const profile = await profileGetLoggedInAsync()
  
  return profile ? profile.handle : null;
}

export async function isLoggedIn() {
  const profile = await profileGetLoggedInAsync()
  return profile!=null;
}

export function logIn() {
  //login();
}
