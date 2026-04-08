import { User } from '../models'

export interface UserProfileLike extends Partial<User> {
    handle?: string
}

export function getInitials(firstName: string = '', lastName: string = ''): string {
    return `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`
}

export function getFullNameWithFallback(user?: UserProfileLike | null): string {
    if (!user) {
        return ''
    }

    let fullName = user.firstName || ''

    if (fullName && user.lastName) {
        fullName = `${fullName} ${user.lastName}`
    }

    const normalizedFullName = fullName
        .trim()

    if (normalizedFullName.length > 0) {
        return normalizedFullName
    }

    const handle = (user.handle || '')
        .trim()

    if (handle.length > 0) {
        return handle
    }

    return 'Connect user'
}

export function formatUserDisplayName(
    user?: UserProfileLike | null,
    options: {
        includeHandle?: boolean
    } = {},
): string {
    const fullName = getFullNameWithFallback(user)

    if (!fullName) {
        return ''
    }

    if (!options.includeHandle) {
        return fullName
    }

    const handle = (user?.handle || '')
        .trim()

    if (!handle || handle.toLowerCase() === fullName.toLowerCase()) {
        return fullName
    }

    return `${fullName} (${handle})`
}
