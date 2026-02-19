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

import {
    FormCheckboxField,
    FormUserAutocomplete,
} from '../../../../lib/components/form'

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

function getAssignmentLabel(index: number, count: number): string {
    return count > 1
        ? `Assign to Member ${index + 1}`
        : 'Assign to Member'
}

export const EngagementPrivateSection: FC = () => {
    const formContext = useFormContext<EngagementPrivateSectionForm>()

    const [activeAssignmentIndex, setActiveAssignmentIndex] = useState<number | undefined>()

    const isPrivate = formContext.watch('isPrivate') === true
    const requiredMemberCount = toNumber(formContext.watch('requiredMemberCount'))

    const assignedMemberHandles = formContext.watch('assignedMemberHandles') || []
    const assignmentDetails = formContext.watch('assignmentDetails') || []

    const assignmentIndices = useMemo(
        () => Array.from({ length: requiredMemberCount }, (_, index) => index),
        [requiredMemberCount],
    )

    useEffect(() => {
        if (activeAssignmentIndex === undefined) {
            return
        }

        if (requiredMemberCount < 1 || activeAssignmentIndex >= requiredMemberCount) {
            setActiveAssignmentIndex(undefined)
        }
    }, [activeAssignmentIndex, requiredMemberCount])

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
                label='Private engagement'
                name='isPrivate'
            />

            {isPrivate
                ? (
                    <>
                        {requiredMemberCount > 0
                            ? (
                                <>
                                    <div className={styles.assignmentList}>
                                        {assignmentIndices.map(index => {
                                            const memberHandle = assignedMemberHandles[index]
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
                                                        <FormUserAutocomplete
                                                            label={getAssignmentLabel(index, requiredMemberCount)}
                                                            name={`assignedMemberHandles.${index}`}
                                                            onValueChange={value => {
                                                                if (!value || value === memberHandle) {
                                                                    return
                                                                }

                                                                setActiveAssignmentIndex(index)
                                                            }}
                                                            placeholder='Search user handle'
                                                            required
                                                            valueField='handle'
                                                        />
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
                                                                        <span className={styles.detailLabel}>End:</span>
                                                                        {' '}
                                                                        {formatDate(assignmentDetail.endDate)}
                                                                        ,
                                                                    </span>
                                                                    <span>
                                                                        <span className={styles.detailLabel}>Rate:</span>
                                                                        {' '}
                                                                        {assignmentDetail.agreementRate || '-'}
                                                                    </span>
                                                                    <button
                                                                        className={styles.editLink}
                                                                        onClick={() => setActiveAssignmentIndex(index)}
                                                                        type='button'
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                </div>
                                                            )
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
                                                            )}
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
                                            })

                                            const nextHandles = [...assignedMemberHandles]
                                            nextHandles[activeAssignmentIndex] = nextDetails.memberHandle

                                            formContext.setValue('assignedMemberHandles', nextHandles, {
                                                shouldDirty: true,
                                            })

                                            setActiveAssignmentIndex(undefined)
                                        }}
                                        open={activeAssignmentIndex !== undefined}
                                    />
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
