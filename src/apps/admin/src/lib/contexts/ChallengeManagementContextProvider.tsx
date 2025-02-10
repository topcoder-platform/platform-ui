import {
    Context,
    createContext,
    FC,
    PropsWithChildren,
    useCallback,
    useMemo,
    useState,
} from 'react'

import {
    ChallengeStatus,
    ChallengeTrack,
    ChallengeType,
    ResourceRole,
} from '../models'
import {
    getChallengeTracks,
    getChallengeTypes,
    getResourceRoles,
} from '../services'

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
        challengeStatuses: [],
        challengeTracks: [],
        challengeTypes: [],
        loadChallengeTracks: () => undefined,
        loadChallengeTypes: () => undefined,
        loadResourceRoles: () => undefined,
        resourceRoles: [],
    })

export const ChallengeManagementContextProvider: FC<PropsWithChildren> = props => {
    const [challengeTypes, setChallengeTypes] = useState<ChallengeType[]>([])
    const [challengeTracks, setChallengeTracks] = useState<ChallengeTrack[]>([])
    const [challengeStatuses] = useState<ChallengeStatus[]>([
        ChallengeStatus.New,
        ChallengeStatus.Draft,
        ChallengeStatus.Active,
        ChallengeStatus.Completed,
    ])
    const [resourceRoles, setResourceRoles] = useState<ResourceRole[]>([])

    const loadChallengeTypes = useCallback(() => {
        getChallengeTypes()
            .then(types => {
                setChallengeTypes(types)
            })
    }, [])

    const loadChallengeTracks = useCallback(() => {
        getChallengeTracks()
            .then(tracks => {
                setChallengeTracks(tracks)
            })
    }, [])

    const loadResourceRoles = useCallback(() => {
        getResourceRoles()
            .then(roles => {
                setResourceRoles(roles)
            })
    }, [])

    const value = useMemo(
        () => ({
            challengeStatuses,
            challengeTracks,
            challengeTypes,
            loadChallengeTracks,
            loadChallengeTypes,
            loadResourceRoles,
            resourceRoles,
        }),
        [
            challengeStatuses,
            challengeTracks,
            challengeTypes,
            loadChallengeTracks,
            loadChallengeTypes,
            loadResourceRoles,
            resourceRoles,
        ],
    )
    return (
        <ChallengeManagementContext.Provider value={value}>
            {props.children}
        </ChallengeManagementContext.Provider>
    )
}
