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
import { useParams } from 'react-router-dom'
import Select, {
    SingleValue,
    StylesConfig,
} from 'react-select'
import classNames from 'classnames'

import { PageWrapper } from '~/apps/review/src/lib'
import {
    BaseModal,
    Button,
    IconOutline,
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
    formatAnticipatedStart,
    formatEngagementStatus,
    getEngagementStatusPillVariant,
    showErrorToast,
    showSuccessToast,
} from '../../../lib/utils'

import styles from './ApplicationsListPage.module.scss'

const CAPACITY_ERROR_MODAL_MESSAGE = 'The required number of members are already assigned to this engagement. '
    + 'If you\'d like to add another member, change the required number of members on the engagement first.'

interface SelectOption {
    label: string
    value: string
}

function toLabel(value: string): string {
    return value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/(^\w)|\s+(\w)/g, match => match.toUpperCase())
}

function getStatusOptions(): SelectOption[] {
    return [
        {
            label: 'All',
            value: 'all',
        },
        ...APPLICATION_STATUSES.map(status => ({
            label: toLabel(status),
            value: status,
        })),
    ]
}

function normalizeStatus(status: string): string {
    return status
        .toUpperCase()
        .trim()
        .replace(/[\s-]+/g, '_')
}

function formatApplicationStatus(value?: string): string {
    const normalized = normalizeStatus(String(value || ''))
    if (!normalized) {
        return '-'
    }

    return toLabel(normalized)
}

function getApplicationStatusPillClass(status: string): string {
    const normalizedStatus = normalizeStatus(status)
    if (normalizedStatus === 'SELECTED') {
        return styles.statusGreen
    }

    if (normalizedStatus === 'UNDER_REVIEW') {
        return styles.statusYellow
    }

    if (normalizedStatus === 'REJECTED') {
        return styles.statusRed
    }

    return styles.statusGray
}

function getEngagementStatusPillClass(status: string): string {
    const pillVariant = getEngagementStatusPillVariant(status)

    if (pillVariant === 'green') {
        return styles.statusGreen
    }

    if (pillVariant === 'yellow') {
        return styles.statusYellow
    }

    if (pillVariant === 'blue') {
        return styles.statusBlue
    }

    if (pillVariant === 'red') {
        return styles.statusRed
    }

    return styles.statusGray
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
    const [showCapacityErrorModal, setShowCapacityErrorModal] = useState<boolean>(false)
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)

    const engagementResult = useFetchEngagement(engagementId)
    const applicationsResult = useFetchApplications(
        engagementId,
        filterStatus === 'all' ? undefined : filterStatus,
    )

    const statusOptions = useMemo(() => getStatusOptions(), [])
    const menuPortalTarget = useMemo(
        () => (typeof document === 'undefined' ? undefined : document.body),
        [],
    )
    const selectStyles = useMemo<StylesConfig<SelectOption, false>>(
        () => ({
            menu: provided => ({
                ...provided,
                zIndex: 9999,
            }),
            menuPortal: provided => ({
                ...provided,
                zIndex: 9999,
            }),
        }),
        [],
    )

    const selectedFilterOption = useMemo(
        () => statusOptions.find(option => option.value === filterStatus),
        [filterStatus, statusOptions],
    )
    const filteredApplications = useMemo(
        () => applicationsResult.applications.filter(application => (
            filterStatus === 'all'
            || normalizeStatus(application.status) === normalizeStatus(filterStatus)
        )),
        [applicationsResult.applications, filterStatus],
    )

    const assignmentListCandidate = engagementResult.engagement?.assignments
    const assignmentList = useMemo<unknown[]>(
        () => (Array.isArray(assignmentListCandidate)
            ? assignmentListCandidate
            : []),
        [assignmentListCandidate],
    )
    const countableAssignments = useMemo<Array<{
        memberId?: number | string
        status?: string
    }>>(
        () => assignmentList.reduce<Array<{
            memberId?: number | string
            status?: string
        }>>((result, assignment) => {
            if (!assignment || typeof assignment !== 'object') {
                return result
            }

            const typedAssignment = assignment as {
                memberId?: number | string
                status?: string
            }
            const normalizedStatus = normalizeStatus(String(typedAssignment.status || ''))

            if (
                normalizedStatus === 'COMPLETED'
                || normalizedStatus === 'OFFER_REJECTED'
                || normalizedStatus === 'TERMINATED'
            ) {
                return result
            }

            result.push(typedAssignment)

            return result
        }, []),
        [assignmentList],
    )
    const countableAssignmentMemberIds = useMemo(
        () => new Set(
            countableAssignments
                .map(assignment => assignment.memberId)
                .filter(memberId => memberId !== undefined && memberId !== '')
                .map(memberId => String(memberId)),
        ),
        [countableAssignments],
    )
    const assignedMemberCount = useMemo(
        () => {
            if (countableAssignments.length > 0) {
                return countableAssignments.length
            }

            const assignedMemberHandles = Array.isArray(engagementResult.engagement?.assignedMemberHandles)
                ? (engagementResult.engagement?.assignedMemberHandles?.filter(Boolean) || [])
                : []

            return assignedMemberHandles.length
        },
        [countableAssignments, engagementResult.engagement?.assignedMemberHandles],
    )
    const requiredMemberCount = Number(engagementResult.engagement?.requiredMemberCount)
    const hasRequiredMemberCount = Number.isInteger(requiredMemberCount) && requiredMemberCount > 0

    const pageTitle = engagementResult.engagement?.title
        ? `${engagementResult.engagement.title} Applications`
        : 'Applications'

    const statusUpdateOptions = statusOptions.filter(option => option.value !== 'all')
    const engagementStatusText = formatEngagementStatus(engagementResult.engagement?.status || '')
    const anticipatedStartText = formatAnticipatedStart(engagementResult.engagement?.anticipatedStart || '')
    const rightHeader = (
        <div className={styles.headerMeta}>
            <div className={styles.headerMetaItem}>
                <span className={styles.headerMetaLabel}>Status:</span>
                <span
                    className={classNames(
                        styles.statusPill,
                        getEngagementStatusPillClass(engagementStatusText),
                    )}
                >
                    {engagementStatusText}
                </span>
            </div>
            <div className={styles.headerMetaItem}>
                <span className={styles.headerMetaLabel}>Anticipated Start:</span>
                <span>{anticipatedStartText}</span>
            </div>
        </div>
    )

    const handleStatusUpdate = useCallback(async (
        application: Application,
        nextStatus: string,
    ): Promise<void> => {
        if (nextStatus === 'SELECTED') {
            const isExistingAssignedMember = application.userId !== undefined
                && application.userId !== ''
                && countableAssignmentMemberIds.has(String(application.userId))
            const isAtCapacity = hasRequiredMemberCount && assignedMemberCount >= requiredMemberCount

            if (isAtCapacity && !isExistingAssignedMember) {
                setShowCapacityErrorModal(true)
                return
            }

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
    }, [
        applicationsResult,
        assignedMemberCount,
        countableAssignmentMemberIds,
        engagementResult,
        hasRequiredMemberCount,
        requiredMemberCount,
    ])

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
                breadCrumb={[]}
                pageTitle={pageTitle}
                rightHeader={rightHeader}
            >
                <LoadingSpinner />
            </PageWrapper>
        )
    }

    if (engagementResult.error || applicationsResult.error) {
        return (
            <PageWrapper
                backUrl={`/projects/${projectId}/engagements`}
                breadCrumb={[]}
                pageTitle={pageTitle}
                rightHeader={rightHeader}
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
            breadCrumb={[]}
            pageTitle={pageTitle}
            rightHeader={rightHeader}
        >
            <div className={styles.container}>
                <div className={styles.filters}>
                    <label htmlFor='applications-status-filter'>Status</label>
                    <Select
                        inputId='applications-status-filter'
                        className='react-select-container'
                        classNamePrefix='select'
                        menuPortalTarget={menuPortalTarget}
                        menuPosition='fixed'
                        options={statusOptions}
                        styles={selectStyles}
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
                                <th>Phone Number</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApplications.length === 0
                                ? (
                                    <tr>
                                        <td className={styles.emptyRow} colSpan={9}>
                                            No applications found.
                                        </td>
                                    </tr>
                                )
                                : filteredApplications.map(application => {
                                    const profileUrl = `${PROFILE_URL}/${application.handle}`
                                    const active = hasActiveAssignment(application, assignmentList)
                                    const normalizedStatus = normalizeStatus(application.status)
                                    const statusLabel = formatApplicationStatus(application.status)
                                    const selectedStatus = statusUpdateOptions.find(
                                        option => option.value === normalizedStatus,
                                    )

                                    return (
                                        <tr key={String(application.id)}>
                                            <td>
                                                {active
                                                    ? <IconOutline.CheckCircleIcon className={styles.activeIcon} />
                                                    : '-'}
                                            </td>
                                            <td>
                                                <a
                                                    className={styles.profileLink}
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
                                            <td>{application.yearsOfExperience ?? '-'}</td>
                                            <td>{application.mobileNumber || '-'}</td>
                                            <td>
                                                <span
                                                    className={classNames(
                                                        styles.statusPill,
                                                        getApplicationStatusPillClass(normalizedStatus),
                                                    )}
                                                >
                                                    {statusLabel}
                                                </span>
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
                                                                menuPortalTarget={menuPortalTarget}
                                                                menuPosition='fixed'
                                                                options={statusUpdateOptions}
                                                                styles={selectStyles}
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
                open={showCapacityErrorModal}
                onClose={() => setShowCapacityErrorModal(false)}
                title='Cannot Select Applicant'
                size='md'
                buttons={(
                    <Button
                        label='Close'
                        onClick={() => setShowCapacityErrorModal(false)}
                        primary
                    />
                )}
            >
                <p className={styles.successMessage}>
                    {CAPACITY_ERROR_MODAL_MESSAGE}
                </p>
            </BaseModal>

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
