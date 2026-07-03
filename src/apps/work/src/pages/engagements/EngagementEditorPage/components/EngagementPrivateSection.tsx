/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useFormContext,
} from 'react-hook-form'
import { Link } from 'react-router-dom'

import {
    FormCheckboxField,
    FormUserAutocomplete,
} from '../../../../lib/components/form'
import {
    formatAssignmentCurrency,
    getAssignmentPaymentCycle,
    getAssignmentStandardHoursPerDay,
} from '../../../../lib/utils'

import {
    AssignmentDetailsFormValue,
    AssignmentDetailsModal,
} from './AssignmentDetailsModal'
import styles from './EngagementPrivateSection.module.scss'

interface EngagementPrivateSectionForm {
    assignedMemberHandles: string[]
    assignmentDetails: AssignmentDetailsFormValue[]
    isPrivate: boolean
    requiredMemberCount?: number | string
}

interface EngagementPrivateSectionProps {
    assignmentManagementPath?: string
    lockedAssignedMemberHandles?: string[]
}

function toNumber(value: unknown): number {
    const parsed = Number(value)

    if (!Number.isFinite(parsed) || parsed < 1) {
        return 0
    }

    return Math.floor(parsed)
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

function formatDurationMonths(value?: string): string {
    if (!value) {
        return '-'
    }

    const parsedValue = Number(value)

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        return value
    }

    return `${parsedValue} month${parsedValue === 1 ? '' : 's'}`
}

function getAssignmentLabel(index: number, count: number): string {
    return count > 1
        ? `Assign to Member ${index + 1}`
        : 'Assign to Member'
}

/**
 * Normalizes persisted assignment handles before comparing them against form slots.
 *
 * @param handles member handles from existing active assignment rows.
 * @returns trimmed member handles, preserving slot order.
 */
function normalizeLockedAssignedMemberHandles(
    handles: string[] | undefined,
): string[] {
    return Array.isArray(handles)
        ? handles.map(handle => String(handle || '')
            .trim())
            .filter(Boolean)
        : []
}

/**
 * Creates an empty assignment-details value for form slots that no longer map
 * to the currently selected member handle.
 *
 * @returns empty assignment-details form value.
 */
function createEmptyAssignmentDetails(): AssignmentDetailsFormValue {
    return {
        agreementRate: '',
        durationMonths: '',
        memberHandle: '',
        otherRemarks: undefined,
        paymentCycle: 'WEEKLY',
        ratePerHour: '',
        standardHoursPerDay: '',
        standardHoursPerWeek: '',
        startDate: '',
    }
}

export const EngagementPrivateSection: FC<EngagementPrivateSectionProps> = (
    props: EngagementPrivateSectionProps,
) => {
    const formContext = useFormContext<EngagementPrivateSectionForm>()

    const [activeAssignmentIndex, setActiveAssignmentIndex] = useState<number | undefined>()

    const isPrivate = formContext.watch('isPrivate') === true
    const requiredMemberCount = toNumber(formContext.watch('requiredMemberCount'))
    const lockedAssignedMemberHandles = useMemo(
        () => normalizeLockedAssignedMemberHandles(props.lockedAssignedMemberHandles),
        [props.lockedAssignedMemberHandles],
    )
    const lockedAssignmentCount = lockedAssignedMemberHandles.length
    const hasLockedAssignments = lockedAssignmentCount > 0

    const assignedMemberHandles = formContext.watch('assignedMemberHandles') || []
    const assignmentDetails = formContext.watch('assignmentDetails') || []
    const assignedMemberHandlesError = (
        formContext.formState.errors.assignedMemberHandles as { message?: string } | undefined
    )?.message
    const assignmentDetailsError = (
        formContext.formState.errors.assignmentDetails as { message?: string } | undefined
    )?.message

    const assignmentIndices = useMemo(
        () => Array.from(
            { length: Math.max(requiredMemberCount, lockedAssignmentCount) },
            (_, index) => index,
        ),
        [lockedAssignmentCount, requiredMemberCount],
    )

    useEffect(() => {
        if (activeAssignmentIndex === undefined) {
            return
        }

        if (
            requiredMemberCount < 1
            || activeAssignmentIndex >= Math.max(requiredMemberCount, lockedAssignmentCount)
            || lockedAssignedMemberHandles[activeAssignmentIndex]
        ) {
            setActiveAssignmentIndex(undefined)
        }
    }, [
        activeAssignmentIndex,
        lockedAssignedMemberHandles,
        lockedAssignmentCount,
        requiredMemberCount,
    ])

    const activeMemberHandle = activeAssignmentIndex !== undefined
        ? assignedMemberHandles[activeAssignmentIndex]
        : undefined

    const activeAssignmentDetails = activeAssignmentIndex !== undefined
        ? assignmentDetails[activeAssignmentIndex]
        : undefined

    const normalizedActiveAssignmentDetails = (
        activeAssignmentDetails
        && activeMemberHandle
        && activeAssignmentDetails.memberHandle === activeMemberHandle
    )
        ? activeAssignmentDetails
        : undefined

    return (
        <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Private</h3>

            <FormCheckboxField
                disabled={hasLockedAssignments}
                label='Private engagement'
                name='isPrivate'
            />

            {isPrivate
                ? (
                    <>
                        {assignmentIndices.length > 0
                            ? (
                                <>
                                    <div className={styles.assignmentList}>
                                        {assignmentIndices.map(index => {
                                            const lockedMemberHandle = lockedAssignedMemberHandles[index]
                                            const isLockedAssignment = !!lockedMemberHandle
                                            const memberHandle = lockedMemberHandle || assignedMemberHandles[index]
                                            const nextAssignmentDetail = assignmentDetails[index]
                                            const assignmentDetail = (
                                                nextAssignmentDetail
                                                && memberHandle
                                                && nextAssignmentDetail.memberHandle === memberHandle
                                            )
                                                ? nextAssignmentDetail
                                                : undefined

                                            return (
                                                <div key={`assignment-row-${index}`} className={styles.assignmentRow}>
                                                    <div className={styles.assignmentInput}>
                                                        {isLockedAssignment
                                                            ? (
                                                                <div className={styles.readOnlyAssignment}>
                                                                    <span className={styles.readOnlyLabel}>
                                                                        {getAssignmentLabel(index, assignmentIndices.length)}
                                                                    </span>
                                                                    <span className={styles.readOnlyValue}>
                                                                        {lockedMemberHandle}
                                                                    </span>
                                                                </div>
                                                            )
                                                            : (
                                                                <FormUserAutocomplete
                                                                    label={getAssignmentLabel(index, assignmentIndices.length)}
                                                                    name={`assignedMemberHandles.${index}`}
                                                                    onValueChange={value => {
                                                                        if (value === memberHandle) {
                                                                            return
                                                                        }

                                                                        const nextAssignmentDetails = [...assignmentDetails]
                                                                        nextAssignmentDetails[index] = createEmptyAssignmentDetails()

                                                                        formContext.setValue('assignmentDetails', nextAssignmentDetails, {
                                                                            shouldDirty: true,
                                                                            shouldValidate: true,
                                                                        })

                                                                        if (!value) {
                                                                            return
                                                                        }

                                                                        setActiveAssignmentIndex(index)
                                                                    }}
                                                                    placeholder='Search user handle'
                                                                    valueField='handle'
                                                                />
                                                            )}
                                                    </div>

                                                    <div className={styles.assignmentActions}>
                                                        {assignmentDetail
                                                            ? (
                                                                <div className={styles.detailsText}>
                                                                    <span>
                                                                        <span className={styles.detailLabel}>Start:</span>
                                                                        {' '}
                                                                        {formatDate(assignmentDetail.startDate)}
                                                                        ,
                                                                    </span>
                                                                    <span>
                                                                        <span className={styles.detailLabel}>Duration:</span>
                                                                        {' '}
                                                                        {formatDurationMonths(assignmentDetail.durationMonths)}
                                                                        ,
                                                                    </span>
                                                                    <span>
                                                                        <span className={styles.detailLabel}>Rate/Hr:</span>
                                                                        {' '}
                                                                        {formatAssignmentCurrency(assignmentDetail.ratePerHour) || '-'}
                                                                        ,
                                                                    </span>
                                                                    <span>
                                                                        <span className={styles.detailLabel}>Hours/Day:</span>
                                                                        {' '}
                                                                        {getAssignmentStandardHoursPerDay(assignmentDetail) || '-'}
                                                                        ,
                                                                    </span>
                                                                    <span>
                                                                        <span className={styles.detailLabel}>Payment Cycle:</span>
                                                                        {' '}
                                                                        {getAssignmentPaymentCycle(assignmentDetail)}
                                                                    </span>
                                                                    {!isLockedAssignment
                                                                        ? (
                                                                            <button
                                                                                className={styles.editLink}
                                                                                onClick={() => setActiveAssignmentIndex(index)}
                                                                                type='button'
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                        )
                                                                        : undefined}
                                                                </div>
                                                            )
                                                            : (
                                                                isLockedAssignment
                                                                    ? undefined
                                                                    : (
                                                                        <>
                                                                            <button
                                                                                className={styles.actionButton}
                                                                                disabled={!memberHandle}
                                                                                onClick={() => setActiveAssignmentIndex(index)}
                                                                                type='button'
                                                                            >
                                                                                Add Details
                                                                            </button>
                                                                            <div className={styles.detailsText}>
                                                                                No details added
                                                                            </div>
                                                                        </>
                                                                    )
                                                            )}
                                                        {isLockedAssignment && props.assignmentManagementPath
                                                            ? (
                                                                <Link
                                                                    className={styles.assignmentLink}
                                                                    to={props.assignmentManagementPath}
                                                                >
                                                                    Assignments
                                                                </Link>
                                                            )
                                                            : undefined}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <AssignmentDetailsModal
                                        initialValue={normalizedActiveAssignmentDetails}
                                        memberHandle={activeMemberHandle}
                                        onCancel={() => setActiveAssignmentIndex(undefined)}
                                        onSave={nextDetails => {
                                            if (activeAssignmentIndex === undefined) {
                                                return
                                            }

                                            const nextAssignmentDetails = [...assignmentDetails]
                                            nextAssignmentDetails[activeAssignmentIndex] = nextDetails

                                            formContext.setValue('assignmentDetails', nextAssignmentDetails, {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                            })

                                            const nextHandles = [...assignedMemberHandles]
                                            nextHandles[activeAssignmentIndex] = nextDetails.memberHandle

                                            formContext.setValue('assignedMemberHandles', nextHandles, {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                            })

                                            setActiveAssignmentIndex(undefined)
                                        }}
                                        open={activeAssignmentIndex !== undefined}
                                    />

                                    {assignedMemberHandlesError || assignmentDetailsError
                                        ? (
                                            <div className={styles.errorText}>
                                                {assignedMemberHandlesError || assignmentDetailsError}
                                            </div>
                                        )
                                        : undefined}
                                </>
                            )
                            : undefined}
                    </>
                )
                : undefined}
        </section>
    )
}

export default EngagementPrivateSection
