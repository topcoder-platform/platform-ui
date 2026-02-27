/* eslint-disable complexity */
import { FC, useCallback, useContext, useMemo, useState } from 'react'
import { generatePath, useParams, useSearchParams } from 'react-router-dom'
import { mutate } from 'swr'

import { profileContext, ProfileContextData } from '~/libs/core'
import {
    LinkButton,
    LoadingSpinner,
} from '~/libs/ui'

import {
    challengeDetailRouteId,
    rootRoute,
    submissionRouteId,
} from '../../config/routes.config'
import {
    deleteSubmission,
    getMySubmissionsSwrKey,
    useChallenge,
    useMySubmissions,
} from '../../lib'
import type {
    BackendChallengePhase,
    UseChallengeResult,
    UseMySubmissionsResult,
} from '../../lib'

import { SubmissionsTable } from './components/SubmissionsTable'
import styles from './SubmissionManagementPage.module.scss'

function withLeadingSlash(path: string): string {
    return path.startsWith('/')
        ? path
        : `/${path}`
}

function getPhaseEndDate(
    phase?: BackendChallengePhase,
): string | undefined {
    return phase?.actualEndDate || phase?.scheduledEndDate
}

function formatTimeRemaining(endDate?: string): string {
    if (!endDate) {
        return 'The challenge has ended'
    }

    const nowMs = Date.now()
    const endMs = +(new Date(endDate))

    if (!Number.isFinite(endMs) || endMs <= nowMs) {
        return 'The challenge has ended'
    }

    const diff = endMs - nowMs
    const dayMs = 24 * 60 * 60 * 1000
    const hourMs = 60 * 60 * 1000
    const minuteMs = 60 * 1000

    const days = Math.floor(diff / dayMs)
    const hours = Math.floor((diff % dayMs) / hourMs)
    const minutes = Math.floor((diff % hourMs) / minuteMs)

    return `${days > 0 ? `${days}D ` : ''}${hours}H ${minutes}M`
}

/**
 * Submission management page for current user submissions.
 *
 * @returns Submission management content.
 */
const SubmissionManagementPage: FC = () => {
    const { challengeId }: { challengeId?: string } = useParams<{ challengeId: string }>()
    const [searchParams] = useSearchParams()
    const { profile }: ProfileContextData = useContext(profileContext)
    const memberId = profile?.userId
        ? `${profile.userId}`
        : undefined
    const [deleteError, setDeleteError] = useState<string>('')

    const {
        challenge,
        isLoading: isLoadingChallenge,
    }: UseChallengeResult = useChallenge(challengeId)
    const {
        isLoading: isLoadingSubmissions,
        submissions,
    }: UseMySubmissionsResult = useMySubmissions(challengeId)

    const queryString = searchParams.toString()
    const challengeDetailPath = useMemo(() => withLeadingSlash(
        `${rootRoute}/${generatePath(challengeDetailRouteId, {
            challengeId: challengeId ?? '',
        })}`,
    )
        .replace(/\/{2,}/g, '/'), [challengeId])
    const challengeDetailUrl = useMemo(() => (
        queryString
            ? `${challengeDetailPath}?${queryString}`
            : challengeDetailPath
    ), [challengeDetailPath, queryString])
    const submitPath = useMemo(() => withLeadingSlash(
        `${rootRoute}/${generatePath(submissionRouteId, {
            challengeId: challengeId ?? '',
        })}`,
    )
        .replace(/\/{2,}/g, '/'), [challengeId])
    const submitUrl = useMemo(() => (
        queryString
            ? `${submitPath}?${queryString}`
            : submitPath
    ), [queryString, submitPath])

    const isLoading = isLoadingChallenge || isLoadingSubmissions
    const mySubmissionsSwrKey = useMemo(
        () => getMySubmissionsSwrKey(challengeId, memberId),
        [challengeId, memberId],
    )

    const currentDeadlinePhase = useMemo(() => {
        if (!challenge?.phases?.length) {
            return undefined
        }

        return [...challenge.phases]
            .filter(phase => phase.name !== 'Registration' && phase.isOpen)
            .sort((phaseA, phaseB) => {
                const phaseAEndDate = +(new Date(getPhaseEndDate(phaseA) || 0))
                const phaseBEndDate = +(new Date(getPhaseEndDate(phaseB) || 0))
                return phaseAEndDate - phaseBEndDate
            })[0]
    }, [challenge?.phases])

    const submissionPhase = useMemo(() => {
        if (!challenge?.phases?.length) {
            return undefined
        }

        return challenge.phases.find(phase => phase.name === 'Submission')
    }, [challenge?.phases])

    const submissionPhaseStartDate = useMemo(() => {
        if (!challenge?.phases?.length) {
            return undefined
        }

        const openSubmissionPhase = challenge.phases.find(phase => (
            (phase.name === 'Submission' || phase.name === 'Checkpoint Submission')
            && phase.isOpen
        ))

        return openSubmissionPhase?.actualStartDate || openSubmissionPhase?.scheduledStartDate
    }, [challenge?.phases])

    const isDesign = (challenge?.track.name || '').toLowerCase() === 'design'
    const recommendationText = isDesign
        ? 'We recommend downloading each submission to verify the uploaded .zip files and declaration accuracy.'
        : 'We recommend downloading each submission to verify the uploaded .zip content before final review.'

    const submissionEndDate = submissionPhase
        ? getPhaseEndDate(submissionPhase)
        : undefined
    const isSubmissionPhaseOpen = submissionPhase?.isOpen === true
    const showSubmitButton = !!submissionEndDate
        && isSubmissionPhaseOpen
        && +(new Date(submissionEndDate)) > Date.now()

    const handleDelete = useCallback(async (submissionId: string): Promise<void> => {
        if (!mySubmissionsSwrKey) {
            return
        }

        setDeleteError('')

        try {
            await deleteSubmission(submissionId)
            await mutate(mySubmissionsSwrKey)
        } catch (error) {
            setDeleteError(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete submission.',
            )
        }
    }, [mySubmissionsSwrKey])

    const handleTableDelete = useCallback((submissionId: string): void => {
        handleDelete(submissionId)
            .catch(() => undefined)
    }, [handleDelete])

    const deadlineText = useMemo(() => {
        if (`${challenge?.status}`.toLowerCase() === 'completed') {
            return 'The challenge has ended'
        }

        return `Current Deadline Ends: ${formatTimeRemaining(getPhaseEndDate(currentDeadlinePhase))}`
    }, [challenge?.status, currentDeadlinePhase])

    if (!profile?.userId) {
        return (
            <div className={styles.spinnerWrap}>
                <LoadingSpinner />
            </div>
        )
    }

    if (isLoading || !challenge) {
        return (
            <div className={styles.spinnerWrap}>
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <LinkButton label='Back to Challenge Details' secondary to={challengeDetailUrl} />
                <h1>{challenge.name}</h1>
            </header>

            <div className={styles.content}>
                <div className={styles.contentHeader}>
                    <h2>Manage your submissions</h2>
                    <p className={styles.deadline}>
                        Current Deadline:
                        {' '}
                        <span>{currentDeadlinePhase?.name || 'No open phase'}</span>
                    </p>
                    <p className={styles.deadline}>
                        {deadlineText}
                    </p>
                    <p className={styles.recommendation}>{recommendationText}</p>
                    {!!deleteError && <p className={styles.error}>{deleteError}</p>}
                </div>

                <SubmissionsTable
                    challenge={challenge}
                    isDesign={isDesign}
                    onDelete={handleTableDelete}
                    submissionPhaseStartDate={submissionPhaseStartDate}
                    submissions={submissions}
                />
            </div>

            {showSubmitButton && (
                <div className={styles.footer}>
                    <LinkButton
                        label={submissions.length > 0 ? 'Update Submission' : 'Add Submission'}
                        primary
                        to={submitUrl}
                    />
                </div>
            )}
        </section>
    )
}

export { SubmissionManagementPage }
export default SubmissionManagementPage
