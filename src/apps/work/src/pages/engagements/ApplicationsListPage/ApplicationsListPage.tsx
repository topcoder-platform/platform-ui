/* eslint-disable complexity */
/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { Link, useParams } from 'react-router-dom'
import Select, { SingleValue } from 'react-select'

import { PageWrapper } from '~/apps/review/src/lib'
import {
    BaseModal,
    Button,
    IconSolid,
} from '~/libs/ui'

import {
    APPLICATION_STATUSES,
    PROFILE_URL,
} from '../../../lib/constants'
import {
    AcceptApplicationFormData,
    AcceptApplicationModal,
    ApplicationDetailModal,
    ErrorMessage,
    LoadingSpinner,
} from '../../../lib/components'
import {
    WorkAppContext,
} from '../../../lib/contexts'
import {
    useFetchApplications,
    useFetchEngagement,
} from '../../../lib/hooks'
import {
    Application,
    WorkAppContextModel,
} from '../../../lib/models'
import {
    approveApplication,
    updateApplicationStatus,
} from '../../../lib/services'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../lib/utils'

import styles from './ApplicationsListPage.module.scss'

interface SelectOption {
    label: string
    value: string
}

function getStatusOptions(): SelectOption[] {
    return [
        {
            label: 'All',
            value: 'all',
        },
        ...APPLICATION_STATUSES.map(status => ({
            label: status
                .toLowerCase()
                .replace(/_/g, ' ')
                .replace(/(^\w)|\s+(\w)/g, match => match.toUpperCase()),
            value: status,
        })),
    ]
}

function normalizeStatus(status: string): string {
    return status
        .toUpperCase()
        .trim()
}

function formatDate(value?: string): string {
    if (!value) {
        return '-'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function hasActiveAssignment(application: Application, assignments: unknown[]): boolean {
    return assignments.some(assignment => {
        if (!assignment || typeof assignment !== 'object') {
            return false
        }

        const typedAssignment = assignment as {
            memberHandle?: string
            memberId?: number | string
            status?: string
        }

        const normalizedStatus = normalizeStatus(String(typedAssignment.status || ''))
        if (normalizedStatus !== 'ACTIVE' && normalizedStatus !== 'ASSIGNED') {
            return false
        }

        if (typedAssignment.memberId !== undefined && String(typedAssignment.memberId) === String(application.userId)) {
            return true
        }

        return typedAssignment.memberHandle === application.handle
    })
}

export const ApplicationsListPage: FC = () => {
    const params: Readonly<{ engagementId?: string; projectId?: string }> = useParams<'engagementId' | 'projectId'>()

    const projectId = params.projectId || ''
    const engagementId = params.engagementId || ''

    const workAppContext = useContext(WorkAppContext)
    const contextValue = workAppContext as WorkAppContextModel

    const canManage = contextValue.isAdmin || contextValue.isManager

    const [activeApplication, setActiveApplication] = useState<Application | undefined>()
    const [acceptingApplication, setAcceptingApplication] = useState<Application | undefined>()
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [isStatusUpdating, setIsStatusUpdating] = useState<boolean>(false)
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)

    const engagementResult = useFetchEngagement(engagementId)
    const applicationsResult = useFetchApplications(
        engagementId,
        filterStatus === 'all' ? undefined : filterStatus,
    )

    const statusOptions = useMemo(() => getStatusOptions(), [])

    const selectedFilterOption = useMemo(
        () => statusOptions.find(option => option.value === filterStatus),
        [filterStatus, statusOptions],
    )

    const assignmentListCandidate = engagementResult.engagement?.assignments
    const assignmentList: unknown[] = Array.isArray(assignmentListCandidate)
        ? assignmentListCandidate
        : []

    const pageTitle = engagementResult.engagement?.title
        ? `${engagementResult.engagement.title} Applications`
        : 'Applications'

    const breadCrumb = useMemo(
        () => [
            {
                index: 1,
                label: 'Engagements',
            },
            {
                index: 2,
                label: 'Applications',
            },
        ],
        [],
    )

    const statusUpdateOptions = statusOptions.filter(option => option.value !== 'all')

    const handleStatusUpdate = useCallback(async (
        application: Application,
        nextStatus: string,
    ): Promise<void> => {
        if (nextStatus === 'SELECTED') {
            setAcceptingApplication(application)
            return
        }

        setIsStatusUpdating(true)

        try {
            await updateApplicationStatus(application.id, nextStatus)
            showSuccessToast('Application status updated successfully')
            await Promise.all([
                applicationsResult.mutate(),
                engagementResult.mutate(),
            ])
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to update application status'
            showErrorToast(message)
        } finally {
            setIsStatusUpdating(false)
        }
    }, [applicationsResult, engagementResult])

    const handleAcceptConfirm = useCallback(async (
        formData: AcceptApplicationFormData,
    ): Promise<void> => {
        if (!acceptingApplication) {
            return
        }

        setIsStatusUpdating(true)

        try {
            await approveApplication(acceptingApplication.id, formData)
            await Promise.all([
                applicationsResult.mutate(),
                engagementResult.mutate(),
            ])
            setAcceptingApplication(undefined)
            setShowSuccessModal(true)
            showSuccessToast('Application selected successfully')
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to select application'
            showErrorToast(message)
        } finally {
            setIsStatusUpdating(false)
        }
    }, [acceptingApplication, applicationsResult, engagementResult])

    if (engagementResult.isLoading || applicationsResult.isLoading) {
        return (
            <PageWrapper
                backUrl={`/projects/${projectId}/engagements`}
                breadCrumb={breadCrumb}
                pageTitle={pageTitle}
            >
                <LoadingSpinner />
            </PageWrapper>
        )
    }

    if (engagementResult.error || applicationsResult.error) {
        return (
            <PageWrapper
                backUrl={`/projects/${projectId}/engagements`}
                breadCrumb={breadCrumb}
                pageTitle={pageTitle}
            >
                <ErrorMessage
                    message={engagementResult.error?.message || applicationsResult.error?.message || 'Failed to load applications'}
                    onRetry={() => {
                        Promise.all([
                            applicationsResult.mutate(),
                            engagementResult.mutate(),
                        ])
                            .catch(() => undefined)
                    }}
                />
            </PageWrapper>
        )
    }

    return (
        <PageWrapper
            backUrl={`/projects/${projectId}/engagements`}
            breadCrumb={breadCrumb}
            pageTitle={pageTitle}
        >
            <div className={styles.container}>
                <div className={styles.meta}>
                    <span>{`Status: ${engagementResult.engagement?.status || '-'}`}</span>
                    <span>{`Anticipated Start: ${engagementResult.engagement?.anticipatedStart || '-'}`}</span>
                </div>

                <div className={styles.filters}>
                    <label htmlFor='applications-status-filter'>Status</label>
                    <Select
                        inputId='applications-status-filter'
                        className='react-select-container'
                        classNamePrefix='select'
                        options={statusOptions}
                        value={selectedFilterOption}
                        onChange={(nextOption: SingleValue<SelectOption>) => {
                            setFilterStatus(nextOption?.value || 'all')
                        }}
                        isClearable={false}
                    />
                </div>

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Active</th>
                                <th>Handle</th>
                                <th>Applicant Name</th>
                                <th>Email</th>
                                <th>Applied Date</th>
                                <th>Years of Experience</th>
                                <th>Availability</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applicationsResult.applications.length === 0
                                ? (
                                    <tr>
                                        <td className={styles.emptyRow} colSpan={9}>
                                            No applications found.
                                        </td>
                                    </tr>
                                )
                                : applicationsResult.applications.map(application => {
                                    const profileUrl = `${PROFILE_URL}/${application.handle}`
                                    const active = hasActiveAssignment(application, assignmentList)
                                    const selectedStatus = statusUpdateOptions.find(
                                        option => option.value === normalizeStatus(application.status),
                                    )

                                    return (
                                        <tr key={String(application.id)}>
                                            <td>
                                                {active
                                                    ? <IconSolid.CheckIcon className={styles.activeIcon} />
                                                    : '-'}
                                            </td>
                                            <td>
                                                <a
                                                    href={profileUrl}
                                                    rel='noreferrer noopener'
                                                    target='_blank'
                                                >
                                                    {application.handle || '-'}
                                                </a>
                                            </td>
                                            <td>{application.name || '-'}</td>
                                            <td>{application.email || '-'}</td>
                                            <td>{formatDate(application.createdAt)}</td>
                                            <td>{application.yearsOfExperience || '-'}</td>
                                            <td>{application.availability || '-'}</td>
                                            <td>
                                                <span className={styles.status}>{application.status}</span>
                                            </td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <Button
                                                        label='View Details'
                                                        onClick={() => setActiveApplication(application)}
                                                        secondary
                                                        size='sm'
                                                    />

                                                    {canManage
                                                        ? (
                                                            <Select
                                                                className={styles.statusSelect}
                                                                classNamePrefix='select'
                                                                isDisabled={isStatusUpdating}
                                                                options={statusUpdateOptions}
                                                                value={selectedStatus}
                                                                onChange={(
                                                                    nextOption: SingleValue<SelectOption>,
                                                                ) => {
                                                                    if (!nextOption) {
                                                                        return
                                                                    }

                                                                    handleStatusUpdate(application, nextOption.value)
                                                                        .catch(() => undefined)
                                                                }}
                                                            />
                                                        )
                                                        : undefined}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                </div>

                <Link className={styles.backLink} to={`/projects/${projectId}/engagements`}>
                    Back to engagements list
                </Link>
            </div>

            <ApplicationDetailModal
                application={activeApplication}
                onClose={() => setActiveApplication(undefined)}
                open={!!activeApplication}
            />

            <AcceptApplicationModal
                application={acceptingApplication}
                isSubmitting={isStatusUpdating}
                onCancel={() => setAcceptingApplication(undefined)}
                onConfirm={handleAcceptConfirm}
                open={!!acceptingApplication}
            />

            <BaseModal
                open={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title='Application Selected'
                size='md'
                buttons={(
                    <Button
                        label='Close'
                        onClick={() => setShowSuccessModal(false)}
                        primary
                    />
                )}
            >
                <p className={styles.successMessage}>
                    The application has been selected and the member has been notified.
                </p>
            </BaseModal>
        </PageWrapper>
    )
}

export default ApplicationsListPage
