import { FC, lazy, Suspense, useCallback, useContext, useState } from 'react'

import { IconOutline, LoadingSpinner } from '~/libs/ui'

import { ChallengeDetailContext, ReviewAppContext } from '../../contexts'
import { ChallengeDetailContextModel, ReviewAppContextModel } from '../../models'
import { isMarathonMatchChallenge } from '../../utils/challenge'

// Load the shared artifact dialog only after an authorized action is selected.
const SubmissionArtifactsModal = lazy(() => import(
    '~/apps/opportunities/src/components/SubmissionArtifactsModal'
).then(module => ({ default: module.SubmissionArtifactsModal })))

interface Props {
    memberId?: string | null
    submissionId: string
}

/**
 * Opens scorer artifacts from Review's submission and history rows. Owners retain
 * regular artifacts during a challenge; registered MM contestants gain all files
 * only when the challenge status is COMPLETED. Review API enforces both requests.
 * @param props Submission identifier and owner from the authorized table row.
 * @returns Artifact action/dialog when allowed, otherwise an empty fragment.
 * @throws Does not throw; the dialog handles list/download failures.
 */
export const SubmissionArtifactsButton: FC<Props> = props => {
    const { challengeInfo, myRoles }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)
    const roles = (myRoles ?? []).map(role => role.toLowerCase())
    const hasSubmitterRole = roles.includes('submitter')
    const hasCopilotRole = roles.some(role => role.includes('copilot'))
    const isAdmin = loginUserInfo?.roles?.some(role => role.toLowerCase() === 'administrator') ?? false
    const [open, setOpen] = useState(false)
    const isCompleted = challengeInfo?.status?.toUpperCase() === 'COMPLETED'
    const isOwner = !!loginUserInfo?.userId
        && String(loginUserInfo.userId) === String(props.memberId ?? '')
    const canManage = isAdmin || hasCopilotRole
    const canAccess = isMarathonMatchChallenge(challengeInfo)
        && (isOwner || canManage || (isCompleted && hasSubmitterRole))

    /** Opens the authorized row's dialog; takes no input, returns void, never throws. */
    const showArtifacts = useCallback((): void => setOpen(true), [])
    /** Closes the dialog; takes no input, returns void, never throws. */
    const closeArtifacts = useCallback((): void => setOpen(false), [])

    if (!canAccess) return <></>

    return (
        <>
            <button
                aria-label={`Download submission artifacts ${props.submissionId}`}
                onClick={showArtifacts}
                title='Download submission artifacts'
                type='button'
            >
                <IconOutline.FolderDownloadIcon aria-hidden='true' width={20} />
            </button>
            {open && (
                <Suspense fallback={<LoadingSpinner />}>
                    <SubmissionArtifactsModal
                        allowInternalArtifacts={canManage || isCompleted}
                        onClose={closeArtifacts}
                        open
                        submissionId={props.submissionId}
                    />
                </Suspense>
            )}
        </>
    )
}
