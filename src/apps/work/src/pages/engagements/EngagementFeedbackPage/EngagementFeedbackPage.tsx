/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { Link, useParams } from 'react-router-dom'

import {
    FeedbackForm,
    FeedbackList,
} from '~/apps/engagements/src/components'
import {
    CreateFeedbackRequest,
    Feedback,
} from '~/apps/engagements/src/lib/models'
import { PageWrapper } from '~/apps/review/src/lib'
import { Button } from '~/libs/ui'

import {
    ErrorMessage,
    LoadingSpinner,
} from '../../../lib/components'
import {
    useFetchEngagement,
} from '../../../lib/hooks'
import {
    createEngagementFeedback,
    EngagementFeedback,
    fetchEngagementFeedback,
} from '../../../lib/services'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../lib/utils'

import styles from './EngagementFeedbackPage.module.scss'

function toFeedback(
    engagementId: string,
    item: EngagementFeedback,
): Feedback {
    return {
        createdAt: item.createdAt,
        engagementId,
        feedbackText: item.feedbackText,
        givenByEmail: item.givenByEmail || (undefined as unknown as null),
        givenByHandle: item.givenByHandle || (undefined as unknown as null),
        givenByMemberId: undefined as unknown as null,
        id: String(item.id),
        rating: item.rating,
        updatedAt: item.updatedAt,
    }
}

export const EngagementFeedbackPage: FC = () => {
    const params: Readonly<{
        assignmentId?: string
        engagementId?: string
        projectId?: string
    }> = useParams<'assignmentId' | 'engagementId' | 'projectId'>()

    const projectId = params.projectId || ''
    const engagementId = params.engagementId || ''
    const assignmentId = params.assignmentId || ''

    const engagementResult = useFetchEngagement(engagementId)

    const [feedback, setFeedback] = useState<Feedback[]>([])
    const [feedbackError, setFeedbackError] = useState<string>('')
    const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false)

    const selectedAssignment = useMemo(
        () => engagementResult.engagement?.assignments.find(
            assignment => String(assignment.id) === assignmentId,
        ),
        [assignmentId, engagementResult.engagement?.assignments],
    )

    const loadFeedback = useCallback(async (): Promise<void> => {
        if (!engagementId || !assignmentId) {
            setFeedback([])
            return
        }

        setIsLoadingFeedback(true)
        setFeedbackError('')

        try {
            const response = await fetchEngagementFeedback(engagementId, assignmentId)
            setFeedback(response.map(item => toFeedback(engagementId, item)))
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to load feedback'
            setFeedbackError(message)
        } finally {
            setIsLoadingFeedback(false)
        }
    }, [assignmentId, engagementId])

    useEffect(() => {
        loadFeedback()
            .catch(() => undefined)
    }, [loadFeedback])

    const handleCreateFeedback = useCallback(async (
        data: CreateFeedbackRequest,
    ): Promise<void> => {
        try {
            await createEngagementFeedback(engagementId, assignmentId, {
                feedbackText: data.feedbackText,
                rating: data.rating,
            })
            showSuccessToast('Feedback created successfully')
            await loadFeedback()
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to create feedback'
            showErrorToast(message)
        }
    }, [assignmentId, engagementId, loadFeedback])

    const pageTitle = engagementResult.engagement?.title
        ? `${engagementResult.engagement.title} Feedback`
        : 'Feedback'

    const breadCrumb = useMemo(
        () => [
            {
                index: 1,
                label: 'Engagements',
            },
            {
                index: 2,
                label: 'Assignments',
            },
            {
                index: 3,
                label: 'Feedback',
            },
        ],
        [],
    )

    if (engagementResult.isLoading) {
        return (
            <PageWrapper
                backUrl={`/projects/${projectId}/engagements/${engagementId}/assignments`}
                breadCrumb={breadCrumb}
                pageTitle={pageTitle}
            >
                <LoadingSpinner />
            </PageWrapper>
        )
    }

    if (engagementResult.error) {
        return (
            <PageWrapper
                backUrl={`/projects/${projectId}/engagements/${engagementId}/assignments`}
                breadCrumb={breadCrumb}
                pageTitle={pageTitle}
            >
                <ErrorMessage message={engagementResult.error.message} />
            </PageWrapper>
        )
    }

    return (
        <PageWrapper
            backUrl={`/projects/${projectId}/engagements/${engagementId}/assignments`}
            breadCrumb={breadCrumb}
            pageTitle={pageTitle}
        >
            <div className={styles.container}>
                <div className={styles.meta}>
                    <span>{`Assignment: ${selectedAssignment?.memberHandle || assignmentId}`}</span>
                    <Link to={`/projects/${projectId}/engagements/${engagementId}/assignments`}>
                        <Button
                            label='Back to payment page'
                            secondary
                            size='md'
                        />
                    </Link>
                </div>

                <section className={styles.panel}>
                    <h3 className={styles.sectionTitle}>Create Feedback</h3>
                    <FeedbackForm onSubmit={handleCreateFeedback} />
                </section>

                <section className={styles.panel}>
                    <h3 className={styles.sectionTitle}>Existing Feedback</h3>
                    {feedbackError
                        ? (
                            <ErrorMessage
                                message={feedbackError}
                                onRetry={() => {
                                    loadFeedback()
                                        .catch(() => undefined)
                                }}
                            />
                        )
                        : (
                            <FeedbackList
                                error={feedbackError || undefined}
                                feedback={feedback}
                                loading={isLoadingFeedback}
                                onRetry={() => {
                                    loadFeedback()
                                        .catch(() => undefined)
                                }}
                            />
                        )}
                </section>
            </div>
        </PageWrapper>
    )
}

export default EngagementFeedbackPage
