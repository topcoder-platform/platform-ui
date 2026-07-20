import { Challenge } from '../../models'

export const getChallengeSubTrackSuffix = (
    legacy: Challenge['legacy'],
): string => (legacy?.subTrack ? ` / ${legacy.subTrack}` : '')
