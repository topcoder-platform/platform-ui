import { CSSProperties } from 'react'

import { skillSources } from '../user-skill.model'

export const TC_RATING_COLORS: Array<{ color: string, limit: number }> = [{
    color: '#555555' /* Grey */,
    limit: 900,
}, {
    color: '#2D7E2D' /* Green */,
    limit: 1200,
}, {
    color: '#616BD5' /* Blue */,
    limit: 1500,
}, {
    color: '#F2C900' /* Yellow */,
    limit: 2200,
}, {
    color: '#EF3A3A' /* Red */,
    limit: Infinity,
}]

/**
 * Inline CSS for rating color
 */
export function ratingToCSScolor(rating: number): CSSProperties {
    let i: number = 0
    while (TC_RATING_COLORS[i].limit <= rating) i += 1

    const color: string = TC_RATING_COLORS[i].color || '#2a2a2a'

    return {
        color,
    }
}

export function isVerifiedSkill(skillOriginSources: skillSources[]): boolean {
    return skillOriginSources?.includes('CHALLENGE')
}
