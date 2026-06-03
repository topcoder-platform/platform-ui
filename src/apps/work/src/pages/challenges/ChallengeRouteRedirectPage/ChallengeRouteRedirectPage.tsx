import {
    FC,
    useCallback,
} from 'react'
import { Navigate, useParams } from 'react-router-dom'

import {
    ErrorMessage,
    LoadingSpinner,
} from '../../../lib/components'
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

/**
 * Builds the canonical read-only challenge route for challenge pages without a project segment.
 *
 * @param challengeId Challenge identifier from the route.
 * @returns View-mode route for the resolved challenge id.
 */
function buildChallengeViewPath(challengeId: string): string {
    return `/challenges/${encodeURIComponent(challengeId)}/view`
}

/**
 * Builds the canonical project-scoped read-only challenge route.
 *
 * @param projectId Project identifier resolved from the challenge payload.
 * @param challengeId Challenge identifier from the route.
 * @returns View-mode route for the resolved project and challenge ids.
 */
function buildProjectChallengeViewPath(projectId: string, challengeId: string): string {
    return `/projects/${encodeURIComponent(projectId)}/challenges/${encodeURIComponent(challengeId)}/view`
}

/**
 * Resolves the generic challenge-load error text for the redirect helper.
 *
 * @param error challenge fetch error returned by the challenge hook.
 * @returns an error message suitable for the existing work app error panel.
 */
function getChallengeErrorMessage(error: Error | undefined): string {
    return error?.message || 'Something went wrong while loading the challenge.'
}

export const ChallengeRouteRedirectPage: FC = () => {
    const routeParams: Readonly<{
        challengeId?: string
    }> = useParams<'challengeId'>()
    const challengeId = normalizeRouteParam(routeParams.challengeId)
    const challengeResult: UseFetchChallengeResult = useFetchChallenge(challengeId)
    const handleRetry = useCallback((): void => {
        challengeResult.mutate()
            .catch(() => undefined)
    }, [challengeResult])

    if (!challengeId) {
        return <Navigate replace to='/challenges' />
    }

    if (challengeResult.isLoading) {
        return <LoadingSpinner />
    }

    if (challengeResult.isError) {
        return (
            <ErrorMessage
                message={getChallengeErrorMessage(challengeResult.error)}
                onRetry={handleRetry}
            />
        )
    }

    const projectId = normalizeProjectId(challengeResult.challenge?.projectId)
    const redirectPath = projectId
        ? buildProjectChallengeViewPath(projectId, challengeId)
        : buildChallengeViewPath(challengeId)

    return <Navigate replace to={redirectPath} />
}

export default ChallengeRouteRedirectPage
