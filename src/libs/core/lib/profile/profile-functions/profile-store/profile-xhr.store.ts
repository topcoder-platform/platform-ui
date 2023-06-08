import { xhrGetAsync, xhrPatchAsync, xhrPostAsync, xhrPutAsync } from '../../../xhr'
import { CountryLookup } from '../../country-lookup.model'
import { EditNameRequest } from '../../edit-name-request.model'
import { ModifyMemberEmailPreferencesRequest } from '../../modify-user-email-preferences.model'
import { ModifyUserMFARequest, ModifyUserMFAResponse } from '../../modify-user-mfa.model'
import { ModifyUserPropertyRequest, ModifyUserPropertyResponse } from '../../modify-user-role.model'
import { UserEmailPreferences } from '../../user-email-preference.model'
import { UserProfile } from '../../user-profile.model'
import { UserStats } from '../../user-stats.model'
import { UserTraits } from '../../user-traits.model'
import { UserVerify } from '../../user-verify.model'

import {
    countryLookupURL,
    memberEmailPreferencesURL,
    memberModifyMfaURL,
    memberModifyURL,
    profile as profileUrl,
    verify as verifyUrl,
} from './profile-endpoint.config'

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

export function getMemberStats(handle: string): Promise<UserStats | undefined> {
    return xhrGetAsync<UserStats[]>(`${profileUrl(handle)}/stats`)
        .then(stats => (!stats.length ? undefined : stats[0]))
}

export function getCountryLookup(): Promise<CountryLookup[]> {
    return xhrGetAsync<CountryLookup[]>(countryLookupURL())
        .then((countryLookup: any) => countryLookup.result?.content || [])
}

export async function updatePrimaryMemberRole(primaryRole: string): Promise<ModifyUserPropertyResponse> {
    return xhrPostAsync<ModifyUserPropertyRequest, ModifyUserPropertyResponse>(
        `${memberModifyURL()}/updatePrimaryRole`,
        { param: { primaryRole } },
    )
}

export async function updateMemberEmailPreferences(
    email: string,
    request: ModifyMemberEmailPreferencesRequest,
): Promise<UserEmailPreferences> {
    return xhrPutAsync<ModifyMemberEmailPreferencesRequest, UserEmailPreferences>(
        `${memberEmailPreferencesURL()}/${email}`,
        request,
    )
}

export async function updateMemberMFA(userId: number, payload: ModifyUserMFARequest): Promise<ModifyUserMFAResponse> {
    return xhrPatchAsync<ModifyUserMFARequest, ModifyUserMFAResponse>(
        memberModifyMfaURL(userId),
        payload,
    )
}

export async function updateMemberPassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
): Promise<ModifyUserPropertyResponse> {
    return xhrPatchAsync(
        `${memberModifyURL()}/${userId}`,
        { param: { credential: { currentPassword, password: newPassword } } },
    )
}

export async function updateMemberTraits(
    handle: string,
    traits: UserTraits[],
): Promise<UserTraits[]> {
    return xhrPutAsync<UserTraits[], UserTraits[]>(`${profileUrl(handle)}/traits`, traits)
}

export async function createMemberTraits(
    handle: string,
    traits: UserTraits[],
): Promise<UserTraits[]> {
    return xhrPostAsync<UserTraits[], UserTraits[]>(`${profileUrl(handle)}/traits`, traits)
}
