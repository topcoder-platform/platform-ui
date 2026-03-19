/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
    MemberExperienceList,
} from '~/apps/engagements/src/components'
import {
    MemberExperience,
} from '~/apps/engagements/src/lib/models'
import { PageWrapper } from '~/apps/review/src/lib'

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
import {
    formatDate,
    normalizeAssignmentStatus,
} from '../../../lib/utils'

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

function getAssignmentUpdatedAt(assignment: unknown): string | undefined {
    if (!assignment || typeof assignment !== 'object') {
        return undefined
    }

    const updatedAt = (assignment as { updatedAt?: unknown }).updatedAt

    return typeof updatedAt === 'string'
        ? updatedAt
        : undefined
}

export const EngagementExperiencePage: FC = () => {
    const params: Readonly<{
        assignmentId?: string
        engagementId?: string
    }> = useParams<'assignmentId' | 'engagementId'>()
    const navigate = useNavigate()

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
    const assignmentHandle = selectedAssignment?.memberHandle || assignmentId
    const assignmentStatus = normalizeAssignmentStatus(String(selectedAssignment?.status || '')) || '-'
    const assignmentLastUpdated = formatDate(
        getAssignmentUpdatedAt(selectedAssignment)
            || engagementResult.engagement?.updatedAt
            || '',
    )
    const rightHeader = useMemo(
        () => (
            <div className={styles.headerMeta}>
                <div className={styles.headerMetaItem}>
                    <span className={styles.headerMetaLabel}>Status:</span>
                    <span>{assignmentStatus}</span>
                </div>
                <div className={styles.headerMetaItem}>
                    <span className={styles.headerMetaLabel}>Last updated:</span>
                    <span>{assignmentLastUpdated}</span>
                </div>
            </div>
        ),
        [assignmentLastUpdated, assignmentStatus],
    )

    const handleBackNavigation = useCallback(() => {
        navigate(-1)
    }, [navigate])

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
                backAction={handleBackNavigation}
                breadCrumb={breadCrumb}
                pageTitle={pageTitle}
                rightHeader={rightHeader}
            >
                <LoadingSpinner />
            </PageWrapper>
        )
    }

    if (engagementResult.error) {
        return (
            <PageWrapper
                backAction={handleBackNavigation}
                breadCrumb={breadCrumb}
                pageTitle={pageTitle}
                rightHeader={rightHeader}
            >
                <ErrorMessage message={engagementResult.error.message} />
            </PageWrapper>
        )
    }

    return (
        <PageWrapper
            backAction={handleBackNavigation}
            breadCrumb={breadCrumb}
            pageTitle={pageTitle}
            rightHeader={rightHeader}
        >
            <div className={styles.container}>
                <section className={styles.panel}>
                    <h3 className={styles.sectionTitle}>{`Member experience: ${assignmentHandle}`}</h3>
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
