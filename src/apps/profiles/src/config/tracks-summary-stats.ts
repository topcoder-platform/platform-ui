export interface TrackSummaryStats {
    name: string
    fields: {[key: string]: boolean}
}

export const designTrackSummaryStats: TrackSummaryStats = {
    fields: {
        challenges: true,
        screeningSuccessRate: true,
        submissionRate: true,
    },
    name: 'Design',
}

export const developTrackSummaryStats: TrackSummaryStats = {
    fields: {
        challenges: true,
        submissions: true,
        wins: true,
    },
    name: 'Development',
}

export const testingTrackSummaryStats: TrackSummaryStats = {
    fields: {
        challenges: true,
        submissions: true,
        wins: true,
    },
    name: 'Testing',
}

export const cpTrackSummaryStats: TrackSummaryStats = {
    fields: {
        challenges: true,
        ranking: true,
        rating: true,
    },
    name: 'Competitive Programming',
}

export const TracksSummaryStatsMap: {[key: string]: TrackSummaryStats} = {
    [designTrackSummaryStats.name]: designTrackSummaryStats,
    [developTrackSummaryStats.name]: developTrackSummaryStats,
    [testingTrackSummaryStats.name]: testingTrackSummaryStats,
    [cpTrackSummaryStats.name]: cpTrackSummaryStats,
}

export const TracksSummaryStats: TrackSummaryStats[] = Object.values(TracksSummaryStatsMap)
