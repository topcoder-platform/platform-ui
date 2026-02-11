/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useMemo,
    useState,
} from 'react'
import {
    useFormContext,
} from 'react-hook-form'

import {
    FormCheckboxField,
    FormTextField,
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
        return 1
    }

    return Math.floor(parsed)
}

function formatDateTime(value?: string): string {
    if (!value) {
        return '-'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString('en-US', {
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function getAssignmentLabel(index: number, count: number): string {
    return count > 1
        ? `Assign to Member ${index + 1}`
        : 'Assign to Member'
}

function getAssignmentSummary(details: AssignmentDetailsFormValue | undefined): string {
    if (!details) {
        return 'No details added'
    }

    return `Start: ${formatDateTime(details.startDate)}, End: ${formatDateTime(details.endDate)}, Rate: ${details.agreementRate || '-'}`
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

    const activeMemberHandle = activeAssignmentIndex !== undefined
        ? assignedMemberHandles[activeAssignmentIndex]
        : undefined

    const activeAssignmentDetails = activeAssignmentIndex !== undefined
        ? assignmentDetails[activeAssignmentIndex]
        : undefined

    return (
        <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Private Assignment</h3>

            <FormCheckboxField
                label='Private engagement'
                name='isPrivate'
            />

            {isPrivate
                ? (
                    <>
                        <div className={styles.memberCountField}>
                            <FormTextField
                                label='Required Members'
                                name='requiredMemberCount'
                                placeholder='Number of members'
                                required
                                type='number'
                            />
                        </div>

                        <div className={styles.assignmentList}>
                            {assignmentIndices.map(index => {
                                const assignmentDetail = assignmentDetails[index]
                                const memberHandle = assignedMemberHandles[index]

                                return (
                                    <div key={`assignment-row-${index}`} className={styles.assignmentRow}>
                                        <div className={styles.assignmentInput}>
                                            <FormUserAutocomplete
                                                label={getAssignmentLabel(index, requiredMemberCount)}
                                                name={`assignedMemberHandles.${index}`}
                                                placeholder='Search user handle'
                                                required
                                                valueField='handle'
                                            />
                                        </div>

                                        <div className={styles.assignmentActions}>
                                            <button
                                                className={styles.actionButton}
                                                disabled={!memberHandle}
                                                onClick={() => setActiveAssignmentIndex(index)}
                                                type='button'
                                            >
                                                {assignmentDetail ? 'Edit' : 'Add Details'}
                                            </button>
                                            <div className={styles.detailsText}>
                                                {getAssignmentSummary(assignmentDetail)}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <AssignmentDetailsModal
                            initialValue={activeAssignmentDetails}
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
        </section>
    )
}

export default EngagementPrivateSection
