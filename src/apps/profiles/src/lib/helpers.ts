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
