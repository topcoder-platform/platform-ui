/* eslint-disable complexity */
import { UserProfile, UserRole, UserTrait } from '~/libs/core'
import { availabilityOptions, preferredRoleOptions } from '~/libs/shared/lib/components/modify-open-to-work-modal'

import { ADMIN_ROLES, PHONE_NUMBER_ROLES } from '../config'

declare global {
    interface Window { tcUniNav: any }
}

window.tcUniNav = window.tcUniNav || {}
/**
 * Convert number to fixed digits string
 */
export function numberToFixed(value: number | string, digits: number = 2): string {
    const n: number = Number(value)

    return n ? n.toFixed(digits) : '0'
}

export function notifyUniNavi(profile: UserProfile): void {
    if (window?.tcUniNav) {
        window.tcUniNav('update', '*', {
            user: { ...profile, photoUrl: profile.photoURL },
        })
    }
}

export function subTrackLabelToHumanName(label: string): string {
    switch (label) {
        case 'ASSEMBLY_COMPETITION':
            return 'Assembly Competition'
        case 'CODE':
            return 'Code'
        case 'FIRST_2_FINISH':
            return 'First2Finish'
        case 'CONCEPTUALIZATION':
            return 'Conceptualization'
        case 'SPECIFICATION':
            return 'Specification'
        case 'BUG_HUNT':
            return 'Bug Hunt'
        case 'TEST_SUITES':
            return 'Test Suites'
        case 'TEST_SCENARIOS':
            return 'Test Scenarios'
        case 'CONTENT_CREATION':
            return 'Content Creation'
        case 'COPILOT_POSTING':
            return 'Copilot Posting'
        case 'DESIGN':
            return 'Design'
        case 'WEB_DESIGNS':
            return 'Web Design'
        case 'WIREFRAMES':
            return 'Wireframes'
        case 'MARATHON_MATCH':
            return 'Marathon Match'
        case 'SRM':
            return 'Single Round Match'
        case 'FRONT_END_FLASH':
            return 'Front End Flash'
        case 'PRINT_OR_PRESENTATION':
            return 'Print or Presentation'
        case 'STUDIO_OTHER':
            return 'Studio Other'
        case 'APPLICATION_FRONT_END_DESIGN':
            return 'Application Front End Design'
        case 'BANNERS_OR_ICONS':
            return 'Banners or Icons'
        case 'WIDGET_OR_MOBILE_SCREEN_DESIGN':
            return 'Widget or Mobile Screen Design'
        case 'LOGO_DESIGN':
            return 'Logo Design'
        case 'DESIGN_FIRST_2_FINISH':
            return 'Design First2Finish'
        case 'DEVELOPMENT':
            return 'Development'
        case 'ARCHITECTURE':
            return 'Architecture'
        case 'UI_PROTOTYPE_COMPETITION':
            return 'UI Prototype Competition'
        case 'IDEA_GENERATION':
            return 'Idea Generation'
        case 'RIA_BUILD_COMPETITION':
            return 'RIA Build Competition'

        default: return label
    }

}

export function isValidURL(urlToValidate: string): boolean {
    const pattern = new RegExp(
        '^(https?:\\/\\/)?' // protocol
        + '((([a-z\\d](?:[a-z\\d-]*[a-z\\d])?)\\.)+[a-z]{2,}|' // domain name, forbid leading/trailing dash in label
        + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR IP (v4) address
        + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
        + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
        + '(\\#[-a-z\\d_]*)?$', // fragment locator
        'i',
    )

    let url: URL
    try {
        url = new URL(urlToValidate)
    } catch (e) {
        // try to validate with regex
        // as sometimes new URL is wonky with some urls
        return pattern.test(urlToValidate)
    }

    if (!url.protocol || !url.hostname) {
        return false
    }

    return true
}

/**
 * Creates the string with the number of items and the word describing the item
 * possibly in plural form.
 *
 * @param {number} count - The number of entities
 * @param {string} baseWord - The base word that describes the entity
 * @returns {string}
 */
export function formatPlural(count: number, baseWord: string): string {
    return `${baseWord}${count === 1 ? '' : 's'}`
}

/**
 * Check if the user can download the profile
 * @param authProfile - The authenticated user profile
 * @param profile - The profile to check if the user can download
 * @returns {boolean} - Whether the user can download the profile
 */
export function canDownloadProfile(authProfile: UserProfile | undefined, profile: UserProfile): boolean {
    if (!authProfile) {
        return false
    }

    // Check if user is viewing their own profile
    if (authProfile.handle === profile.handle) {
        return true
    }

    // Check if user has admin roles
    if (authProfile.roles?.some(role => ADMIN_ROLES.includes(role.toLowerCase() as UserRole))) {
        return true
    }

    // Check if user has PM or Talent Manager roles
    const allowedRoles = ['Project Manager', 'Talent Manager']
    if (authProfile
        .roles?.some(
            role => allowedRoles.some(allowed => role.toLowerCase() === allowed.toLowerCase()),
        )
    ) {
        return true
    }

    return false
}

/**
 * Check if the user can see phone numbers
 * @param authProfile - The authenticated user profile
 * @param profile - The profile to check if the user can see phone numbers
 * @returns {boolean} - Whether the user can see phone numbers
 */
export function canSeePhones(authProfile: UserProfile | undefined, profile: UserProfile): boolean {
    if (!authProfile) {
        return false
    }

    if (authProfile.handle === profile.handle) {
        return true
    }

    if (authProfile.roles?.some(role => ADMIN_ROLES.includes(role.toLowerCase() as UserRole))) {
        return true
    }

    if (authProfile
        .roles?.some(
            role => PHONE_NUMBER_ROLES.some(allowed => role.toLowerCase() === allowed.toLowerCase()),
        )
    ) {
        return true
    }

    return false
}

export function getAvailabilityLabel(value?: string): string | undefined {
    return availabilityOptions.find(o => o.value === value)?.label
}

export function getPreferredRoleLabels(values: string[] = []): string[] {
    return values
        .map(v => preferredRoleOptions.find(o => o.value === v)?.label)
        .filter(Boolean) as string[]
}

export function formatRoleList(labels: string[]): string {
    if (labels.length === 1) return labels[0]
    if (labels.length === 2) return `${labels[0]} and ${labels[1]}`

    return `${labels.slice(0, -1)
        .join(', ')} and ${labels[labels.length - 1]}`
}

function isObjectLike(value: any): boolean {
    return !!value && typeof value === 'object'
}

export function flattenPersonalizationData(personalizationData: UserTrait[] = []): UserTrait[] {
    return personalizationData.reduce((accumulator: UserTrait[], item: UserTrait) => {
        if (!isObjectLike(item)) return accumulator

        accumulator.push(item)

        if (Array.isArray(item.personalization)) {
            item.personalization.forEach((nestedItem: UserTrait) => {
                if (isObjectLike(nestedItem)) {
                    accumulator.push(nestedItem)
                }
            })
        }

        return accumulator
    }, [])
}

export function getFirstProfileSelfTitle(personalizationData: UserTrait[] = []): string | undefined {
    return flattenPersonalizationData(personalizationData)
        .map((trait: UserTrait) => (
            typeof trait.profileSelfTitle === 'string' ? trait.profileSelfTitle.trim() : ''
        ))
        .find(Boolean)
}

export function getPersonalizationLinks(personalizationData: UserTrait[] = []): UserTrait[] {
    const linksByKey = new Set<string>()

    return flattenPersonalizationData(personalizationData)
        .reduce((accumulator: UserTrait[], trait: UserTrait) => {
            if (!Array.isArray(trait.links)) return accumulator

            trait.links.forEach((link: UserTrait) => {
                const name = typeof link?.name === 'string' ? link.name.trim() : ''
                const url = typeof link?.url === 'string' ? link.url.trim() : ''

                if (!name || !url) return

                const dedupeKey = `${name.toLowerCase()}-${url}`
                if (linksByKey.has(dedupeKey)) return

                linksByKey.add(dedupeKey)
                accumulator.push({
                    ...link,
                    name,
                    url,
                })
            })

            return accumulator
        }, [])
}
