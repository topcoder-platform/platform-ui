/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from '~/libs/ui'

import {
    ANTICIPATED_START_OPTIONS,
    ENGAGEMENT_ROLES,
    ENGAGEMENT_WORKLOADS,
} from '../../../../lib/constants'
import {
    ConfirmationModal,
} from '../../../../lib/components'
import {
    FormSelectField,
    FormSelectOption,
    FormTextField,
    FormTinyMceEditor,
} from '../../../../lib/components/form'
import {
    useAutosave,
} from '../../../../lib/hooks'
import {
    Engagement,
    Skill,
} from '../../../../lib/models'
import {
    engagementEditorSchema,
} from '../../../../lib/schemas/engagement-editor.schema'
import {
    createEngagement,
    deleteEngagement,
    updateEngagement,
} from '../../../../lib/services'
import {
    formatLastSaved,
    showErrorToast,
    showSuccessToast,
} from '../../../../lib/utils'

import {
    EngagementLocationFields,
} from './EngagementLocationFields'
import {
    EngagementPrivateSection,
} from './EngagementPrivateSection'
import {
    EngagementSkillsField,
} from './EngagementSkillsField'
import {
    EngagementStartDateField,
} from './EngagementStartDateField'
import {
    EngagementStatusField,
} from './EngagementStatusField'
import styles from './EngagementEditorForm.module.scss'

interface AssignmentDetailsFormValue {
    agreementRate: string
    endDate: string
    memberHandle: string
    otherRemarks?: string
    startDate: string
}

export interface EngagementEditorFormData {
    anticipatedStart: string
    assignedMemberHandles: string[]
    assignmentDetails: AssignmentDetailsFormValue[]
    compensationRange: string
    countries: string[]
    description: string
    durationWeeks: number | string
    isPrivate: boolean
    projectId: number | string
    requiredMemberCount: number | string
    role: string
    skills: Skill[]
    status: string
    timezones: string[]
    title: string
    workload: string
}

interface EngagementEditorFormProps {
    engagement?: Engagement
    isEditMode: boolean
    projectId: number | string
}

interface SaveEngagementOptions {
    isAutosave?: boolean
}

type EngagementAssignment = Engagement['assignments'][number]

function toAssignmentDetailsValue(assignment: EngagementAssignment): AssignmentDetailsFormValue {
    return {
        agreementRate: String(assignment.agreementRate || ''),
        endDate: assignment.endDate || '',
        memberHandle: String(assignment.memberHandle || ''),
        otherRemarks: assignment.otherRemarks
            ? String(assignment.otherRemarks)
            : undefined,
        startDate: assignment.startDate || '',
    }
}

function getAssignmentDefaults(engagement: Engagement | undefined): {
    assignedMemberHandles: string[]
    assignmentDetails: AssignmentDetailsFormValue[]
} {
    const assignments = engagement?.assignments

    if (Array.isArray(assignments) && assignments.length > 0) {
        const assignmentDetails = assignments.map(toAssignmentDetailsValue)

        return {
            assignedMemberHandles: assignmentDetails.map(assignment => assignment.memberHandle),
            assignmentDetails,
        }
    }

    return {
        assignedMemberHandles: engagement?.assignedMemberHandles || [],
        assignmentDetails: [],
    }
}

function getDefaultValues(
    engagement: Engagement | undefined,
    projectId: number | string,
): EngagementEditorFormData {
    const defaultEngagement = engagement
    const assignmentDefaults = getAssignmentDefaults(defaultEngagement)

    return {
        anticipatedStart: defaultEngagement?.anticipatedStart || ANTICIPATED_START_OPTIONS[0],
        assignedMemberHandles: assignmentDefaults.assignedMemberHandles,
        assignmentDetails: assignmentDefaults.assignmentDetails,
        compensationRange: defaultEngagement?.compensationRange || '',
        countries: defaultEngagement?.countries || [],
        description: defaultEngagement?.description || '',
        durationWeeks: defaultEngagement?.durationWeeks || '',
        isPrivate: defaultEngagement?.isPrivate === true,
        projectId,
        requiredMemberCount: defaultEngagement?.requiredMemberCount || '',
        role: defaultEngagement?.role || ENGAGEMENT_ROLES[0],
        skills: defaultEngagement?.skills || [],
        status: defaultEngagement?.status || 'Open',
        timezones: defaultEngagement?.timezones || [],
        title: defaultEngagement?.title || '',
        workload: defaultEngagement?.workload || ENGAGEMENT_WORKLOADS[0],
    }
}

function createRoleOptions(): FormSelectOption[] {
    return ENGAGEMENT_ROLES.map(role => ({
        label: role === 'CONTRACT'
            ? 'Contract'
            : role === 'PART_TIME'
                ? 'Part Time'
                : 'Full Time',
        value: role,
    }))
}

function createWorkloadOptions(): FormSelectOption[] {
    return ENGAGEMENT_WORKLOADS.map(workload => ({
        label: workload === 'PART_TIME' ? 'Part Time' : 'Full Time',
        value: workload,
    }))
}

function getSaveStatusLabel(saveStatus: string): string {
    if (saveStatus === 'error') {
        return 'Save failed'
    }

    if (saveStatus === 'saved') {
        return 'Saved'
    }

    if (saveStatus === 'saving') {
        return 'Saving...'
    }

    return ''
}

function toPayload(values: EngagementEditorFormData): Partial<Engagement> & {
    assignmentDetails?: AssignmentDetailsFormValue[]
} {
    const payload: Partial<Engagement> & {
        assignmentDetails?: AssignmentDetailsFormValue[]
    } = {
        anticipatedStart: values.anticipatedStart,
        compensationRange: values.compensationRange,
        countries: values.countries,
        description: values.description,
        durationWeeks: Number(values.durationWeeks),
        isPrivate: values.isPrivate,
        projectId: values.projectId,
        requiredMemberCount: values.requiredMemberCount
            ? Number(values.requiredMemberCount)
            : 0,
        role: values.role,
        skills: values.skills,
        status: values.status,
        timezones: values.timezones,
        title: values.title,
        workload: values.workload,
    }

    if (values.isPrivate) {
        const assignedMemberHandles = values.assignedMemberHandles
            .map(memberHandle => String(memberHandle || '')
                .trim())
            .filter(Boolean)

        if (assignedMemberHandles.length > 0) {
            payload.assignedMemberHandles = assignedMemberHandles
        }

        const assignmentDetails = values.assignmentDetails
            .filter(Boolean)
            .map(detail => ({
                agreementRate: String(detail.agreementRate || '')
                    .trim(),
                endDate: detail.endDate || '',
                memberHandle: String(detail.memberHandle || '')
                    .trim(),
                otherRemarks: detail.otherRemarks
                    ? String(detail.otherRemarks)
                        .trim()
                    : undefined,
                startDate: detail.startDate || '',
            }))
            .filter(detail => detail.memberHandle)

        if (assignmentDetails.length > 0) {
            payload.assignmentDetails = assignmentDetails
        }
    }

    return payload
}

export const EngagementEditorForm: FC<EngagementEditorFormProps> = (
    props: EngagementEditorFormProps,
) => {
    const navigate = useNavigate()

    const [currentEngagementId, setCurrentEngagementId] = useState<string | undefined>(
        props.engagement?.id
            ? String(props.engagement.id)
            : undefined,
    )
    const [isDeleting, setIsDeleting] = useState<boolean>(false)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [lastSaved, setLastSaved] = useState<Date | undefined>()
    const [saveError, setSaveError] = useState<string | undefined>()
    const [saveStatus, setSaveStatus] = useState<string>('idle')
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)

    const roleOptions = useMemo<FormSelectOption[]>(() => createRoleOptions(), [])
    const workloadOptions = useMemo<FormSelectOption[]>(() => createWorkloadOptions(), [])

    const formMethods = useForm<EngagementEditorFormData>({
        defaultValues: getDefaultValues(props.engagement, props.projectId),
        mode: 'onChange',
        resolver: yupResolver(engagementEditorSchema) as any,
    })

    const formState = formMethods.formState
    const handleSubmit = formMethods.handleSubmit
    const reset = formMethods.reset
    const values = formMethods.watch()

    const saveEngagement = useCallback(
        async (
            nextValues: EngagementEditorFormData,
            options: SaveEngagementOptions = {},
        ): Promise<void> => {
            if (!options.isAutosave) {
                setIsSaving(true)
                setSaveStatus('saving')
            }

            setSaveError(undefined)

            try {
                const payload = toPayload(nextValues)

                let savedEngagement: Engagement

                if (currentEngagementId) {
                    savedEngagement = await updateEngagement(currentEngagementId, payload)
                } else {
                    savedEngagement = await createEngagement(payload)
                    setCurrentEngagementId(String(savedEngagement.id))
                }

                setLastSaved(new Date())
                setSaveStatus('saved')

                reset(getDefaultValues(savedEngagement, props.projectId))

                if (!options.isAutosave) {
                    showSuccessToast(
                        props.isEditMode
                            ? 'Engagement saved successfully'
                            : 'Engagement created successfully',
                    )

                    if (!props.isEditMode) {
                        navigate(`/projects/${props.projectId}/engagements/${savedEngagement.id}`)
                    }
                }
            } catch (error) {
                const message = error instanceof Error
                    ? error.message
                    : 'Failed to save engagement'

                setSaveError(message)
                setSaveStatus('error')

                if (!options.isAutosave) {
                    showErrorToast(message)
                }

                throw error
            } finally {
                if (!options.isAutosave) {
                    setIsSaving(false)
                }
            }
        },
        [currentEngagementId, navigate, props.isEditMode, props.projectId, reset],
    )

    const autosave = useAutosave<EngagementEditorFormData>({
        enabled: !!currentEngagementId && formState.isDirty && formState.isValid,
        formValues: values,
        onSave: async nextValues => {
            await saveEngagement(nextValues, {
                isAutosave: true,
            })
        },
    })

    useEffect(() => {
        setCurrentEngagementId(props.engagement?.id
            ? String(props.engagement.id)
            : undefined)
        reset(getDefaultValues(props.engagement, props.projectId))
    }, [props.engagement, props.projectId, reset])

    useEffect(() => {
        if (autosave.saveStatus !== 'idle') {
            setSaveStatus(autosave.saveStatus)
        }

        if (autosave.lastSaved) {
            setLastSaved(autosave.lastSaved)
        }
    }, [autosave.lastSaved, autosave.saveStatus])

    const handleDelete = useCallback(async (): Promise<void> => {
        if (!currentEngagementId || isDeleting) {
            return
        }

        setIsDeleting(true)

        try {
            await deleteEngagement(currentEngagementId)
            showSuccessToast('Engagement deleted successfully')
            navigate(`/projects/${props.projectId}/engagements`)
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to delete engagement'
            showErrorToast(message)
        } finally {
            setIsDeleting(false)
            setShowDeleteModal(false)
        }
    }, [currentEngagementId, isDeleting, navigate, props.projectId])

    const onSubmit = useCallback(async (nextValues: EngagementEditorFormData): Promise<void> => {
        await saveEngagement(nextValues)
    }, [saveEngagement])

    return (
        <FormProvider {...formMethods}>
            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Basic Information</h3>

                    <div className={styles.grid}>
                        <FormTextField
                            label='Title'
                            name='title'
                            placeholder='Engagement title'
                            required
                        />

                        <FormTextField
                            label='Duration in weeks'
                            name='durationWeeks'
                            placeholder='Minimum 4'
                            required
                            type='number'
                        />

                        <FormSelectField
                            label='Role'
                            name='role'
                            options={roleOptions}
                            placeholder='Select role'
                        />

                        <FormSelectField
                            label='Workload'
                            name='workload'
                            options={workloadOptions}
                            placeholder='Select workload'
                        />

                        <FormTextField
                            label='Compensation range'
                            name='compensationRange'
                            placeholder='e.g. $2,000 - $3,000 weekly'
                        />
                    </div>

                    <div className={styles.block}>
                        <FormTinyMceEditor
                            label='Description'
                            name='description'
                            placeholder='Describe the engagement'
                            required
                        />
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Location</h3>

                    <div className={styles.grid}>
                        <EngagementLocationFields />
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Skills</h3>

                    <div className={styles.block}>
                        <EngagementSkillsField />
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Start &amp; Status</h3>

                    <div className={styles.grid}>
                        <EngagementStartDateField />
                        <EngagementStatusField />
                    </div>
                </section>

                <EngagementPrivateSection />

                <div className={styles.footer}>
                    <div className={styles.statusArea}>
                        <span className={styles.statusText}>{getSaveStatusLabel(saveStatus)}</span>
                        <span className={styles.lastSaved}>{formatLastSaved(lastSaved)}</span>
                        {saveError
                            ? <span className={styles.errorText}>{saveError}</span>
                            : undefined}
                    </div>

                    <div className={styles.actions}>
                        {props.isEditMode
                            ? (
                                <Button
                                    label={isDeleting ? 'Deleting...' : 'Delete'}
                                    onClick={() => setShowDeleteModal(true)}
                                    secondary
                                    size='md'
                                />
                            )
                            : undefined}

                        <Link className={styles.cancelLink} to={`/projects/${props.projectId}/engagements`}>
                            Cancel
                        </Link>

                        <Button
                            label='Save engagement'
                            type='submit'
                            primary
                            size='lg'
                            disabled={!formState.isValid || isSaving}
                        />
                    </div>
                </div>
            </form>

            {showDeleteModal
                ? (
                    <ConfirmationModal
                        confirmText='Delete'
                        message='Do you want to delete this engagement?'
                        onCancel={() => setShowDeleteModal(false)}
                        onConfirm={handleDelete}
                        title='Confirm Delete'
                    />
                )
                : undefined}
        </FormProvider>
    )
}

export default EngagementEditorForm
