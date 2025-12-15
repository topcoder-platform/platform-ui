/* eslint-disable complexity */
import { UserProfile } from '~/libs/core'

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
