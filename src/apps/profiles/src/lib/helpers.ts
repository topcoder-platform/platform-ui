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
        default: return label
    }

}
