import type { UpdateProfileRequest, UserProfile } from '~/libs/core'
import { profileGetLoggedInAsync, tokenGetAsync, updateMemberProfileAsync } from '~/libs/core'

export interface ApplicationUserData {
    name: string
    email: string
    address?: string
    mobileNumber?: string
}

const formatAddress = (profile?: UserProfile): string | undefined => {
    const address = profile?.addresses?.[0]
    if (!address) {
        return undefined
    }

    const parts = [
        address.streetAddr1,
        address.streetAddr2,
        address.city,
        address.stateCode,
        address.zip,
    ]
        .filter(Boolean)

    return parts.length ? parts.join(', ') : undefined
}

const normalizeValue = (value?: string): string | undefined => {
    const trimmed = value?.trim()
    if (!trimmed) {
        return undefined
    }

    return trimmed
}

const normalizeEmail = (value?: string): string | undefined => {
    const trimmed = normalizeValue(value)
    if (!trimmed) {
        return undefined
    }

    return trimmed.toLowerCase()
}

const formatPhoneNumber = (profile?: UserProfile): string | undefined => {
    const phones = profile?.phones ?? []
    if (!phones.length) {
        return undefined
    }

    const normalizedPhones = phones
        .map(phone => ({
            number: normalizeValue(phone.number),
            type: phone.type?.trim(),
        }))
        .filter(phone => phone.number)

    if (!normalizedPhones.length) {
        return undefined
    }

    const mobilePhone = normalizedPhones.find(phone => (
        phone.type?.toLowerCase()
            .includes('mobile')
    ))

    return (mobilePhone ?? normalizedPhones[0]).number
}

const buildNameUpdate = (name: string): Pick<UpdateProfileRequest, 'firstName' | 'lastName'> => {
    const parts = name
        .split(/\s+/)
        .filter(Boolean)
    if (!parts.length) {
        return {}
    }

    if (parts.length === 1) {
        return { firstName: parts[0] }
    }

    const lastName = parts
        .slice(1)
        .join(' ')

    return {
        firstName: parts[0],
        lastName,
    }
}

const parseAddress = (address: string): NonNullable<UpdateProfileRequest['addresses']>[number] => {
    const parts = address
        .split(',')
        .map(part => part.trim())
        .filter(Boolean)

    if (!parts.length) {
        return { streetAddr1: address }
    }

    const [streetAddr1, city, statePart, ...rest] = parts
    const payload: NonNullable<UpdateProfileRequest['addresses']>[number] = { streetAddr1 }

    if (city) {
        payload.city = city
    }

    if (statePart) {
        const combinedState = [statePart, ...rest]
            .join(' ')
            .trim()
        const stateZipMatch = combinedState.match(/^([A-Za-z]{2})\s*(\d{5}(?:-\d{4})?)?$/)
        if (stateZipMatch) {
            payload.stateCode = stateZipMatch[1].toUpperCase()
            if (stateZipMatch[2]) {
                payload.zip = stateZipMatch[2]
            }
        } else {
            payload.stateCode = statePart
            if (rest.length) {
                payload.zip = rest.join(' ')
            }
        }
    }

    return payload
}

const buildProfileUpdatePayload = (
    nextData: ApplicationUserData,
    currentData?: ApplicationUserData,
): UpdateProfileRequest | undefined => {
    const nextName = normalizeValue(nextData.name)
    const nextEmail = normalizeValue(nextData.email)
    const nextAddress = normalizeValue(nextData.address)

    const currentName = normalizeValue(currentData?.name)
    const currentEmail = normalizeValue(currentData?.email)
    const currentAddress = normalizeValue(currentData?.address)

    const payload: UpdateProfileRequest = {}

    if (nextName && nextName !== currentName) {
        Object.assign(payload, buildNameUpdate(nextName))
    }

    if (nextEmail && normalizeEmail(nextEmail) !== normalizeEmail(currentEmail)) {
        payload.email = nextEmail
    }

    if (nextAddress && nextAddress !== currentAddress) {
        payload.addresses = [parseAddress(nextAddress)]
    }

    return Object.keys(payload).length ? payload : undefined
}

export const getUserDataForApplication = async (): Promise<ApplicationUserData> => {
    try {
        const token = await tokenGetAsync()
        if (!token?.userId) {
            return { email: '', name: '' }
        }

        const profile = await profileGetLoggedInAsync(token.handle)
        if (!profile) {
            return { email: '', name: '' }
        }

        const nameParts = [profile.firstName, profile.lastName]
            .filter(Boolean)
            .map(part => part.trim())
            .filter(Boolean)

        return {
            address: formatAddress(profile),
            email: profile.email ?? '',
            mobileNumber: formatPhoneNumber(profile),
            name: nameParts.join(' '),
        }
    } catch (error) {
        return { email: '', name: '' }
    }
}

export const updateUserDataForApplication = async (
    nextData: ApplicationUserData,
    currentData?: ApplicationUserData,
): Promise<void> => {
    const token = await tokenGetAsync()
    if (!token?.handle) {
        return
    }

    const payload = buildProfileUpdatePayload(nextData, currentData)
    if (!payload) {
        return
    }

    await updateMemberProfileAsync(token.handle, payload)
}
