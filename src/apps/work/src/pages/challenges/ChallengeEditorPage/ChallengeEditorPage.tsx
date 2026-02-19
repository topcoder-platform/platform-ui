import {
    FC,
    useCallback,
    useEffect,
    useState,
} from 'react'
import { useParams } from 'react-router-dom'

import { PageWrapper } from '~/apps/review/src/lib'

import {
    ErrorMessage,
    LoadingSpinner,
} from '../../../lib/components'
import {
    useFetchChallenge,
    UseFetchChallengeResult,
} from '../../../lib/hooks'

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
            projectId={props.projectId}
        />
    )
}

export const ChallengeEditorPage: FC = () => {
    const params: Readonly<{ challengeId?: string; projectId?: string }>
        = useParams<'challengeId' | 'projectId'>()
    const challengeId = params.challengeId
    const routeProjectId = params.projectId

    const isEditMode = !!challengeId
    const [activeTab, setActiveTab] = useState<EditorTab>('details')
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
    return (
        <PageWrapper
            backUrl={challengesListPath}
            breadCrumb={[]}
            pageTitle={pageTitle}
        >
            <div className={styles.container}>
                {challengeResult.isLoading
                    ? <LoadingSpinner />
                    : undefined}

                {!challengeResult.isLoading && challengeResult.isError
                    ? (
                        <ErrorMessage
                            message={getErrorMessage(challengeResult.error)}
                            onRetry={handleRetry}
                        />
                    )
                    : undefined}

                {!challengeResult.isLoading && !challengeResult.isError
                    ? (
                        <>
                            {isEditMode
                                ? (
                                    <EditorTabs
                                        activeTab={activeTab}
                                        onDetailsTabClick={handleDetailsTabClick}
                                        onResourcesTabClick={handleResourcesTabClick}
                                        onSubmissionsTabClick={handleSubmissionsTabClick}
                                    />
                                )
                                : undefined}
                            <ChallengeEditorContent
                                activeTab={activeTab}
                                challenge={challengeResult.challenge}
                                challengeId={challengeId}
                                isEditMode={isEditMode}
                                projectId={projectId}
                            />
                        </>
                    )
                    : undefined}
            </div>
        </PageWrapper>
    )
}

export default ChallengeEditorPage
