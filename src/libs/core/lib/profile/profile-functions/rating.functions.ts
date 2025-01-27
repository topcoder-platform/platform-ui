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
export function getRatingColor(rating: number): string {
    let i: number = 0
    while (TC_RATING_COLORS[i].limit <= rating) i += 1

    return TC_RATING_COLORS[i].color || '#2a2a2a'
}
