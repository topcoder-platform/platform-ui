import config from "../../config";
import { axiosInstance as axios } from "./requestInterceptor";

/**
 * Updates user basic information
 *
 * @param {String} handle user handle
 * @param {String} firstName first name
 * @param {String} lastName last name
 *
 * @returns {() => Promise}
 */
export async function updateBasicInfo(handle, firstName, lastName) {
  const response = await axios.put(
    `${config.API.V5}/members/${handle}`,
    JSON.stringify({
      firstName,
      lastName,
    })
  );

  return response?.data;
}
/**
 * Update user password
 *
 * @param {String} userId user id
 * @param {String} currentPassword user's current password
 * @param {String} password user's new password
 *
 * @returns {() => Promise}
 */
export async function updatePasswordV3(userId, currentPassword, password) {
  const response = await axios.patch(
    `${config.API.V3}/users/${userId}`,
    JSON.stringify({
      param: {
        credential: {
          currentPassword,
          password,
        },
      },
    })
  );

  return response?.data;
}
