/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useContext,
    useMemo,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { PageWrapper } from '~/apps/review/src/lib'
import { Button, IconOutline } from '~/libs/ui'

import { ENGAGEMENTS_APP_URL } from '../../../lib/constants'
import {
    ErrorMessage,
    LoadingSpinner,
} from '../../../lib/components'
import {
    rootRoute,
} from '../../../config/routes.config'
import {
    WorkAppContext,
} from '../../../lib/contexts'
import {
    useFetchEngagement,
    useFetchProject,
} from '../../../lib/hooks'
import {
    Engagement,
    WorkAppContextModel,
} from '../../../lib/models'
import {
    canCreateEngagement,
    canViewAllEngagements,
    formatAnticipatedStart,
    formatDate,
    formatDuration,
    formatEngagementStatus,
    formatLocation,
} from '../../../lib/utils'

import styles from './EngagementDetailsPage.module.scss'

const ROLE_LABELS: Record<string, string> = {
    DATA_ENGINEER: 'Data Engineer',
    DATA_SCIENTIST: 'Data Scientist',
    DESIGNER: 'Designer',
    SOFTWARE_DEVELOPER: 'Software Developer',
}

const ROLE_LEVEL_LABELS: Record<string, string> = {
    JUNIOR: 'Junior',
    MID: 'Mid',
    SENIOR: 'Senior',
}

const WORKLOAD_LABELS: Record<string, string> = {
    FRACTIONAL: 'Fractional',
    FULL_TIME: 'Full-Time',
}

function getErrorMessage(error: Error | undefined): string {
    if (!error) {
        return 'Unable to load engagement details.'
    }

    return error.message || 'Unable to load engagement details.'
}

function formatRole(role: string | undefined): string {
    if (!role) {
        return '-'
    }

    const normalized = String(role)
        .trim()
        .toUpperCase()

    return ROLE_LABELS[normalized] || role
}

function formatRoleLevel(roleLevel: string | undefined): string {
    if (!roleLevel) {
        return '-'
    }

    const normalized = String(roleLevel)
        .trim()
        .toUpperCase()

    return ROLE_LEVEL_LABELS[normalized] || roleLevel
}

function formatWorkload(workload: string | undefined): string {
    if (!workload) {
        return '-'
    }

    const normalized = String(workload)
        .trim()
        .toUpperCase()

    return WORKLOAD_LABELS[normalized] || workload
}

function getExternalEngagementViewUrl(engagement: Engagement): string {
    return `${ENGAGEMENTS_APP_URL}/${engagement.id}`
}

function renderDetailField(label: string, value: string): JSX.Element {
    return (
        <div className={styles.field}>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value || '-'}</span>
        </div>
    )
}

export const EngagementDetailsPage: FC = () => {
    const navigate = useNavigate()
    const params: Readonly<{ engagementId?: string; projectId?: string }> = useParams<'engagementId' | 'projectId'>()

    const projectId = params.projectId || ''
    const engagementId = params.engagementId

    const workAppContext = useContext(WorkAppContext)
    const contextValue = workAppContext as WorkAppContextModel
    const canView = canViewAllEngagements(contextValue.userRoles)
    const canEdit = canCreateEngagement(contextValue.userRoles)

    const engagementResult = useFetchEngagement(canView ? engagementId : undefined)
    const projectResult = useFetchProject(canView ? projectId || undefined : undefined)

    const engagement = engagementResult.engagement
    const backUrl = `${rootRoute}/engagements`
    const pageTitle = engagement?.title || 'Engagement Details'
    const editPath = `${rootRoute}/projects/${projectId}/engagements/${engagement?.id || engagementId}/edit`

    const projectName = useMemo(() => (
        engagement?.projectName
        || engagement?.project?.name
        || projectResult.project?.name
        || (projectId ? `Project ${projectId}` : '-')
    ), [
        engagement?.project?.name,
        engagement?.projectName,
        projectId,
        projectResult.project?.name,
    ])

    const skillNames = useMemo(() => (
        (engagement?.skills || [])
            .map(skill => skill?.name)
            .filter((name): name is string => !!name)
    ), [engagement?.skills])

    const assignedMembers = useMemo(() => (
        (engagement?.assignedMemberHandles || [])
            .map(handle => String(handle || '')
                .trim())
            .filter(Boolean)
    ), [engagement?.assignedMemberHandles])

    return (
        <PageWrapper
            backUrl={backUrl}
            breadCrumb={[]}
            pageTitle={pageTitle}
        >
            <div className={styles.container}>
                {!canView
                    ? <ErrorMessage message='You need Admin or Talent Manager role to view engagements.' />
                    : undefined}

                {canView && engagementResult.isLoading
                    ? <LoadingSpinner />
                    : undefined}

                {canView && !engagementResult.isLoading && engagementResult.isError
                    ? (
                        <ErrorMessage
                            message={getErrorMessage(engagementResult.error)}
                            onRetry={() => {
                                engagementResult.mutate()
                                    .catch(() => undefined)
                            }}
                        />
                    )
                    : undefined}

                {canView
                    && !engagementResult.isLoading
                    && !engagementResult.isError
                    && engagement
                    ? (
                        <>
                            <div className={styles.headerActions}>
                                {canEdit
                                    ? (
                                        <Button
                                            label='Edit'
                                            onClick={() => navigate(editPath)}
                                            primary
                                            size='md'
                                        />
                                    )
                                    : undefined}
                                <a
                                    className={styles.externalActionLink}
                                    href={getExternalEngagementViewUrl(engagement)}
                                    rel='noreferrer noopener'
                                    target='_blank'
                                >
                                    View Post
                                    <IconOutline.ExternalLinkIcon
                                        aria-hidden='true'
                                        className={styles.externalIcon}
                                    />
                                </a>
                                <Link
                                    className={styles.actionLink}
                                    to={`${rootRoute}/projects/${projectId}/engagements/${engagement.id}/applications`}
                                >
                                    Applications
                                </Link>
                                <Link
                                    className={styles.actionLink}
                                    to={`${rootRoute}/projects/${projectId}/engagements/${engagement.id}/assignments`}
                                >
                                    Assignments
                                </Link>
                            </div>

                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Basic Information</h3>
                                <div className={styles.metaGrid}>
                                    {renderDetailField('Title', engagement.title || '-')}
                                    {renderDetailField('Status', formatEngagementStatus(engagement.status))}
                                    {renderDetailField(
                                        'Visibility',
                                        engagement.isPrivate ? 'Private' : 'Public',
                                    )}
                                    {renderDetailField('Duration', formatDuration(engagement))}
                                    {renderDetailField('Role', formatRole(engagement.role))}
                                    {renderDetailField('Workload', formatWorkload(engagement.workload))}
                                    {renderDetailField(
                                        'Compensation range',
                                        engagement.compensationRange || '-',
                                    )}
                                </div>
                            </section>

                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Description</h3>
                                {engagement.description
                                    ? (
                                        <div
                                            className={styles.description}
                                            // eslint-disable-next-line react/no-danger
                                            dangerouslySetInnerHTML={{
                                                __html: engagement.description,
                                            }}
                                        />
                                    )
                                    : <span className={styles.value}>-</span>}
                            </section>

                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Details</h3>
                                <div className={styles.metaGrid}>
                                    {renderDetailField(
                                        'Anticipated Start',
                                        formatAnticipatedStart(engagement.anticipatedStart),
                                    )}
                                    {renderDetailField('Parent Project', projectName)}
                                    {renderDetailField(
                                        'Required Members',
                                        engagement.requiredMemberCount
                                            ? String(engagement.requiredMemberCount)
                                            : '-',
                                    )}
                                    {renderDetailField('Location', formatLocation(engagement))}
                                </div>

                                <div className={styles.field}>
                                    <span className={styles.skillslabel}>Skills</span>
                                    {skillNames.length > 0
                                        ? (
                                            <div className={styles.skills}>
                                                {skillNames.map(skillName => (
                                                    <span
                                                        className={styles.skillChip}
                                                        key={skillName}
                                                    >
                                                        {skillName}
                                                    </span>
                                                ))}
                                            </div>
                                        )
                                        : <span className={styles.value}>-</span>}
                                </div>
                            </section>

                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Internal Account Details</h3>
                                <div className={styles.metaGrid}>
                                    {renderDetailField(
                                        'Received Date from Account',
                                        formatDate(engagement.receivedDateFromAccount),
                                    )}
                                    {renderDetailField('Account', engagement.account || '-')}
                                    {renderDetailField('SMU', engagement.smu || '-')}
                                    {renderDetailField('SPOC', engagement.spoc || '-')}
                                    {renderDetailField(
                                        'Role Level',
                                        formatRoleLevel(engagement.roleLevel),
                                    )}
                                </div>
                            </section>

                            {engagement.isPrivate
                                ? (
                                    <section className={styles.section}>
                                        <h3 className={styles.sectionTitle}>Assigned Members</h3>
                                        {assignedMembers.length > 0
                                            ? (
                                                <div className={styles.membersList}>
                                                    {assignedMembers.map(memberHandle => (
                                                        <div
                                                            className={styles.memberValue}
                                                            key={memberHandle}
                                                        >
                                                            {memberHandle}
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                            : <span className={styles.value}>-</span>}
                                    </section>
                                )
                                : undefined}
                        </>
                    )
                    : undefined}
            </div>
        </PageWrapper>
    )
}

export default EngagementDetailsPage
