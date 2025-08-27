import { tokenGetAsync, TokenModel } from '../../auth'
import { CountryLookup } from '../country-lookup.model'
import { EditNameRequest } from '../edit-name-request.model'
import { ModifyTracksRequest } from '../modify-tracks.request'
import { ModifyMemberEmailPreferencesRequest } from '../modify-user-email-preferences.model'
import { UpdateProfileRequest, UserPhotoUpdateResponse } from '../modify-user-profile.model'
import { ModifyUserPropertyResponse } from '../modify-user-role.model'
import { UserEmailPreferences } from '../user-email-preference.model'
import { UserProfile } from '../user-profile.model'
import { UserStats } from '../user-stats.model'
import { UserTrait, UserTraits } from '../user-traits.model'
import { UserVerify } from '../user-verify.model'

import { profileFactoryCreate } from './profile-factory'
import { getMemberStats, getVerification, profileStoreGet, profileStorePatchName } from './profile-store'
import {
    createMemberTraits,
    deleteMemberTrait,
    getCountryLookup,
    modifyTracks,
    updateMemberEmailPreferences,
    updateMemberPassword,
    updateMemberPhoto,
    updateMemberProfile,
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
    const profileResult: UserProfile = await profileStoreGet(safeHandle)

    // make the changes we need based on the token
    const output: UserProfile = profileFactoryCreate(profileResult, token)
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

export async function createMemberTraitsAsync(
    handle: string,
    traits: UserTraits[],
): Promise<UserTraits[]> {
    return createMemberTraits(handle, traits)
}

export async function deleteMemberTraitAsync(
    handle: string,
    traitIds: string,
): Promise<UserTraits[]> {
    return deleteMemberTrait(handle, traitIds)
}

export async function modifyTracksAsync(handle: string, tracks: ModifyTracksRequest): Promise<UserProfile> {
    return modifyTracks(handle, tracks)
}

export async function updateMemberProfileAsync(handle: string, profile: UpdateProfileRequest): Promise<UserProfile> {
    return updateMemberProfile(handle, profile)
}

export async function updateMemberPhotoAsync(handle: string, payload: FormData): Promise<UserPhotoUpdateResponse> {
    return updateMemberPhoto(handle, payload)
}

export async function updateOrCreateMemberTraitsAsync(
    handle: string,
    traits: UserTraits[],
): Promise<UserTraits[]> {
    try {
        const updatedTraitsRsp = await updateMemberTraitsAsync(handle, traits)
        return updatedTraitsRsp
    } catch (error) {
        const createdTraitsRsp = await createMemberTraitsAsync(handle, traits)
        return createdTraitsRsp
    }
}

export async function updateDeleteOrCreateMemberTraitAsync(
    handle: string,
    trait: UserTraits,
    previousTraitsData: Array<UserTrait> | undefined,
): Promise<UserTraits[]> {
    if (!trait.traits.data.length) {
        if (!previousTraitsData) {
            return [] // no need to delete trait if trait data is null
        }

        try {
            await deleteMemberTraitAsync(handle, trait.traitId)
            return []
        } catch (error) {
        }
    }

    if (!previousTraitsData) {
        try {
            // call request to create trait data if trait data is null
            const createdTraitsRsp = await createMemberTraitsAsync(handle, [trait])
            return createdTraitsRsp
        } catch (error) {
        }
    }

    try {
        // call request to update trait data if trait data is not null
        const updatedTraitsRsp = await updateMemberTraitsAsync(handle, [trait])
        return updatedTraitsRsp
    } catch (error) {
        const createdTraitsRsp = await createMemberTraitsAsync(handle, [trait])
        return createdTraitsRsp
    }
}
