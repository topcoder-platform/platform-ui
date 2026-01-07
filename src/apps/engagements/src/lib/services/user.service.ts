import { profileGetLoggedInAsync, tokenGetAsync, UserProfile } from '~/libs/core'

interface ApplicationUserData {
    name: string
    email: string
    address?: string
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
    ].filter(Boolean)

    return parts.length ? parts.join(', ') : undefined
}

export const getUserDataForApplication = async (): Promise<ApplicationUserData> => {
    try {
        const token = await tokenGetAsync()
        if (!token?.userId) {
            return { name: '', email: '' }
        }

        const profile = await profileGetLoggedInAsync(token.handle)
        if (!profile) {
            return { name: '', email: '' }
        }

        const nameParts = [profile.firstName, profile.lastName]
            .filter(Boolean)
            .map(part => part.trim())
            .filter(Boolean)

        return {
            name: nameParts.join(' '),
            email: profile.email ?? '',
            address: formatAddress(profile),
        }
    } catch (error) {
        return { name: '', email: '' }
    }
}
