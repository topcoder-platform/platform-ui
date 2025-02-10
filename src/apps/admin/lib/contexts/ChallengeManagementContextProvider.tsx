import { Context, createContext, FC, PropsWithChildren, useState } from 'react'
import { ChallengeStatus, ChallengeTrack, ChallengeType, ResourceRole } from '../models'
import { getChallengeTracks, getChallengeTypes, getResourceRoles } from '../services'

export type ChallengeManagementContextType = {
  challengeTypes: ChallengeType[]
  challengeTracks: ChallengeTrack[]
  challengeStatuses: ChallengeStatus[]
  resourceRoles: ResourceRole[]

  loadChallengeTypes: () => void
  loadChallengeTracks: () => void
  loadResourceRoles: () => void
}

export const ChallengeManagementContext: Context<ChallengeManagementContextType>
  = createContext<ChallengeManagementContextType>({
      challengeTypes: [],
      challengeTracks: [],
      challengeStatuses: [],
      resourceRoles: [],
      loadChallengeTypes: () => {},
      loadChallengeTracks: () => {},
      loadResourceRoles: () => {},
  })

export const ChallengeManagementContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const [challengeTypes, setChallengeTypes] = useState<ChallengeType[]>([])
    const [challengeTracks, setChallengeTracks] = useState<ChallengeTrack[]>([])
    const [challengeStatuses] = useState<ChallengeStatus[]>([
        ChallengeStatus.New,
        ChallengeStatus.Draft,
        ChallengeStatus.Active,
        ChallengeStatus.Completed,
    ])
    const [resourceRoles, setResourceRoles] = useState<ResourceRole[]>([])

    const loadChallengeTypes = () => {
        getChallengeTypes()
            .then(types => {
                setChallengeTypes(types)
            })
    }

    const loadChallengeTracks = () => {
        getChallengeTracks()
            .then(tracks => {
                setChallengeTracks(tracks)
            })
    }

    const loadResourceRoles = () => {
        getResourceRoles()
            .then(roles => {
                setResourceRoles(roles)
            })
    }

    return (
        <ChallengeManagementContext.Provider
            value={{
                challengeTypes,
                challengeTracks,
                challengeStatuses,
                resourceRoles,
                loadChallengeTypes,
                loadChallengeTracks,
                loadResourceRoles,
            }}
        >
            {children}
        </ChallengeManagementContext.Provider>
    )
}
