import {
    FC,
    MouseEvent as ReactMouseEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'
import {
    useNavigate,
    useParams,
} from 'react-router-dom'

import { PageWrapper } from '~/apps/review/src/lib'
import {
    Button,
    IconOutline,
} from '~/libs/ui'

import {
    ChallengeStatus,
    ConfirmationModal,
    ErrorMessage,
    LoadingSpinner,
} from '../../../lib/components'
import {
    CHALLENGE_STATUS,
    COMMUNITY_APP_URL,
    REVIEW_APP_URL,
} from '../../../lib/constants'
import {
    useFetchChallenge,
    UseFetchChallengeResult,
} from '../../../lib/hooks'
import {
    deleteChallenge,
    patchChallenge,
} from '../../../lib/services'
import {
    extractErrorMessage,
    getStatusText,
    showErrorToast,
    showSuccessToast,
} from '../../../lib/utils'

import {
    ChallengeEditorForm,
    ResourcesSection,
    SubmissionsSection,
} from './components'
import styles from './ChallengeEditorPage.module.scss'

interface ErrorWithStatus extends Error {
    status?: number
}

type EditorTab = 'details' | 'resources' | 'submissions'

const CANCEL_CHALLENGE_STATUSES: string[] = [
    CHALLENGE_STATUS.CANCELLED_FAILED_REVIEW,
    CHALLENGE_STATUS.CANCELLED_FAILED_SCREENING,
    CHALLENGE_STATUS.CANCELLED_ZERO_SUBMISSIONS,
    CHALLENGE_STATUS.CANCELLED_WINNER_UNRESPONSIVE,
    CHALLENGE_STATUS.CANCELLED_CLIENT_REQUEST,
    CHALLENGE_STATUS.CANCELLED_REQUIREMENTS_INFEASIBLE,
    CHALLENGE_STATUS.CANCELLED_ZERO_REGISTRATIONS,
]

interface EditorTabsProps {
    activeTab: EditorTab
    onDetailsTabClick: () => void
    onResourcesTabClick: () => void
    onSubmissionsTabClick: () => void
}

interface ChallengeEditorContentProps {
    activeTab: EditorTab
    challenge: UseFetchChallengeResult['challenge']
    challengeId?: string
    isEditMode: boolean
    onRegisterLaunchAction: (action: (() => Promise<void>) | undefined) => void
    projectId?: string
}

interface ChallengeEditorBodyProps {
    activeTab: EditorTab
    challengeId?: string
    challengeResult: UseFetchChallengeResult
    isEditMode: boolean
    onDetailsTabClick: () => void
    onRegisterLaunchAction: (action: (() => Promise<void>) | undefined) => void
    onResourcesTabClick: () => void
    onRetry: () => void
    onSubmissionsTabClick: () => void
    projectId?: string
}

interface ChallengeQuickLinksProps {
    challenge: UseFetchChallengeResult['challenge']
    challengeId?: string
    isEditMode: boolean
    projectId?: string
}

function getErrorMessage(error: Error | undefined): string {
    if (!error) {
        return 'Something went wrong while loading the challenge.'
    }

    const typedError = error as ErrorWithStatus

    if (typedError.status === 404) {
        return 'Challenge not found.'
    }

    return typedError.message || 'Something went wrong while loading the challenge.'
}

function getTabClassName(activeTab: EditorTab, tab: EditorTab): string {
    return activeTab === tab
        ? `${styles.tabButton} ${styles.activeTabButton}`
        : styles.tabButton
}

function shouldShowLaunchAction(
    isEditMode: boolean,
    activeTab: EditorTab,
    challengeStatus: string | undefined,
    hasLaunchAction: boolean,
): boolean {
    return isEditMode
        && activeTab === 'details'
        && challengeStatus === CHALLENGE_STATUS.DRAFT
        && hasLaunchAction
}

function shouldShowCancelAction(
    isEditMode: boolean,
    activeTab: EditorTab,
    challengeStatus: string | undefined,
): boolean {
    return isEditMode
        && activeTab === 'details'
        && challengeStatus === CHALLENGE_STATUS.ACTIVE
}

function shouldShowDeleteAction(
    isEditMode: boolean,
    challengeStatus: string | undefined,
): boolean {
    const normalizedStatus = (challengeStatus || '')
        .trim()
        .toUpperCase()

    return isEditMode
        && normalizedStatus === CHALLENGE_STATUS.NEW
}

function formatCancelStatusLabel(status: string): string {
    function capitalizeWord(word: string): string {
        if (!word) {
            return ''
        }

        const firstCharacter = word.charAt(0)
        const uppercaseFirstCharacter = firstCharacter.toUpperCase()

        return `${uppercaseFirstCharacter}${word.slice(1)}`
    }

    return status
        .trim()
        .toLowerCase()
        .split('_')
        .filter(Boolean)
        .map(capitalizeWord)
        .join(' ')
}

function getCancelConfirmationMessage(
    challengeName: string,
    statusLabel: string,
): string {
    return `Do you want to cancel challenge ${challengeName} with status ${statusLabel}?`
}

interface CancelChallengeActionProps {
    challengeId: string
    challengeName: string
    onCancelled: () => void
}

const CancelChallengeAction: FC<CancelChallengeActionProps> = (
    props: CancelChallengeActionProps,
) => {
    const [isCancelling, setIsCancelling] = useState<boolean>(false)
    const [showCancelMenu, setShowCancelMenu] = useState<boolean>(false)
    const [showCancelModal, setShowCancelModal] = useState<boolean>(false)
    const [selectedCancelStatus, setSelectedCancelStatus] = useState<string | undefined>()
    const cancelActionRef = useRef<HTMLDivElement>(null)

    const selectedCancelStatusLabel = selectedCancelStatus
        ? formatCancelStatusLabel(selectedCancelStatus)
        : ''
    const handleCancelMenuToggle = useCallback((): void => {
        if (isCancelling) {
            return
        }

        setShowCancelMenu(current => !current)
    }, [isCancelling])
    const handleCancelStatusSelect = useCallback((event: ReactMouseEvent<HTMLButtonElement>): void => {
        const selectedStatus = event.currentTarget.dataset.status
        if (!selectedStatus) {
            return
        }

        setSelectedCancelStatus(selectedStatus)
        setShowCancelMenu(false)
        setShowCancelModal(true)
    }, [])
    const handleCancelModalClose = useCallback((): void => {
        if (isCancelling) {
            return
        }

        setShowCancelModal(false)
    }, [isCancelling])
    const handleCancelConfirm = useCallback(async (): Promise<void> => {
        if (isCancelling || !selectedCancelStatus) {
            return
        }

        setIsCancelling(true)

        try {
            await patchChallenge(props.challengeId, {
                status: selectedCancelStatus,
            })
            showSuccessToast('Challenge cancelled successfully')
            setShowCancelModal(false)
            props.onCancelled()
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Failed to cancel challenge'
            showErrorToast(errorMessage)
        } finally {
            setIsCancelling(false)
        }
    }, [
        isCancelling,
        props,
        selectedCancelStatus,
    ])
    const handleCancelConfirmClick = useCallback((): void => {
        handleCancelConfirm()
            .catch(() => undefined)
    }, [handleCancelConfirm])

    useEffect(() => {
        if (!showCancelMenu) {
            return () => undefined
        }

        function handleDocumentClick(event: MouseEvent): void {
            if (!cancelActionRef.current) {
                return
            }

            if (!cancelActionRef.current.contains(event.target as Node)) {
                setShowCancelMenu(false)
            }
        }

        document.addEventListener('mousedown', handleDocumentClick)
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick)
        }
    }, [showCancelMenu])

    return (
        <>
            <div className={styles.cancelAction} ref={cancelActionRef}>
                <Button
                    disabled={isCancelling}
                    label={isCancelling
                        ? 'Cancelling...'
                        : 'Cancel'}
                    onClick={handleCancelMenuToggle}
                    primary
                    size='md'
                    type='button'
                    variant='danger'
                />
                {showCancelMenu
                    ? (
                        <div className={styles.cancelMenu}>
                            {CANCEL_CHALLENGE_STATUSES.map(status => (
                                <button
                                    key={status}
                                    className={styles.cancelMenuItem}
                                    data-status={status}
                                    onClick={handleCancelStatusSelect}
                                    type='button'
                                >
                                    {formatCancelStatusLabel(status)}
                                </button>
                            ))}
                        </div>
                    )
                    : undefined}
            </div>
            {showCancelModal && selectedCancelStatus
                ? (
                    <ConfirmationModal
                        cancelText='Back'
                        confirmButtonDanger
                        confirmDisabled={isCancelling}
                        confirmText={isCancelling
                            ? 'Cancelling...'
                            : 'Confirm'}
                        message={getCancelConfirmationMessage(
                            props.challengeName,
                            selectedCancelStatusLabel,
                        )}
                        onCancel={handleCancelModalClose}
                        onConfirm={handleCancelConfirmClick}
                        title='Cancel Challenge'
                    />
                )
                : undefined}
        </>
    )
}

interface RenderHeaderActionParams {
    canCancelChallenge: boolean
    canDeleteChallenge: boolean
    canLaunchChallenge: boolean
    challengeId?: string
    challengeName: string
    isDeleting: boolean
    isLaunching: boolean
    onChallengeCancelled: () => void
    onDeleteOpen: () => void
    onLaunchOpen: () => void
}

function renderHeaderAction(params: RenderHeaderActionParams): JSX.Element | undefined {
    if (params.canLaunchChallenge) {
        return (
            <Button
                className={styles.launchButton}
                disabled={params.isLaunching}
                label={params.isLaunching
                    ? 'Launching...'
                    : 'Launch'}
                onClick={params.onLaunchOpen}
                primary
                size='md'
                type='button'
            />
        )
    }

    if (params.canCancelChallenge && params.challengeId) {
        return (
            <CancelChallengeAction
                challengeId={params.challengeId}
                challengeName={params.challengeName}
                onCancelled={params.onChallengeCancelled}
            />
        )
    }

    if (params.canDeleteChallenge) {
        return (
            <Button
                disabled={params.isDeleting}
                label={params.isDeleting
                    ? 'Deleting...'
                    : 'Delete'}
                onClick={params.onDeleteOpen}
                primary
                size='md'
                type='button'
                variant='danger'
            />
        )
    }

    return undefined
}

interface RenderLaunchModalParams {
    canLaunchChallenge: boolean
    challengeName: string
    isLaunching: boolean
    onLaunchCancel: () => void
    onLaunchConfirmClick: () => void
    showLaunchModal: boolean
}

function renderLaunchModal(params: RenderLaunchModalParams): JSX.Element | undefined {
    if (!params.canLaunchChallenge || !params.showLaunchModal) {
        return undefined
    }

    return (
        <ConfirmationModal
            cancelText='Cancel'
            confirmDisabled={params.isLaunching}
            confirmText={params.isLaunching
                ? 'Launching...'
                : 'Launch'}
            message={`Are you ready to launch challenge ${params.challengeName}?`}
            onCancel={params.onLaunchCancel}
            onConfirm={params.onLaunchConfirmClick}
            title='Launch Challenge'
        />
    )
}

function renderTitleAction(
    isEditMode: boolean,
    challengeStatus: string | undefined,
    challengeQuickLinks?: JSX.Element,
): JSX.Element | undefined {
    const statusPill = isEditMode && challengeStatus
        ? (
            <ChallengeStatus
                status={challengeStatus}
                statusText={getStatusText(challengeStatus)}
            />
        )
        : undefined

    if (!statusPill && !challengeQuickLinks) {
        return undefined
    }

    return (
        <div className={styles.titleAction}>
            {statusPill}
            {challengeQuickLinks}
        </div>
    )
}

const EditorTabs: FC<EditorTabsProps> = (props: EditorTabsProps) => (
    <div className={styles.tabs}>
        <button
            className={getTabClassName(props.activeTab, 'details')}
            onClick={props.onDetailsTabClick}
            type='button'
        >
            Details
        </button>
        <button
            className={getTabClassName(props.activeTab, 'resources')}
            onClick={props.onResourcesTabClick}
            type='button'
        >
            Resources
        </button>
        <button
            className={getTabClassName(props.activeTab, 'submissions')}
            onClick={props.onSubmissionsTabClick}
            type='button'
        >
            Submissions
        </button>
    </div>
)

const ChallengeEditorContent: FC<ChallengeEditorContentProps> = (
    props: ChallengeEditorContentProps,
) => {
    if (!props.isEditMode || props.activeTab === 'details') {
        return (
            <ChallengeEditorForm
                challenge={props.challenge}
                isEditMode={props.isEditMode}
                onRegisterLaunchAction={props.onRegisterLaunchAction}
                projectId={props.projectId}
            />
        )
    }

    if (props.activeTab === 'resources' && props.challenge && props.challengeId) {
        return (
            <ResourcesSection
                challenge={props.challenge}
                challengeId={props.challengeId}
            />
        )
    }

    if (props.activeTab === 'submissions' && props.challenge && props.challengeId) {
        return (
            <SubmissionsSection
                challenge={props.challenge}
                challengeId={props.challengeId}
            />
        )
    }

    return (
        <ChallengeEditorForm
            challenge={props.challenge}
            isEditMode={props.isEditMode}
            onRegisterLaunchAction={props.onRegisterLaunchAction}
            projectId={props.projectId}
        />
    )
}

const ChallengeEditorBody: FC<ChallengeEditorBodyProps> = (
    props: ChallengeEditorBodyProps,
) => {
    if (props.challengeResult.isLoading) {
        return <LoadingSpinner />
    }

    if (props.challengeResult.isError) {
        return (
            <ErrorMessage
                message={getErrorMessage(props.challengeResult.error)}
                onRetry={props.onRetry}
            />
        )
    }

    return (
        <>
            {props.isEditMode
                ? (
                    <EditorTabs
                        activeTab={props.activeTab}
                        onDetailsTabClick={props.onDetailsTabClick}
                        onResourcesTabClick={props.onResourcesTabClick}
                        onSubmissionsTabClick={props.onSubmissionsTabClick}
                    />
                )
                : undefined}
            <ChallengeEditorContent
                activeTab={props.activeTab}
                challenge={props.challengeResult.challenge}
                challengeId={props.challengeId}
                isEditMode={props.isEditMode}
                onRegisterLaunchAction={props.onRegisterLaunchAction}
                projectId={props.projectId}
            />
        </>
    )
}

function renderChallengeQuickLinks(
    props: ChallengeQuickLinksProps,
): JSX.Element | undefined {
    if (!props.isEditMode) {
        return undefined
    }

    const resolvedChallengeId = props.challenge?.id || props.challengeId

    if (!resolvedChallengeId) {
        return undefined
    }

    const reviewLink = `${REVIEW_APP_URL}/active-challenges/${resolvedChallengeId}/challenge-details`
    const forumLink = props.challenge?.discussions?.find(discussion => !!discussion.url)?.url
    const communityChallengeLink = `${COMMUNITY_APP_URL}/challenges/${resolvedChallengeId}`
    const projectChallengesLink = props.projectId
        ? `/projects/${props.projectId}/challenges`
        : undefined

    return (
        <div className={styles.quickLinks}>
            <a
                className={styles.quickLink}
                href={reviewLink}
                rel='noopener noreferrer'
                target='_blank'
            >
                Review
                <IconOutline.ExternalLinkIcon className={styles.quickLinkIcon} />
            </a>
            {forumLink
                ? (
                    <a
                        className={styles.quickLink}
                        href={forumLink}
                        rel='noopener noreferrer'
                        target='_blank'
                    >
                        Forum
                        <IconOutline.ExternalLinkIcon className={styles.quickLinkIcon} />
                    </a>
                )
                : undefined}
            {projectChallengesLink
                ? (
                    <a
                        className={styles.quickLink}
                        href={projectChallengesLink}
                        rel='noopener noreferrer'
                        target='_blank'
                    >
                        Project
                        <IconOutline.ExternalLinkIcon className={styles.quickLinkIcon} />
                    </a>
                )
                : undefined}
            <a
                className={styles.quickLink}
                href={communityChallengeLink}
                rel='noopener noreferrer'
                target='_blank'
            >
                Community
                <IconOutline.ExternalLinkIcon className={styles.quickLinkIcon} />
            </a>
        </div>
    )
}

export const ChallengeEditorPage: FC = () => {
    const navigate = useNavigate()
    const params: Readonly<{ challengeId?: string; projectId?: string }>
        = useParams<'challengeId' | 'projectId'>()
    const challengeId = params.challengeId
    const routeProjectId = params.projectId

    const isEditMode = !!challengeId
    const [activeTab, setActiveTab] = useState<EditorTab>('details')
    const [isDeleting, setIsDeleting] = useState<boolean>(false)
    const [isLaunching, setIsLaunching] = useState<boolean>(false)
    const [launchAction, setLaunchAction] = useState<(() => Promise<void>) | undefined>()
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
    const [showLaunchModal, setShowLaunchModal] = useState<boolean>(false)
    const challengeResult: UseFetchChallengeResult = useFetchChallenge(challengeId)
    const handleRetry = useCallback((): void => {
        challengeResult.mutate()
            .catch(() => undefined)
    }, [challengeResult])
    const handleDetailsTabClick = useCallback((): void => {
        setActiveTab('details')
    }, [])
    const handleResourcesTabClick = useCallback((): void => {
        setActiveTab('resources')
    }, [])
    const handleSubmissionsTabClick = useCallback((): void => {
        setActiveTab('submissions')
    }, [])
    const handleRegisterLaunchAction = useCallback(
        (action: (() => Promise<void>) | undefined): void => {
            setLaunchAction(() => action)
        },
        [],
    )

    const challengeProjectId = challengeResult.challenge?.projectId
        ? String(challengeResult.challenge.projectId)
        : undefined
    const projectId = routeProjectId || challengeProjectId
    const challengesListPath = projectId
        ? `/projects/${projectId}/challenges`
        : '/challenges'

    useEffect(() => {
        if (isEditMode) {
            return
        }

        setActiveTab('details')
    }, [isEditMode])

    const pageTitle = isEditMode
        ? `Edit ${challengeResult.challenge?.name || 'Challenge'}`
        : 'Create Challenge'
    const canLaunchChallenge = shouldShowLaunchAction(
        isEditMode,
        activeTab,
        challengeResult.challenge?.status,
        !!launchAction,
    )
    const canCancelChallenge = shouldShowCancelAction(
        isEditMode,
        activeTab,
        challengeResult.challenge?.status,
    )
    const canDeleteChallenge = shouldShowDeleteAction(
        isEditMode,
        challengeResult.challenge?.status,
    )
    const handleLaunchOpen = useCallback((): void => {
        setShowLaunchModal(true)
    }, [])
    const launchChallengeName = challengeResult.challenge?.name || 'Challenge'
    const handleLaunchCancel = useCallback((): void => {
        if (isLaunching) {
            return
        }

        setShowLaunchModal(false)
    }, [isLaunching])
    const handleLaunchConfirm = useCallback(async (): Promise<void> => {
        if (!launchAction || isLaunching) {
            return
        }

        setIsLaunching(true)

        try {
            await launchAction()
            setShowLaunchModal(false)
            challengeResult.mutate()
                .catch(() => undefined)
        } catch {
            // launch action already surfaces validation and API errors
        } finally {
            setIsLaunching(false)
        }
    }, [
        challengeResult,
        isLaunching,
        launchAction,
    ])
    const handleLaunchConfirmClick = useCallback((): void => {
        handleLaunchConfirm()
            .catch(() => undefined)
    }, [handleLaunchConfirm])
    const handleChallengeCancelled = useCallback((): void => {
        challengeResult.mutate()
            .catch(() => undefined)
    }, [challengeResult])
    const handleDeleteOpen = useCallback((): void => {
        if (isDeleting || !challengeId) {
            return
        }

        setShowDeleteModal(true)
    }, [challengeId, isDeleting])
    const handleDeleteCancel = useCallback((): void => {
        if (isDeleting) {
            return
        }

        setShowDeleteModal(false)
    }, [isDeleting])
    const deleteChallengeName = challengeResult.challenge?.name || 'this challenge'
    const handleDeleteConfirm = useCallback(async (): Promise<void> => {
        if (isDeleting || !challengeId) {
            return
        }

        setIsDeleting(true)

        try {
            await deleteChallenge(challengeId)
            showSuccessToast('Challenge deleted successfully')
            setShowDeleteModal(false)
            navigate(challengesListPath)
        } catch (error) {
            showErrorToast(extractErrorMessage(error, 'Failed to delete challenge'))
        } finally {
            setIsDeleting(false)
        }
    }, [
        challengeId,
        challengesListPath,
        isDeleting,
        navigate,
    ])
    const handleDeleteConfirmClick = useCallback((): void => {
        handleDeleteConfirm()
            .catch(() => undefined)
    }, [handleDeleteConfirm])
    const rightHeader = renderHeaderAction({
        canCancelChallenge,
        canDeleteChallenge,
        canLaunchChallenge,
        challengeId,
        challengeName: launchChallengeName,
        isDeleting,
        isLaunching,
        onChallengeCancelled: handleChallengeCancelled,
        onDeleteOpen: handleDeleteOpen,
        onLaunchOpen: handleLaunchOpen,
    })
    const launchModal = renderLaunchModal({
        canLaunchChallenge,
        challengeName: launchChallengeName,
        isLaunching,
        onLaunchCancel: handleLaunchCancel,
        onLaunchConfirmClick: handleLaunchConfirmClick,
        showLaunchModal,
    })
    const challengeQuickLinks = renderChallengeQuickLinks({
        challenge: challengeResult.challenge,
        challengeId,
        isEditMode,
        projectId,
    })
    const titleAction = renderTitleAction(
        isEditMode,
        challengeResult.challenge?.status,
        challengeQuickLinks,
    )

    return (
        <>
            <PageWrapper
                backUrl={challengesListPath}
                breadCrumb={[]}
                pageTitle={pageTitle}
                rightHeader={rightHeader}
                titleAction={titleAction}
            >
                <div className={styles.container}>
                    <ChallengeEditorBody
                        activeTab={activeTab}
                        challengeId={challengeId}
                        challengeResult={challengeResult}
                        isEditMode={isEditMode}
                        onDetailsTabClick={handleDetailsTabClick}
                        onRegisterLaunchAction={handleRegisterLaunchAction}
                        onResourcesTabClick={handleResourcesTabClick}
                        onRetry={handleRetry}
                        onSubmissionsTabClick={handleSubmissionsTabClick}
                        projectId={projectId}
                    />
                </div>
            </PageWrapper>
            {launchModal}
            {showDeleteModal && canDeleteChallenge
                ? (
                    <ConfirmationModal
                        cancelText='Cancel'
                        confirmButtonDanger
                        confirmDisabled={isDeleting}
                        confirmText={isDeleting
                            ? 'Deleting...'
                            : 'Delete'}
                        message={`Do you want to delete "${deleteChallengeName}"?`}
                        onCancel={handleDeleteCancel}
                        onConfirm={handleDeleteConfirmClick}
                        title='Confirm Delete'
                    />
                )
                : undefined}
        </>
    )
}

export default ChallengeEditorPage
