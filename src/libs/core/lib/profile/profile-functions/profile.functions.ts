import { tokenGetAsync, TokenModel, userGetDiceStatusAsync } from '../../auth'
import { CountryLookup } from '../country-lookup.model'
import { EditNameRequest } from '../edit-name-request.model'
import { ModifyMemberEmailPreferencesRequest } from '../modify-user-email-preferences.model'
import { ModifyUserMFARequest, ModifyUserMFAResponse } from '../modify-user-mfa.model'
import { ModifyUserPropertyResponse } from '../modify-user-role.model'
import { UserEmailPreferences } from '../user-email-preference.model'
import { UserProfile } from '../user-profile.model'
import { UserStats } from '../user-stats.model'
import { UserTraits } from '../user-traits.model'
import { UserVerify } from '../user-verify.model'

import { profileFactoryCreate } from './profile-factory'
import { getMemberStats, getVerification, profileStoreGet, profileStorePatchName } from './profile-store'
import {
    getCountryLookup,
    updateMemberEmailPreferences,
    updateMemberMFA,
    updateMemberPassword,
    updateMemberTraits,
    updatePrimaryMemberRole,
} from './profile-store/profile-xhr.store'

export async function getLoggedInAsync(handle?: string): Promise<UserProfile | undefined> {

    // get the token
    const token: TokenModel = await tokenGetAsync()

    // get the handle
    const safeHandle: string | undefined = handle || token.handle
    if (!safeHandle || !token.userId) {
        return Promise.resolve(undefined)
    }

    // get the profile
    const profilePromise: Promise<UserProfile> = profileStoreGet(safeHandle)
    const dicePromise: Promise<boolean> = userGetDiceStatusAsync(token.userId)

    const [profileResult, diceEnabled]: [UserProfile, boolean] = await Promise.all([profilePromise, dicePromise])

    // make the changes we need based on the token
    const output: UserProfile = profileFactoryCreate(profileResult, token, diceEnabled)
    return output
}

export async function getPublicAsync(handle: string): Promise<UserProfile | undefined> {

    // get the profile
    const profileResult: UserProfile = await profileStoreGet(handle)

    const output: UserProfile = profileFactoryCreate(profileResult)
    return output
}

export async function editNameAsync(handle: string, profile: EditNameRequest): Promise<UserProfile> {
    return profileStorePatchName(handle, profile)
}

export async function getVerificationStatusAsync(handle: string): Promise<boolean> {

    // get verification statuses
    // in DEV this looker API is mocked data response
    const verfiedMembers: UserVerify[] = await getVerification()

    // filter by member
    return verfiedMembers.some(member => {
        let isVerified: boolean = false
        if (member['user.handle'] && member['user.handle'].toLowerCase() === handle.toLowerCase()) {
            isVerified = true
        }

        // On DEV we have a mocked data response with silghtly different structure
        if (
            member['member_verification_dev.handle']
            && member['member_verification_dev.handle'].toLowerCase() === handle.toLowerCase()
        ) {
            isVerified = true
        }

        return isVerified
    })
}

export async function getMemberStatsAsync(handle: string): Promise<UserStats | undefined> {
    return getMemberStats(handle)
}

export async function getCountryLookupAsync(): Promise<CountryLookup[]> {
    return getCountryLookup()
}

export async function updatePrimaryMemberRoleAsync(primaryRole: string): Promise<ModifyUserPropertyResponse> {
    return updatePrimaryMemberRole(primaryRole)
}

export async function updateMemberEmailPreferencesAsync(
    email: string,
    emailPreferences: ModifyMemberEmailPreferencesRequest,
): Promise<UserEmailPreferences> {
    return updateMemberEmailPreferences(email, emailPreferences)
}

export async function updateMemberMFAStatusAsync(
    userId: number,
    payload: ModifyUserMFARequest,
): Promise<ModifyUserMFAResponse> {
    return updateMemberMFA(userId, payload)
}

export async function updateMemberPasswordAsync(
    userId: number,
    currentPassword: string,
    newPassword: string,
): Promise<ModifyUserPropertyResponse> {
    return updateMemberPassword(userId, currentPassword, newPassword)
}

export async function updateMemberTraitsAsync(
    handle: string,
    traits: UserTraits[],
): Promise<UserTraits[]> {
    return updateMemberTraits(handle, traits)
}
