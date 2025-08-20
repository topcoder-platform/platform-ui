export const baseDetailPath: string = '/badge-detail'
export const createBadgePath: string = '/create-badge'

export function badgeDetailPath(
    rootPage: string,
    badgeId: string,
    view?: 'edit' | 'award',
): string {
    return `${rootPage}${baseDetailPath}/${badgeId}${!!view ? `#${view}` : ''}`
}

export const createBadgeRoute: (rootPage: string) => string = (
    rootPage: string,
) => `${rootPage}${createBadgePath}`
