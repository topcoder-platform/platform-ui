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
    DEFAULT_NDA_UUID,
    PROJECT_STATUS,
    PROJECT_STATUSES,
} from '../../../../../lib/constants'
import {
    FormGroupsSelect,
    FormRadioGroup,
    FormSelectField,
    FormSelectOption,
    FormTextAreaField,
    FormTextField,
} from '../../../../../lib/components/form'
import {
    useFetchBillingAccounts,
    UseFetchBillingAccountsResult,
} from '../../../../../lib/hooks'
import {
    CreateProjectPayload,
    Project,
    ProjectStatusValue,
    ProjectType,
    UpdateProjectPayload,
} from '../../../../../lib/models'
import {
    createProjectEditorSchema,
} from '../../../../../lib/schemas/project-editor.schema'
import {
    createProject,
    updateProject,
} from '../../../../../lib/services'
import {
    formatDate,
    showErrorToast,
    showSuccessToast,
} from '../../../../../lib/utils'

import styles from './ProjectEditorForm.module.scss'

interface ProjectEditorFormProps {
    canManage: boolean
    isEdit: boolean
    onSuccess?: (project: Project) => void
    projectDetail?: Project
    projectTypes: ProjectType[]
}

interface ProjectEditorFormValues {
    billingAccountId: string
    cancelReason: string
    description: string
    groups: string[]
    name: string
    status: ProjectStatusValue | ''
    terms: string
    type: string
}

function getDefaultFormValues(
    isEdit: boolean,
    projectDetail?: Project,
): ProjectEditorFormValues {
    const billingAccountId = normalizeOptionalStringValue(projectDetail?.billingAccountId) || ''
    const terms = Array.isArray(projectDetail?.terms)
        ? projectDetail?.terms[0] || ''
        : ''
    const groups = projectDetail?.groups || []

    return {
        billingAccountId,
        cancelReason: projectDetail?.cancelReason || '',
        description: projectDetail?.description || '',
        groups,
        name: projectDetail?.name || '',
        status: isEdit
            ? (projectDetail?.status || PROJECT_STATUS.DRAFT)
            : PROJECT_STATUS.DRAFT,
        terms,
        type: projectDetail?.type || '',
    }
}

function normalizeOptionalStringValue(value: unknown): string | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value)
    }

    if (typeof value !== 'string') {
        return undefined
    }

    const normalizedValue = value.trim()

    return normalizedValue || undefined
}

function normalizeStringList(values: string[] | undefined): string[] | undefined {
    if (!Array.isArray(values)) {
        return undefined
    }

    const normalizedValues = values
        .map(value => value.trim())
        .filter(Boolean)

    return normalizedValues.length
        ? normalizedValues
        : undefined
}

export const ProjectEditorForm: FC<ProjectEditorFormProps> = (props: ProjectEditorFormProps) => {
    const navigate = useNavigate()
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const {
        billingAccounts,
        error: billingAccountsError,
        isError: isBillingAccountsError,
        isLoading: isBillingAccountsLoading,
    }: UseFetchBillingAccountsResult = useFetchBillingAccounts()

    const validationSchema = useMemo(
        () => createProjectEditorSchema(props.isEdit, props.canManage),
        [props.canManage, props.isEdit],
    )

    const formMethods = useForm<ProjectEditorFormValues>({
        defaultValues: getDefaultFormValues(props.isEdit, props.projectDetail),
        mode: 'onChange',
        resolver: yupResolver(validationSchema) as any,
    })

    const formState = formMethods.formState
    const handleSubmit = formMethods.handleSubmit
    const reset = formMethods.reset
    const watch = formMethods.watch

    const selectedStatus = watch('status')

    const isProjectCancelled = selectedStatus === PROJECT_STATUS.CANCELLED

    const statusOptions = useMemo<FormSelectOption[]>(
        () => PROJECT_STATUSES.map(projectStatus => ({
            label: projectStatus.label,
            value: projectStatus.value,
        })),
        [],
    )

    const projectTypeOptions = useMemo<FormSelectOption[]>(
        () => props.projectTypes.map(projectType => ({
            label: projectType.displayName,
            value: projectType.key,
        })),
        [props.projectTypes],
    )

    const billingAccountOptions = useMemo<FormSelectOption[]>(
        () => billingAccounts.map(billingAccount => ({
            label: `[${billingAccount.id}] - ${billingAccount.name} - ${formatDate(
                typeof billingAccount.endDate === 'string'
                    ? billingAccount.endDate
                    : undefined,
            )}`,
            value: String(billingAccount.id),
        })),
        [billingAccounts],
    )

    const billingAccountHint = useMemo(() => {
        if (isBillingAccountsLoading) {
            return 'Loading billing accounts...'
        }

        if (isBillingAccountsError) {
            return billingAccountsError?.message || 'Failed to load billing accounts.'
        }

        return undefined
    }, [
        billingAccountsError,
        isBillingAccountsError,
        isBillingAccountsLoading,
    ])

    useEffect(() => {
        reset(getDefaultFormValues(props.isEdit, props.projectDetail))
    }, [props.isEdit, props.projectDetail, reset])

    const onSubmit = useCallback(
        async (formData: ProjectEditorFormValues): Promise<void> => {
            setIsSaving(true)

            try {
                const billingAccountId = normalizeOptionalStringValue(formData.billingAccountId)
                const termsValue = normalizeOptionalStringValue(formData.terms)
                const terms = termsValue
                    ? [termsValue]
                    : undefined
                const groups = normalizeStringList(formData.groups)

                if (!props.isEdit) {
                    const payload: CreateProjectPayload = {
                        billingAccountId,
                        description: formData.description,
                        groups,
                        name: formData.name,
                        terms,
                        type: formData.type,
                    }

                    const createdProject = await createProject(payload)

                    showSuccessToast('Project created successfully')
                    props.onSuccess?.(createdProject)

                    navigate(`/projects/${createdProject.id}/challenges`)

                    return
                }

                if (!props.projectDetail) {
                    throw new Error('Project details are unavailable')
                }

                const payload: UpdateProjectPayload = {
                    billingAccountId,
                    description: formData.description,
                    groups,
                    name: formData.name,
                    terms,
                }

                if (props.canManage) {
                    payload.status = formData.status as ProjectStatusValue

                    if (payload.status === PROJECT_STATUS.CANCELLED) {
                        payload.cancelReason = formData.cancelReason
                    }
                }

                const updatedProject = await updateProject(String(props.projectDetail.id), payload)

                showSuccessToast('Project saved successfully')
                reset(getDefaultFormValues(true, updatedProject))
                props.onSuccess?.(updatedProject)
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : 'Failed to save project'

                showErrorToast(errorMessage)
            } finally {
                setIsSaving(false)
            }
        },
        [navigate, props, reset],
    )

    const cancelPath = props.isEdit && props.projectDetail
        ? `/projects/${props.projectDetail.id}/challenges`
        : '/projects'

    return (
        <FormProvider {...formMethods}>
            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Project Details</h3>

                    <div className={styles.grid}>
                        <FormTextField
                            label='Project Name'
                            maxLength={255}
                            name='name'
                            placeholder='Project name'
                            required
                        />

                        {props.isEdit && props.canManage
                            ? (
                                <FormSelectField
                                    label='Project Status'
                                    name='status'
                                    options={statusOptions}
                                    placeholder='Select project status'
                                    required
                                />
                            )
                            : undefined}

                        {props.isEdit && props.canManage && isProjectCancelled
                            ? (
                                <FormTextField
                                    label='Cancel Reason'
                                    name='cancelReason'
                                    placeholder='Enter cancellation reason'
                                    required
                                />
                            )
                            : undefined}

                        {!props.isEdit
                            ? (
                                <FormSelectField
                                    label='Project Type'
                                    name='type'
                                    options={projectTypeOptions}
                                    placeholder='Select project type'
                                    required
                                />
                            )
                            : undefined}

                        <FormSelectField
                            disabled={isBillingAccountsLoading}
                            hint={billingAccountHint}
                            label='Billing Account'
                            name='billingAccountId'
                            options={billingAccountOptions}
                            placeholder='Select billing account'
                            required={!props.isEdit}
                        />
                    </div>

                    <div className={styles.block}>
                        <FormTextAreaField
                            label='Description'
                            name='description'
                            placeholder='Project description'
                            required
                            rows={4}
                        />
                    </div>

                    <div className={styles.grid}>
                        <FormRadioGroup
                            label='Enforce Topcoder NDA'
                            name='terms'
                            options={[
                                {
                                    label: 'Yes',
                                    value: DEFAULT_NDA_UUID,
                                },
                                {
                                    label: 'No',
                                    value: '',
                                },
                            ]}
                        />

                        <FormGroupsSelect
                            label='Intended Work Groups'
                            name='groups'
                        />
                    </div>
                </section>

                <div className={styles.footer}>
                    <div className={styles.actions}>
                        <Link className={styles.cancelLink} to={cancelPath}>
                            Cancel
                        </Link>

                        <Button
                            disabled={!formState.isDirty || isSaving}
                            label={isSaving ? 'Saving...' : 'Save project'}
                            primary
                            size='lg'
                            type='submit'
                        />
                    </div>
                </div>
            </form>
        </FormProvider>
    )
}

export default ProjectEditorForm
