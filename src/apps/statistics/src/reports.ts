export type ReportRow = Record<string, string | number | null>
export interface Column { field: string; label: string; member?: boolean }
export interface Report { path: string; title: string; columns: Column[] }
export interface StatisticsSection { id: string; title: string; reports: Report[] }

const country: Column = { field: 'country.country_name', label: 'Country' }
const count: Column = { field: 'challenge_stats.count', label: 'Wins' }
const member = (field: string): Column => ({ field, label: 'Member', member: true })
const winners = (path: string, title: string, field: string = 'challenge_stats.winner_handle'): Report => ({
    columns: [member(field), count], path, title,
})
const countries = (track: string): Report => ({
    columns: [country, { field: 'user.count', label: 'Members' }],
    path: `${track}/countries-represented`,
    title: 'Countries represented',
})
const firstSubmitters = (track: string): Report => ({
    columns: [member('user.handle'), { field: 'challenge.challenge_name', label: 'Challenge' },
        { field: 'newest_submitters.submit_date_date', label: 'Submitted' }],
    path: `${track}/first-time-submitters`,
    title: 'First-time submitters in the last three months',
})
const placements = (type: string): Report => ({
    columns: [member('submitter.handle'), { field: 'challenge.count', label: 'Placements' }],
    path: `design/${type}-placements`,
    title: `${type.toUpperCase()} placements`,
})
const rated = (track: string): Report[] => [
    { columns: [member('member_profile_basic.handle'), { field: 'member_stats.rating', label: 'Rating' }],
        path: `${track}/top-rated`,
        title: 'Highest rated members' },
    { columns: [member('member_profile_basic.handle'), { field: 'member_stats.competitions', label: 'Competitions' }],
        path: `${track}/competitions-count`,
        title: 'Number of competitions' },
    { columns: [country, { field: 'member_stats.rating', label: 'Rating' }],
        path: `${track}/country-ratings`,
        title: 'Country ratings' },
]

/** Public report contracts shared with the retired community statistics page. */
export const sections: StatisticsSection[] = [
    { id: 'general',
        reports: [
            countries('general'),
            { columns: [country, count], path: 'general/first-place-by-country', title: 'First-place wins by country' },
            { columns: [member('copilot.handle'), { field: 'challenge.count', label: 'Challenges' }],
                path: 'general/copiloted-challenges',
                title: 'Copiloted challenges' },
            { columns: [member('reviewer.handle'), { field: 'challenge.count', label: 'Reviews' }],
                path: 'general/reviews-by-member',
                title: 'Reviews by member' },
        ],
        title: 'General' },
    { id: 'development',
        reports: [
            winners('development/first-place-wins', 'First-place wins', 'challenge_stats.registrant_handle'),
            winners('development/prototype-wins', 'Prototype wins'),
            winners('development/code-wins', 'Code wins'),
            winners('development/f2f-wins', 'First2Finish wins'),
            countries('development'), firstSubmitters('development'),
            { columns: [{ field: 'challenge_technology.name', label: 'Technology' },
                { field: 'challenge_stats.count', label: 'Challenges' }],
            path: 'development/challenges-technology',
            title: 'Challenges by technology' },
        ],
        title: 'Development' },
    { id: 'design',
        reports: [
            winners('design/first-place-by-country', 'First-place wins', 'challenge_stats.registrant_handle'),
            winners('design/ui-design-wins', 'UI design wins'),
            winners('design/wireframe-wins', 'Wireframe wins'),
            winners('design/f2f-wins', 'First2Finish wins'),
            winners('design/lux-first-place-wins', 'LUX first-place wins'), placements('lux'),
            winners('design/rux-first-place-wins', 'RUX first-place wins'), placements('rux'),
            countries('design'), firstSubmitters('design'),
        ],
        title: 'Design' },
    { id: 'qa',
        reports: [
            { columns: [member('challenge_stats.registrant_handle'),
                { field: 'first_place_winner_count', label: 'Wins' }],
            path: 'qa/wins',
            title: 'First-place wins' },
        ],
        title: 'QA' },
    { id: 'srm', reports: rated('srm'), title: 'SRM' },
    { id: 'marathon-match',
        reports: [
            ...rated('mm'),
            { columns: [member('member_profile_basic.handle'),
                { field: 'member_stats.top_ten_finishes', label: 'Finishes' }],
            path: 'mm/top-10-finishes',
            title: 'Top 10 finishes' },
        ],
        title: 'Marathon Match' },
]
