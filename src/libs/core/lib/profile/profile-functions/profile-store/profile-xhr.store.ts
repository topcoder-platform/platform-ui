import { xhrGetAsync, xhrPutAsync } from '../../../xhr'
import { EditNameRequest } from '../../edit-name-request.model'
import { UserProfile } from '../../user-profile.model'
import { UserVerify } from '../../user-verify.model'

import { profile as profileUrl, verify as verifyUrl } from './profile-endpoint.config'

export function get(handle: string): Promise<UserProfile> {
    return xhrGetAsync<UserProfile>(profileUrl(handle))
}

// NOTE: this method is named patch bc the request body is just a partial profile,
// but the underlying xhr request is actually a put b/c the api doesn't support patch
export function patchName(handle: string, request: EditNameRequest): Promise<UserProfile> {
    return xhrPutAsync<EditNameRequest, UserProfile>(profileUrl(handle), request)
}

// reads from looker where member verified status is stored
export function getVerification(): Promise<UserVerify[]> {
    return xhrGetAsync<UserVerify[]>(verifyUrl())
}
