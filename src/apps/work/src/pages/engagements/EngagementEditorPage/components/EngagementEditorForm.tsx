/* eslint-disable react/jsx-no-bind */
/* eslint-disable complexity */

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
    renderRichTextToHtml,
    renderRichTextToPlainText,
} from '../../../../../../../libs/shared/lib/utils/rich-text'
import {
    ANTICIPATED_START_OPTIONS,
    ENGAGEMENT_ROLES,
    ENGAGEMENT_WORKLOADS,
} from '../../../../lib/constants'
import {
    rootRoute,
} from '../../../../config/routes.config'
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
    autowriteDescription,
    createEngagement,
    fetchProjectsList,
    updateEngagement,
} from '../../../../lib/services'
import {
    formatEngagementStatus,
    getCountableEngagementAssignments,
    showErrorToast,
    showSuccessToast,
} from '../../../../lib/utils'

import {
    AssignmentDetailsFormValue,
} from './AssignmentDetailsModal'
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

export interface EngagementEditorFormData {
    anticipatedStart: string
    assignedMemberHandles: string[]
    assignmentDetails: AssignmentDetailsFormValue[]
    compensationRange: string
    countries: string[]
    description: string
    durationWeeks: number | string
    isPrivate: boolean
    projectId: string
    requiredMemberCount: number | string
    role: string
    skills: Skill[]
    status: string
    timezones: string[]
    title: string
    workload: string
}

interface EngagementEditorFormProps {
    canEditParentProject?: boolean
    engagement?: Engagement
    isEditMode: boolean
    projectId: number | string
    projectName?: string
}

interface SaveEngagementOptions {
    isAutosave?: boolean
}

interface AssignmentSerializationOptions {
    lockedAssignmentDetails?: AssignmentDetailsFormValue[]
}

type EngagementAssignment = Engagement['assignments'][number]
type SerializedAssignmentDetailsPayload = {
    agreementRate: string
    durationMonths?: number
    memberHandle: string
    otherRemarks?: string
    paymentCycle?: string
    ratePerHour: string
    standardHoursPerDay?: number
    standardHoursPerWeek?: number
    startDate: string
}

/**
 * Normalizes project identifiers so select-backed form state stays string-based.
 *
 * @param projectId project id from route params, engagement payload, or form values.
 * @returns a trimmed string id, or an empty string when the source is missing.
 */
function normalizeProjectId(projectId: number | string | undefined): string {
    if (projectId === undefined || projectId === null) {
        return ''
    }

    return String(projectId)
        .trim()
}

/**
 * Limits private-assignment serialization to the visible member slots so stale
 * hidden handles are not submitted after the required member count changes.
 *
 * @param requiredMemberCount raw form value for the private member count.
 * @param assignedMemberHandles form values for the selected member handles.
 * @param lockedAssignedMemberHandles persisted member handles that must remain visible.
 * @returns trimmed handles for the currently active private-assignment slots.
 */
function getVisibleAssignedMemberHandles(
    requiredMemberCount: number | string | undefined,
    assignedMemberHandles: string[],
    lockedAssignedMemberHandles: string[] = [],
): string[] {
    const parsedRequiredMemberCount = Number(requiredMemberCount)
    const assignmentLimit = Math.max(
        Number.isInteger(parsedRequiredMemberCount) && parsedRequiredMemberCount > 0
            ? parsedRequiredMemberCount
            : assignedMemberHandles.length,
        lockedAssignedMemberHandles.length,
    )

    return Array.from({ length: assignmentLimit }, (_, index) => (
        lockedAssignedMemberHandles[index] || assignedMemberHandles[index] || ''
    ))
        .map(memberHandle => String(memberHandle)
            .trim())
}

/**
 * Extracts locked member handles from persisted assignment details.
 *
 * @param lockedAssignmentDetails existing assignment detail rows that should
 * remain owned by the assignments list.
 * @returns member handles that cannot be edited from the engagement form.
 */
function getLockedAssignedMemberHandles(
    lockedAssignmentDetails: AssignmentDetailsFormValue[] = [],
): string[] {
    return lockedAssignmentDetails
        .map(assignmentDetail => String(assignmentDetail.memberHandle || '')
            .trim())
        .filter(Boolean)
}

/**
 * Serializes private-assignment details only when they still match the current
 * member handle selected for each visible slot.
 *
 * @param values engagement editor form values.
 * @param lockedAssignmentDetails persisted assignment details that must remain
 * unchanged while editing the engagement.
 * @returns serialized assignment details aligned to the active member handles.
 */
function serializeAssignmentDetails(
    values: EngagementEditorFormData,
    lockedAssignmentDetails: AssignmentDetailsFormValue[] = [],
): SerializedAssignmentDetailsPayload[] {
    const lockedAssignedMemberHandles = getLockedAssignedMemberHandles(lockedAssignmentDetails)
    const visibleAssignedMemberHandles = getVisibleAssignedMemberHandles(
        values.requiredMemberCount,
        values.assignedMemberHandles,
        lockedAssignedMemberHandles,
    )
    const serializedAssignmentDetails: Array<SerializedAssignmentDetailsPayload | undefined>
        = visibleAssignedMemberHandles
            .map((memberHandle, index) => {
                const lockedDetail = lockedAssignmentDetails[index]
                const detail = lockedDetail?.memberHandle
                    ? lockedDetail
                    : values.assignmentDetails[index]
                const detailMemberHandle = String(detail?.memberHandle || '')
                    .trim()

                if (!memberHandle || !detail || detailMemberHandle !== memberHandle) {
                    return undefined
                }

                return {
                    agreementRate: String(detail.agreementRate || '')
                        .trim(),
                    durationMonths: detail.durationMonths
                        ? Number(detail.durationMonths)
                        : undefined,
                    memberHandle,
                    otherRemarks: detail.otherRemarks
                        ? String(detail.otherRemarks)
                            .trim()
                        : undefined,
                    paymentCycle: detail.paymentCycle
                        ? String(detail.paymentCycle)
                            .trim()
                            .toUpperCase()
                        : 'WEEKLY',
                    ratePerHour: String(detail.ratePerHour || '')
                        .trim(),
                    standardHoursPerDay: detail.standardHoursPerDay
                        ? Number(detail.standardHoursPerDay)
                        : undefined,
                    standardHoursPerWeek: detail.standardHoursPerWeek
                        ? Number(detail.standardHoursPerWeek)
                        : undefined,
                    startDate: detail.startDate || '',
                }
            })

    return serializedAssignmentDetails.filter(
        (detail): detail is SerializedAssignmentDetailsPayload => Boolean(detail),
    )
}

function toAssignmentDetailsValue(assignment: EngagementAssignment): AssignmentDetailsFormValue {
    return {
        agreementRate: String(assignment.agreementRate || ''),
        durationMonths: assignment.durationMonths !== undefined && assignment.durationMonths !== null
            ? String(assignment.durationMonths)
            : '',
        memberHandle: String(assignment.memberHandle || ''),
        otherRemarks: assignment.otherRemarks
            ? String(assignment.otherRemarks)
            : undefined,
        paymentCycle: assignment.paymentCycle
            ? String(assignment.paymentCycle)
            : 'WEEKLY',
        ratePerHour: assignment.ratePerHour
            ? String(assignment.ratePerHour)
            : '',
        standardHoursPerDay:
            assignment.standardHoursPerDay !== undefined && assignment.standardHoursPerDay !== null
                ? String(assignment.standardHoursPerDay)
                : (assignment.standardHoursPerWeek !== undefined && assignment.standardHoursPerWeek !== null
                    ? String(Number(assignment.standardHoursPerWeek) / 5)
                    : ''),
        standardHoursPerWeek:
            assignment.standardHoursPerWeek !== undefined && assignment.standardHoursPerWeek !== null
                ? String(assignment.standardHoursPerWeek)
                : '',
        startDate: assignment.startDate || '',
    }
}

/**
 * Builds private-assignment form defaults from active assignment slots only.
 *
 * Historical completed or terminated assignments remain on the engagement
 * response, but editing an engagement should only submit currently countable
 * assignments so closed history rows are not modified.
 *
 * @param engagement engagement being edited, if one exists.
 * @returns member handles and details for active private-assignment slots.
 */
function getAssignmentDefaults(engagement: Engagement | undefined): {
    assignedMemberHandles: string[]
    assignmentDetails: AssignmentDetailsFormValue[]
} {
    const assignments = engagement?.assignments

    if (Array.isArray(assignments) && assignments.length > 0) {
        const assignmentDetails = getCountableEngagementAssignments(assignments)
            .map(toAssignmentDetailsValue)

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

/**
 * Builds read-only assignment defaults for existing engagement assignments.
 *
 * @param engagement engagement being edited, if one exists.
 * @returns assignment details for active assignments that should no longer be
 * editable from the engagement editor.
 */
function getLockedAssignmentDetails(
    engagement: Engagement | undefined,
): AssignmentDetailsFormValue[] {
    const assignments = engagement?.assignments

    if (!Array.isArray(assignments) || assignments.length < 1) {
        return []
    }

    return getCountableEngagementAssignments(assignments)
        .map(toAssignmentDetailsValue)
}

/**
 * Resolves the form's parent project id from the engagement payload first,
 * falling back to the route-scoped project id for new engagements.
 *
 * @param engagement engagement being edited, if one exists.
 * @param projectId project id from the current route.
 * @returns the project id that should seed the form state.
 */
function getDefaultProjectId(
    engagement: Engagement | undefined,
    projectId: number | string,
): string {
    return normalizeProjectId(
        engagement?.projectId
        ?? engagement?.project?.id
        ?? projectId,
    )
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
        description: renderRichTextToHtml(defaultEngagement?.description || ''),
        durationWeeks: defaultEngagement?.durationWeeks
            ? String(defaultEngagement.durationWeeks)
            : '',
        isPrivate: defaultEngagement?.isPrivate === true,
        projectId: getDefaultProjectId(defaultEngagement, projectId),
        requiredMemberCount: defaultEngagement?.requiredMemberCount
            ? String(defaultEngagement.requiredMemberCount)
            : '',
        role: defaultEngagement?.role || ENGAGEMENT_ROLES[0],
        skills: defaultEngagement?.skills || [],
        status: defaultEngagement?.status
            ? formatEngagementStatus(defaultEngagement.status)
            : 'Open',
        timezones: defaultEngagement?.timezones || [],
        title: defaultEngagement?.title || '',
        workload: defaultEngagement?.workload || ENGAGEMENT_WORKLOADS[0],
    }
}

function createRoleOptions(): FormSelectOption[] {
    const labelsByRole: Record<string, string> = {
        DATA_ENGINEER: 'Data Engineer',
        DATA_SCIENTIST: 'Data Scientist',
        DESIGNER: 'Designer',
        SOFTWARE_DEVELOPER: 'Software Developer',
    }

    return ENGAGEMENT_ROLES.map(role => ({
        label: labelsByRole[role] || role,
        value: role,
    }))
}

function createWorkloadOptions(): FormSelectOption[] {
    const labelsByWorkload: Record<string, string> = {
        FRACTIONAL: 'Fractional',
        FULL_TIME: 'Full-Time',
    }

    return ENGAGEMENT_WORKLOADS.map(workload => ({
        label: labelsByWorkload[workload] || workload,
        value: workload,
    }))
}

const MIN_PARENT_PROJECT_SEARCH_LENGTH = 2

/**
 * Creates a select option for the current parent project.
 *
 * @param projectId project identifier from the route or engagement payload.
 * @param projectName display name for the selected project.
 * @returns a normalized option when the id is available; otherwise `undefined`.
 */
function createProjectOption(
    projectId: number | string | undefined,
    projectName: string | undefined,
): FormSelectOption | undefined {
    const normalizedProjectId = normalizeProjectId(projectId)

    if (!normalizedProjectId) {
        return undefined
    }

    return {
        label: projectName?.trim() || `Project ${normalizedProjectId}`,
        value: normalizedProjectId,
    }
}

/**
 * Merges async project options so the current parent project remains selectable
 * after search results are loaded.
 *
 * @param currentOptions options already cached in component state.
 * @param incomingOptions fresh options returned from the projects API.
 * @returns a deduplicated list keyed by project id.
 */
function mergeProjectOptions(
    currentOptions: FormSelectOption[],
    incomingOptions: FormSelectOption[],
): FormSelectOption[] {
    const optionMap = new Map<string, FormSelectOption>()

    currentOptions.forEach(option => {
        optionMap.set(option.value, option)
    })

    incomingOptions.forEach(option => {
        optionMap.set(option.value, option)
    })

    return Array.from(optionMap.values())
}

/**
 * Builds the engagement list route for a specific parent project id.
 *
 * @param projectId current route, form, or saved engagement project id.
 * @returns the project-scoped engagements route.
 */
function getEngagementsPath(projectId: number | string | undefined): string {
    return `${rootRoute}/projects/${normalizeProjectId(projectId)}/engagements`
}

/**
 * Resolves a required-member count while preserving already-assigned slots.
 *
 * @param rawRequiredMemberCount form value for the required member count.
 * @param minimumMemberCount minimum count needed to keep locked assignments visible.
 * @returns normalized member count, or `undefined` when the form value is blank.
 */
function getPayloadRequiredMemberCount(
    rawRequiredMemberCount: number | string | undefined,
    minimumMemberCount: number,
): number | undefined {
    if (rawRequiredMemberCount === '' || rawRequiredMemberCount === undefined) {
        return minimumMemberCount > 0
            ? minimumMemberCount
            : undefined
    }

    const requiredMemberCount = Number(rawRequiredMemberCount)

    if (!Number.isFinite(requiredMemberCount)) {
        return undefined
    }

    return Math.max(requiredMemberCount, minimumMemberCount)
}

/**
 * Converts engagement editor form state into the API payload.
 *
 * @param values engagement editor form values.
 * @param options serialization options for preserving locked assignment slots.
 * @returns partial engagement payload ready for create or update.
 */
function toPayload(
    values: EngagementEditorFormData,
    options: AssignmentSerializationOptions = {},
): Partial<Engagement> & {
    assignmentDetails?: SerializedAssignmentDetailsPayload[]
} {
    const rawRequiredMemberCount = values.requiredMemberCount
    const lockedAssignmentDetails = options.lockedAssignmentDetails || []
    const lockedAssignedMemberHandles = getLockedAssignedMemberHandles(lockedAssignmentDetails)
    const payload: Partial<Engagement> & {
        assignmentDetails?: SerializedAssignmentDetailsPayload[]
    } = {
        anticipatedStart: values.anticipatedStart,
        compensationRange: values.compensationRange,
        countries: values.countries,
        description: values.description,
        durationWeeks: Number(values.durationWeeks),
        isPrivate: values.isPrivate,
        projectId: values.projectId,
        role: values.role,
        skills: values.skills,
        status: values.status,
        timezones: values.timezones,
        title: values.title,
        workload: values.workload,
    }

    const requiredMemberCount = getPayloadRequiredMemberCount(
        rawRequiredMemberCount,
        values.isPrivate
            ? lockedAssignedMemberHandles.length
            : 0,
    )

    if (requiredMemberCount !== undefined) {
        payload.requiredMemberCount = requiredMemberCount
    }

    if (values.isPrivate) {
        const assignedMemberHandles = getVisibleAssignedMemberHandles(
            values.requiredMemberCount,
            values.assignedMemberHandles,
            lockedAssignedMemberHandles,
        )
            .filter(Boolean)

        if (assignedMemberHandles.length > 0) {
            payload.assignedMemberHandles = assignedMemberHandles
        }

        const assignmentDetails = serializeAssignmentDetails(values, lockedAssignmentDetails)

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
    const [isGeneratingDescription, setIsGeneratingDescription] = useState<boolean>(false)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [saveError, setSaveError] = useState<string | undefined>()

    const lockedAssignmentDetails = useMemo<AssignmentDetailsFormValue[]>(
        () => (props.isEditMode
            ? getLockedAssignmentDetails(props.engagement)
            : []),
        [props.engagement, props.isEditMode],
    )
    const lockedAssignedMemberHandles = useMemo<string[]>(
        () => getLockedAssignedMemberHandles(lockedAssignmentDetails),
        [lockedAssignmentDetails],
    )
    const roleOptions = useMemo<FormSelectOption[]>(() => createRoleOptions(), [])
    const workloadOptions = useMemo<FormSelectOption[]>(() => createWorkloadOptions(), [])
    const currentProjectOption = useMemo<FormSelectOption | undefined>(
        () => createProjectOption(
            props.engagement?.projectId
                ?? props.engagement?.project?.id
                ?? props.projectId,
            props.engagement?.projectName
                || props.engagement?.project?.name
                || props.projectName,
        ),
        [
            props.engagement?.project?.id,
            props.engagement?.project?.name,
            props.engagement?.projectId,
            props.engagement?.projectName,
            props.projectId,
            props.projectName,
        ],
    )
    const [parentProjectOptions, setParentProjectOptions] = useState<FormSelectOption[]>(
        currentProjectOption
            ? [currentProjectOption]
            : [],
    )

    const formMethods = useForm<EngagementEditorFormData>({
        defaultValues: getDefaultValues(props.engagement, props.projectId),
        mode: 'onChange',
        resolver: yupResolver(engagementEditorSchema) as any,
    })

    const formState = formMethods.formState
    const getValues = formMethods.getValues
    const handleSubmit = formMethods.handleSubmit
    const reset = formMethods.reset
    const setValue = formMethods.setValue
    const values = formMethods.watch()
    const selectedEngagementsPath = getEngagementsPath(values.projectId || props.projectId)

    useEffect(() => {
        if (!currentProjectOption) {
            return
        }

        setParentProjectOptions(currentOptions => mergeProjectOptions(currentOptions, [
            currentProjectOption,
        ]))
    }, [currentProjectOption])

    const saveEngagement = useCallback(
        async (
            nextValues: EngagementEditorFormData,
            options: SaveEngagementOptions = {},
        ): Promise<void> => {
            if (!options.isAutosave) {
                setIsSaving(true)
            }

            setSaveError(undefined)

            try {
                const payload = toPayload(nextValues, {
                    lockedAssignmentDetails,
                })

                let savedEngagement: Engagement

                if (currentEngagementId) {
                    savedEngagement = await updateEngagement(currentEngagementId, payload)
                } else {
                    savedEngagement = await createEngagement(payload)
                    setCurrentEngagementId(String(savedEngagement.id))
                }

                reset(getDefaultValues(savedEngagement, props.projectId))

                if (!options.isAutosave) {
                    showSuccessToast(
                        props.isEditMode
                            ? 'Engagement saved successfully'
                            : 'Engagement created successfully',
                    )
                    const savedEngagementsPath = getEngagementsPath(
                        savedEngagement.projectId || nextValues.projectId || props.projectId,
                    )

                    navigate(savedEngagementsPath)
                }
            } catch (error) {
                const message = error instanceof Error
                    ? error.message
                    : 'Failed to save engagement'

                setSaveError(message)

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
        [
            currentEngagementId,
            lockedAssignmentDetails,
            navigate,
            props.isEditMode,
            props.projectId,
            reset,
        ],
    )

    const loadParentProjectOptions = useCallback(
        async (inputValue: string): Promise<FormSelectOption[]> => {
            const keyword = inputValue.trim()

            if (keyword.length < MIN_PARENT_PROJECT_SEARCH_LENGTH) {
                return []
            }

            try {
                const response = await fetchProjectsList({
                    keyword,
                    page: 1,
                    perPage: 20,
                    sortBy: 'name',
                    sortOrder: 'asc',
                })
                const nextOptions = response.projects
                    .filter(project => project?.id !== undefined && project?.id !== null)
                    .map(project => ({
                        label: project.name || `Project ${project.id}`,
                        value: String(project.id),
                    }))

                setParentProjectOptions(currentOptions => mergeProjectOptions(currentOptions, nextOptions))

                return nextOptions
            } catch {
                return []
            }
        },
        [],
    )

    useAutosave<EngagementEditorFormData>({
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

    const handleAIAutowrite = useCallback(async (): Promise<void> => {
        if (isGeneratingDescription) {
            return
        }

        const currentDescription = renderRichTextToPlainText(String(getValues('description') || ''))
            .trim()

        if (!currentDescription) {
            showErrorToast('Enter a description before using AI Autowrite.')
            return
        }

        setIsGeneratingDescription(true)

        try {
            const generatedDescription = await autowriteDescription(currentDescription)

            setValue('description', renderRichTextToHtml(generatedDescription), {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            })

            showSuccessToast('AI generated description has been added.')
        } catch {
            showErrorToast('Failed to generate description. Please try again.')
        } finally {
            setIsGeneratingDescription(false)
        }
    }, [getValues, isGeneratingDescription, setValue])

    const onSubmit = useCallback(async (nextValues: EngagementEditorFormData): Promise<void> => {
        await saveEngagement(nextValues)
    }, [saveEngagement])

    return (
        <FormProvider {...formMethods}>
            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Basic Information</h3>

                    <div className={styles.basicInfoGrid}>
                        <FormTextField
                            className={styles.titleField}
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
                            placeholder='$600 - $1000'
                        />
                    </div>

                    <div className={styles.block}>
                        <FormTinyMceEditor
                            label='Description'
                            name='description'
                            placeholder='Describe the engagement'
                            required
                        />

                        <div className={styles.descriptionActions}>
                            <Button
                                disabled={isSaving || isGeneratingDescription}
                                label={isGeneratingDescription ? 'Generating...' : 'AI Autowrite'}
                                onClick={handleAIAutowrite}
                                secondary
                                size='sm'
                            />
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Details</h3>

                    <div className={styles.block}>
                        <EngagementSkillsField />
                    </div>

                    <div className={styles.detailsGrid}>
                        <div className={styles.startStatusBlock}>
                            <EngagementStartDateField />
                            <EngagementStatusField />
                            <FormSelectField
                                disabled={!props.canEditParentProject}
                                isAsync={props.canEditParentProject}
                                label='Parent Project'
                                loadOptions={props.canEditParentProject
                                    ? loadParentProjectOptions
                                    : undefined}
                                name='projectId'
                                options={parentProjectOptions}
                                placeholder={props.canEditParentProject
                                    ? 'Type at least 2 characters to search projects...'
                                    : undefined}
                                required
                            />
                            <FormTextField
                                label='Required Members'
                                name='requiredMemberCount'
                                placeholder='Number of members'
                                required={values.isPrivate === true}
                                type='number'
                            />
                        </div>
                        <EngagementLocationFields />
                    </div>
                </section>

                <EngagementPrivateSection
                    assignmentManagementPath={currentEngagementId
                        ? `/projects/${normalizeProjectId(values.projectId || props.projectId)}`
                            + `/engagements/${currentEngagementId}/assignments`
                        : undefined}
                    lockedAssignedMemberHandles={lockedAssignedMemberHandles}
                />

                <div className={styles.footer}>
                    {saveError
                        ? (
                            <div className={styles.statusArea}>
                                <span className={styles.errorText}>{saveError}</span>
                            </div>
                        )
                        : undefined}

                    <div className={styles.actions}>
                        <Link className={styles.cancelLink} to={selectedEngagementsPath}>
                            Cancel
                        </Link>

                        <Button
                            label='Save Engagement'
                            type='submit'
                            primary
                            size='lg'
                            disabled={isSaving}
                        />
                    </div>
                </div>
            </form>
        </FormProvider>
    )
}

export default EngagementEditorForm
