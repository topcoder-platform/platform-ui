import { TcUniNavFn } from 'universal-navigation'

declare let tcUniNav: TcUniNavFn

/**
 * Get tcUniNav
 * @returns tcUniNav
 */
export function getTcUniNav(): TcUniNavFn | undefined {
    if (typeof tcUniNav === 'undefined') {
        return undefined
    }

    return tcUniNav
}
