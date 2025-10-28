/**
 * Backend response for challenge track
 */
export interface BackendChallengeTrack {
  id: string
  name: string
  description: string | null
  isActive: boolean
  abbreviation: string
  legacyId: string | null
  track: string
}
