import { FC } from 'react'
import { Navigate, useParams } from 'react-router-dom'

import { LoadingSpinner } from '../../../lib/components'
import {
    useFetchChallenge,
    UseFetchChallengeResult,
} from '../../../lib/hooks'

function normalizeRouteParam(value: string | undefined): string | undefined {
    if (!value) {
        return undefined
    }

    const normalizedValue = value.trim()
    return normalizedValue || undefined
}

function normalizeProjectId(projectId: number | string | undefined): string | undefined {
    if (projectId === undefined || projectId === null) {
        return undefined
    }

    const normalizedProjectId = String(projectId)
        .trim()

    return normalizedProjectId || undefined
}

function buildChallengeEditPath(challengeId: string): string {
    return `/challenges/${encodeURIComponent(challengeId)}/edit`
}

function buildProjectChallengeEditPath(projectId: string, challengeId: string): string {
    return `/projects/${encodeURIComponent(projectId)}/challenges/${encodeURIComponent(challengeId)}/edit`
}

export const ChallengeRouteRedirectPage: FC = () => {
    const routeParams: Readonly<{
        challengeId?: string
    }> = useParams<'challengeId'>()
    const challengeId = normalizeRouteParam(routeParams.challengeId)
    const challengeResult: UseFetchChallengeResult = useFetchChallenge(challengeId)

    if (!challengeId) {
        return <Navigate replace to='/challenges' />
    }

    if (challengeResult.isLoading) {
        return <LoadingSpinner />
    }

    const projectId = normalizeProjectId(challengeResult.challenge?.projectId)
    const redirectPath = projectId
        ? buildProjectChallengeEditPath(projectId, challengeId)
        : buildChallengeEditPath(challengeId)

    return <Navigate replace to={redirectPath} />
}

export default ChallengeRouteRedirectPage
