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
import { handleError } from '../utils'

export type ChallengeManagementContextType = {
    challengeTypes: ChallengeType[]
    challengeTracks: ChallengeTrack[]
    challengeStatuses: ChallengeStatus[]
    resourceRoles: ResourceRole[]
    resourceRolesLoading: boolean

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
        resourceRolesLoading: false,
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
    const [resourceRolesLoading, setResourceRolesLoading] = useState(false)

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
        setResourceRolesLoading(true)
        getResourceRoles()
            .then(roles => {
                setResourceRoles(roles)
                setResourceRolesLoading(false)
            })
            .catch(e => {
                handleError(e)
                setResourceRolesLoading(false)
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
            resourceRolesLoading,
        }),
        [
            challengeStatuses,
            challengeTracks,
            challengeTypes,
            loadChallengeTracks,
            loadChallengeTypes,
            loadResourceRoles,
            resourceRoles,
            resourceRolesLoading,
        ],
    )
    return (
        <ChallengeManagementContext.Provider value={value}>
            {props.children}
        </ChallengeManagementContext.Provider>
    )
}
