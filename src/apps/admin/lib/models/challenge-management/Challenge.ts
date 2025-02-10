export enum ChallengeStatus {
  New = 'New',
  Draft = 'Draft',
  Active = 'Active',
  Completed = 'Completed',
}

export type ChallengeType = {
  id: string
  name: string
  abbreviation: string
}

export type ChallengeTrack = {
  id: string
  name: string
  abbreviation: string
}

export interface Challenge {
  /** Challenge UUID. */
  id: string
  /** Challenge name. */
  name: string
  /** Direct-app project ID. */
  legacyId: string
  /** Challenge type. */
  type: ChallengeType['name']
  /** Type UUID. */
  typeId: string
  /** Challenge track. */
  track: ChallengeTrack['name']
  legacy: {
    subTrack: string
  }
  /** Challenge status. */
  status: ChallengeStatus
  /** Connect-app project ID. */
  projectId: number
  /** Number of registrants. */
  numOfRegistrants: number
  /** Number of submissions. */
  numOfSubmissions: number
  /** Challenge groups. */
  groups: Array<object>
  /** Challenge phases. */
  phases: Array<{ name: string; isOpen: boolean; scheduledEndDate: string }>
}
