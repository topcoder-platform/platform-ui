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

        default: return label
    }

}

export function isValidURL(urlToValidate: string): boolean {
    let url: URL
    try {
        url = new URL(urlToValidate)
    } catch (e) {
        return false
    }

    if (!url.protocol || !url.hostname) {
        return false
    }

    return true
}
