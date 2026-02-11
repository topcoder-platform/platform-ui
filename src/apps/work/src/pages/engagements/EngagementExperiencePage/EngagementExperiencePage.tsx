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
    MemberExperienceList,
} from '~/apps/engagements/src/components'
import {
    MemberExperience,
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
    fetchMemberExperiences,
    MemberExperience as WorkMemberExperience,
} from '../../../lib/services'

import styles from './EngagementExperiencePage.module.scss'

function toMemberExperience(
    assignmentId: string,
    item: WorkMemberExperience,
): MemberExperience {
    return {
        createdAt: item.createdAt,
        engagementAssignmentId: assignmentId,
        experienceText: item.experienceText,
        id: String(item.id),
        memberHandle: item.memberHandle,
        memberId: item.memberId
            ? String(item.memberId)
            : undefined,
        updatedAt: item.updatedAt,
    }
}

export const EngagementExperiencePage: FC = () => {
    const params: Readonly<{
        assignmentId?: string
        engagementId?: string
        projectId?: string
    }> = useParams<'assignmentId' | 'engagementId' | 'projectId'>()

    const projectId = params.projectId || ''
    const engagementId = params.engagementId || ''
    const assignmentId = params.assignmentId || ''

    const engagementResult = useFetchEngagement(engagementId)

    const [error, setError] = useState<string>('')
    const [experiences, setExperiences] = useState<MemberExperience[]>([])
    const [loading, setLoading] = useState<boolean>(false)

    const selectedAssignment = useMemo(
        () => engagementResult.engagement?.assignments.find(
            assignment => String(assignment.id) === assignmentId,
        ),
        [assignmentId, engagementResult.engagement?.assignments],
    )

    const loadExperiences = useCallback(async (): Promise<void> => {
        if (!engagementId || !assignmentId) {
            setExperiences([])
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await fetchMemberExperiences(engagementId, assignmentId)
            setExperiences(response.map(item => toMemberExperience(assignmentId, item)))
        } catch (loadError) {
            const message = loadError instanceof Error
                ? loadError.message
                : 'Failed to load experiences'
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [assignmentId, engagementId])

    useEffect(() => {
        loadExperiences()
            .catch(() => undefined)
    }, [loadExperiences])

    const pageTitle = engagementResult.engagement?.title
        ? `${engagementResult.engagement.title} Experience`
        : 'Experience'

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
                label: 'Experience',
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
                    <h3 className={styles.sectionTitle}>Member Experience</h3>
                    <MemberExperienceList
                        error={error || undefined}
                        experiences={experiences}
                        loading={loading}
                        onRetry={() => {
                            loadExperiences()
                                .catch(() => undefined)
                        }}
                    />
                </section>
            </div>
        </PageWrapper>
    )
}

export default EngagementExperiencePage
