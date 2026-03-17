import {
    FC,
    MouseEvent as ReactMouseEvent,
    useCallback,
    useContext,
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
    Tooltip,
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
import { WorkAppContext } from '../../../lib/contexts'
import {
    useFetchChallenge,
    useFetchResourceRoles,
    useFetchResources,
} from '../../../lib/hooks'
import type { UseFetchChallengeResult } from '../../../lib/hooks'
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
import {
    buildTaskWinnerPayload,
    getAssignedTaskMember,
    getCompleteTaskConfirmationMessage,
    getTaskPrizeAmount,
    isSelfAssignedCopilot,
    shouldShowCompleteTaskAction,
} from './ChallengeEditorPage.utils'
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

const NO_TASK_ASSIGNEE_MESSAGE = 'Task is not assigned yet'
const MARK_COMPLETE_TOOLTIP_MESSAGE
    = 'This will close the task and generate a payment for the assignee and copilot.'

interface EditorTabsProps {
    activeTab: EditorTab
    onDetailsTabClick: () => void
    onResourcesTabClick: () => void
    onSubmissionsTabClick: () => void
}

interface ChallengeEditorContentProps {
    activeTab: EditorTab
    canLaunchChallenge: boolean
    challenge: UseFetchChallengeResult['challenge']
    challengeId?: string
    isLaunchDisabled: boolean
    isEditMode: boolean
    launchButtonLabel: string
    onChallengeStatusChange: (status?: string) => void
    onLaunchOpen: () => void
    onRegisterLaunchAction: (action: (() => Promise<void>) | undefined) => void
    onSavingChange: (isSaving: boolean) => void
    projectId?: string
}

interface ChallengeEditorBodyProps {
    activeTab: EditorTab
    canLaunchChallenge: boolean
    challengeId?: string
    challengeResult: UseFetchChallengeResult
    isLaunchDisabled: boolean
    isEditMode: boolean
    launchButtonLabel: string
    onChallengeStatusChange: (status?: string) => void
    onLaunchOpen: () => void
    onDetailsTabClick: () => void
    onRegisterLaunchAction: (action: (() => Promise<void>) | undefined) => void
    onResourcesTabClick: () => void
    onRetry: () => void
    onSavingChange: (isSaving: boolean) => void
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

function useResolvedChallengeStatus(
    challengeId: string | undefined,
    fetchedChallengeStatus: string | undefined,
): [
    string | undefined,
    (status?: string) => void,
] {
    const [challengeStatus, setChallengeStatus] = useState<string | undefined>()
    const lastFetchedChallengeStatusRef = useRef<string | undefined>()

    useEffect(() => {
        lastFetchedChallengeStatusRef.current = undefined
        setChallengeStatus(undefined)
    }, [challengeId])

    useEffect(() => {
        if (
            !fetchedChallengeStatus
            || fetchedChallengeStatus === lastFetchedChallengeStatusRef.current
        ) {
            return
        }

        lastFetchedChallengeStatusRef.current = fetchedChallengeStatus
        setChallengeStatus(fetchedChallengeStatus)
    }, [fetchedChallengeStatus])

    const handleChallengeStatusChange = useCallback((status?: string): void => {
        setChallengeStatus(status)
    }, [])

    return [
        challengeStatus || fetchedChallengeStatus,
        handleChallengeStatusChange,
    ]
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

function getChallengeEditorPageTitle(
    isEditMode: boolean,
    challengeName: string | undefined,
): string {
    return isEditMode
        ? `Edit ${challengeName || 'Challenge'}`
        : 'Create Challenge'
}

function getChallengesListPath(projectId?: string): string {
    return projectId
        ? `/projects/${projectId}/challenges`
        : '/challenges'
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
    // eslint-disable-next-line unicorn/no-null
    const cancelActionRef = useRef<HTMLDivElement>(null)
    const challengeId: string = props.challengeId
    const challengeName: string = props.challengeName
    const onCancelled: () => void = props.onCancelled

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
            await patchChallenge(challengeId, {
                status: selectedCancelStatus,
            })
            showSuccessToast('Challenge cancelled successfully')
            setShowCancelModal(false)
            onCancelled()
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Failed to cancel challenge'
            showErrorToast(errorMessage)
        } finally {
            setIsCancelling(false)
        }
    }, [
        challengeId,
        isCancelling,
        onCancelled,
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
                            challengeName,
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

interface CompleteTaskActionProps {
    challenge: NonNullable<UseFetchChallengeResult['challenge']>
    challengeId: string
    onCompleted: () => void
}

const CompleteTaskAction = (
    props: CompleteTaskActionProps,
): JSX.Element => {
    const [isCompleting, setIsCompleting] = useState<boolean>(false)
    const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false)
    const challenge: NonNullable<UseFetchChallengeResult['challenge']> = props.challenge
    const challengeId: string = props.challengeId
    const onCompleted: () => void = props.onCompleted
    const workAppContext = useContext(WorkAppContext)
    const resourcesResult = useFetchResources(challengeId)
    const resourceRolesResult = useFetchResourceRoles()
    const assignedTaskMember = getAssignedTaskMember(
        challenge,
        resourcesResult.resources,
        resourceRolesResult.resourceRoles,
    )
    const taskPrizeAmount = getTaskPrizeAmount(challenge.prizeSets)
    const isHiddenForSelfAssignedCopilot = isSelfAssignedCopilot(
        workAppContext,
        assignedTaskMember,
    )

    const handleCompleteOpen = useCallback((): void => {
        if (isCompleting || !assignedTaskMember) {
            return
        }

        setShowCompleteModal(true)
    }, [
        assignedTaskMember,
        isCompleting,
    ])
    const handleCompleteCancel = useCallback((): void => {
        if (isCompleting) {
            return
        }

        setShowCompleteModal(false)
    }, [isCompleting])
    const handleCompleteConfirm = useCallback(async (): Promise<void> => {
        if (isCompleting || !assignedTaskMember) {
            return
        }

        setIsCompleting(true)

        try {
            await patchChallenge(challengeId, {
                status: CHALLENGE_STATUS.COMPLETED,
                winners: buildTaskWinnerPayload(assignedTaskMember),
            })
            showSuccessToast('Task closed successfully')
            setShowCompleteModal(false)
            onCompleted()
        } catch (error) {
            showErrorToast(extractErrorMessage(error, 'Unable to close the task'))
        } finally {
            setIsCompleting(false)
        }
    }, [
        assignedTaskMember,
        challengeId,
        isCompleting,
        onCompleted,
    ])
    const handleCompleteConfirmClick = useCallback((): void => {
        handleCompleteConfirm()
            .catch(() => undefined)
    }, [handleCompleteConfirm])
    const isLoadingAssignee = resourcesResult.isLoading && !assignedTaskMember
    const completeButton = (
        <div>
            <Button
                className={styles.launchButton}
                disabled={isCompleting || !assignedTaskMember || isLoadingAssignee}
                label={isCompleting
                    ? 'Completing...'
                    : 'Mark Complete'}
                onClick={handleCompleteOpen}
                primary
                size='md'
                type='button'
            />
        </div>
    )
    const tooltipContent = assignedTaskMember
        ? MARK_COMPLETE_TOOLTIP_MESSAGE
        : (
            isLoadingAssignee
                ? undefined
                : NO_TASK_ASSIGNEE_MESSAGE
        )

    if (isHiddenForSelfAssignedCopilot) {
        return <></>
    }

    return (
        <>
            {tooltipContent
                ? (
                    <Tooltip content={tooltipContent}>
                        {completeButton}
                    </Tooltip>
                )
                : completeButton}
            {showCompleteModal && assignedTaskMember
                ? (
                    <ConfirmationModal
                        cancelText='Cancel'
                        confirmDisabled={isCompleting}
                        confirmText={isCompleting
                            ? 'Completing...'
                            : 'Confirm'}
                        message={getCompleteTaskConfirmationMessage(
                            challenge.name,
                            taskPrizeAmount,
                            assignedTaskMember,
                        )}
                        onCancel={handleCompleteCancel}
                        onConfirm={handleCompleteConfirmClick}
                        title='Complete Task Confirmation'
                    />
                )
                : undefined}
        </>
    )
}

interface RenderHeaderActionParams {
    canCancelChallenge: boolean
    canCompleteTask: boolean
    canDeleteChallenge: boolean
    canLaunchChallenge: boolean
    challenge?: UseFetchChallengeResult['challenge']
    challengeId?: string
    challengeName: string
    isDeleting: boolean
    isLaunching: boolean
    isSaving: boolean
    onChallengeUpdated: () => void
    onDeleteOpen: () => void
    onLaunchOpen: () => void
}

function renderHeaderAction(params: RenderHeaderActionParams): JSX.Element | undefined {
    const actions: JSX.Element[] = []

    if (params.canLaunchChallenge) {
        actions.push(
            <Button
                key='launch'
                className={styles.launchButton}
                disabled={params.isLaunching || params.isSaving}
                label={params.isLaunching
                    ? 'Launching...'
                    : 'Launch'}
                onClick={params.onLaunchOpen}
                primary
                size='md'
                type='button'
            />,
        )
    }

    if (params.canCancelChallenge && params.challengeId) {
        actions.push(
            <CancelChallengeAction
                key='cancel'
                challengeId={params.challengeId}
                challengeName={params.challengeName}
                onCancelled={params.onChallengeUpdated}
            />,
        )
    }

    if (params.canCompleteTask && params.challengeId && params.challenge) {
        actions.push(
            <CompleteTaskAction
                key='complete'
                challenge={params.challenge}
                challengeId={params.challengeId}
                onCompleted={params.onChallengeUpdated}
            />,
        )
    }

    if (params.canDeleteChallenge) {
        actions.push(
            <Button
                key='delete'
                disabled={params.isDeleting}
                label={params.isDeleting
                    ? 'Deleting...'
                    : 'Delete'}
                onClick={params.onDeleteOpen}
                primary
                size='md'
                type='button'
                variant='danger'
            />,
        )
    }

    return actions.length > 0
        ? (
            <div className={styles.headerActions}>
                {actions}
            </div>
        )
        : undefined
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

interface RenderDeleteModalParams {
    canDeleteChallenge: boolean
    challengeName: string
    isDeleting: boolean
    onDeleteCancel: () => void
    onDeleteConfirmClick: () => void
    showDeleteModal: boolean
}

function renderDeleteModal(params: RenderDeleteModalParams): JSX.Element | undefined {
    if (!params.canDeleteChallenge || !params.showDeleteModal) {
        return undefined
    }

    return (
        <ConfirmationModal
            cancelText='Cancel'
            confirmButtonDanger
            confirmDisabled={params.isDeleting}
            confirmText={params.isDeleting
                ? 'Deleting...'
                : 'Delete'}
            message={`Do you want to delete "${params.challengeName}"?`}
            onCancel={params.onDeleteCancel}
            onConfirm={params.onDeleteConfirmClick}
            title='Confirm Delete'
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
                canLaunchChallenge={props.canLaunchChallenge}
                challenge={props.challenge}
                isLaunchDisabled={props.isLaunchDisabled}
                isEditMode={props.isEditMode}
                launchButtonLabel={props.launchButtonLabel}
                onChallengeStatusChange={props.onChallengeStatusChange}
                onLaunchOpen={props.onLaunchOpen}
                onRegisterLaunchAction={props.onRegisterLaunchAction}
                onSavingChange={props.onSavingChange}
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
            canLaunchChallenge={props.canLaunchChallenge}
            challenge={props.challenge}
            isLaunchDisabled={props.isLaunchDisabled}
            isEditMode={props.isEditMode}
            launchButtonLabel={props.launchButtonLabel}
            onChallengeStatusChange={props.onChallengeStatusChange}
            onLaunchOpen={props.onLaunchOpen}
            onRegisterLaunchAction={props.onRegisterLaunchAction}
            onSavingChange={props.onSavingChange}
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
                canLaunchChallenge={props.canLaunchChallenge}
                challenge={props.challengeResult.challenge}
                challengeId={props.challengeId}
                isLaunchDisabled={props.isLaunchDisabled}
                isEditMode={props.isEditMode}
                launchButtonLabel={props.launchButtonLabel}
                onChallengeStatusChange={props.onChallengeStatusChange}
                onLaunchOpen={props.onLaunchOpen}
                onRegisterLaunchAction={props.onRegisterLaunchAction}
                onSavingChange={props.onSavingChange}
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
    const [isSavingChallenge, setIsSavingChallenge] = useState<boolean>(false)
    const [launchAction, setLaunchAction] = useState<(() => Promise<void>) | undefined>()
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
    const [showLaunchModal, setShowLaunchModal] = useState<boolean>(false)
    const challengeResult: UseFetchChallengeResult = useFetchChallenge(challengeId)
    const [
        challengeStatus,
        handleChallengeStatusChange,
    ] = useResolvedChallengeStatus(
        challengeId,
        challengeResult.challenge?.status,
    )
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
    const challengesListPath = getChallengesListPath(projectId)

    useEffect(() => {
        if (isEditMode) {
            return
        }

        setActiveTab('details')
    }, [isEditMode])
    useEffect(() => {
        setIsSavingChallenge(false)
    }, [challengeId])

    const pageTitle = getChallengeEditorPageTitle(
        isEditMode,
        challengeResult.challenge?.name,
    )
    const headerChallenge = challengeResult.challenge
        ? {
            ...challengeResult.challenge,
            status: challengeStatus || challengeResult.challenge.status,
        }
        : undefined
    const canLaunchChallenge = shouldShowLaunchAction(
        isEditMode,
        activeTab,
        challengeStatus,
        !!launchAction,
    )
    const canCancelChallenge = shouldShowCancelAction(
        isEditMode,
        activeTab,
        challengeStatus,
    )
    const canDeleteChallenge = shouldShowDeleteAction(
        isEditMode,
        challengeStatus,
    )
    const canCompleteTask = shouldShowCompleteTaskAction(
        isEditMode,
        activeTab,
        headerChallenge,
    )
    const handleSavingChange = useCallback((isSaving: boolean): void => {
        setIsSavingChallenge(isSaving)
    }, [])
    const handleLaunchOpen = useCallback((): void => {
        if (isLaunching || isSavingChallenge) {
            return
        }

        setShowLaunchModal(true)
    }, [
        isLaunching,
        isSavingChallenge,
    ])
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
    const handleChallengeUpdated = useCallback((): void => {
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
        canCompleteTask,
        canDeleteChallenge,
        canLaunchChallenge,
        challenge: headerChallenge,
        challengeId,
        challengeName: launchChallengeName,
        isDeleting,
        isLaunching,
        isSaving: isSavingChallenge,
        onChallengeUpdated: handleChallengeUpdated,
        onDeleteOpen: handleDeleteOpen,
        onLaunchOpen: handleLaunchOpen,
    })
    const deleteModal = renderDeleteModal({
        canDeleteChallenge,
        challengeName: deleteChallengeName,
        isDeleting,
        onDeleteCancel: handleDeleteCancel,
        onDeleteConfirmClick: handleDeleteConfirmClick,
        showDeleteModal,
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
        challengeStatus,
        challengeQuickLinks,
    )
    const launchButtonLabel = isLaunching
        ? 'Launching...'
        : 'Launch'
    const isLaunchDisabled = isLaunching || isSavingChallenge

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
                        canLaunchChallenge={canLaunchChallenge}
                        challengeId={challengeId}
                        challengeResult={challengeResult}
                        isLaunchDisabled={isLaunchDisabled}
                        isEditMode={isEditMode}
                        launchButtonLabel={launchButtonLabel}
                        onChallengeStatusChange={handleChallengeStatusChange}
                        onLaunchOpen={handleLaunchOpen}
                        onDetailsTabClick={handleDetailsTabClick}
                        onRegisterLaunchAction={handleRegisterLaunchAction}
                        onResourcesTabClick={handleResourcesTabClick}
                        onRetry={handleRetry}
                        onSavingChange={handleSavingChange}
                        onSubmissionsTabClick={handleSubmissionsTabClick}
                        projectId={projectId}
                    />
                </div>
            </PageWrapper>
            {launchModal}
            {deleteModal}
        </>
    )
}

export default ChallengeEditorPage
