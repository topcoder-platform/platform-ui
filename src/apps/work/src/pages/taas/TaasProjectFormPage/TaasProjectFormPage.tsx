import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    FormProvider,
    useFieldArray,
    useForm,
} from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from '~/libs/ui'
import { PageWrapper } from '~/apps/review/src/lib'

import {
    ErrorMessage,
    LoadingSpinner,
    ProjectStatus,
} from '../../../lib/components'
import {
    FormTextField,
} from '../../../lib/components/form'
import {
    useFetchTaasProject,
} from '../../../lib/hooks'
import {
    Project,
    TaasJob,
    TaasJobFormData,
    TaasSkill,
} from '../../../lib/models'
import {
    taasProjectSchema,
} from '../../../lib/schemas/taas-project.schema'
import {
    createTaasProject,
    SaveTaasProjectPayload,
    updateTaasProject,
} from '../../../lib/services'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../lib/utils'

import {
    TaasJobFields,
} from './components'
import styles from './TaasProjectFormPage.module.scss'

const MAX_JOBS = 10

interface TaasProjectFormValues {
    name: string
    jobs: TaasJobFormData[]
}

function getDefaultJob(): TaasJobFormData {
    return {
        description: '',
        duration: '',
        people: '',
        role: {
            label: '',
            value: '',
        },
        skills: [],
        title: '',
        workLoad: {
            label: '',
            value: '',
        },
    }
}

function normalizeSkillValue(skill: unknown): TaasSkill | undefined {
    if (typeof skill !== 'object' || !skill) {
        return undefined
    }

    const typedSkill = skill as {
        id?: unknown
        name?: unknown
        skillId?: unknown
    }
    const name = typeof typedSkill.name === 'string'
        ? typedSkill.name.trim()
        : ''
    const skillId = typeof typedSkill.skillId === 'string'
        ? typedSkill.skillId.trim()
        : (
            typeof typedSkill.id === 'string'
                ? typedSkill.id.trim()
                : ''
        )

    if (!name || !skillId) {
        return undefined
    }

    return {
        name,
        skillId,
    }
}

function toFormJob(job: TaasJob): TaasJobFormData {
    const normalizedSkills = Array.isArray(job.skills)
        ? job.skills
            .map(skill => normalizeSkillValue(skill))
            .filter((skill): skill is TaasSkill => !!skill)
        : []

    return {
        description: job.description || '',
        duration: String(job.duration || ''),
        jobId: job.jobId,
        people: String(job.people || ''),
        role: {
            label: job.role?.title || '',
            value: job.role?.value || '',
        },
        skills: normalizedSkills,
        title: job.title || '',
        workLoad: {
            label: job.workLoad?.title || '',
            value: job.workLoad?.value || '',
        },
    }
}

function toSubmitJob(job: TaasJobFormData): TaasJob {
    const skills = Array.isArray(job.skills)
        ? job.skills
            .map(skill => normalizeSkillValue(skill))
            .filter((skill): skill is TaasSkill => !!skill)
        : []

    return {
        description: job.description.trim(),
        duration: String(job.duration),
        jobId: job.jobId,
        people: String(job.people),
        role: {
            title: job.role.label.trim(),
            value: job.role.value.trim(),
        },
        skills,
        title: job.title.trim(),
        workLoad: {
            title: job.workLoad.label.trim(),
            value: job.workLoad.value.trim(),
        },
    }
}

function toFormValues(project: Project | undefined): TaasProjectFormValues {
    if (!project) {
        return {
            jobs: [getDefaultJob()],
            name: '',
        }
    }

    const taasJobs = project.details?.taasDefinition?.taasJobs || []

    return {
        jobs: taasJobs.length
            ? taasJobs.map(job => toFormJob(job))
            : [getDefaultJob()],
        name: project.name || '',
    }
}

export const TaasProjectFormPage: FC = () => {
    const navigate = useNavigate()
    const params: Readonly<{ projectId?: string }> = useParams<'projectId'>()
    const projectId = params.projectId
    const isEdit = !!projectId

    const taasProjectResult = useFetchTaasProject(projectId)
    const [isSaving, setIsSaving] = useState<boolean>(false)

    const formMethods = useForm<TaasProjectFormValues>({
        defaultValues: {
            jobs: [getDefaultJob()],
            name: '',
        },
        mode: 'onChange',
        resolver: yupResolver(taasProjectSchema) as any,
    })

    const control: typeof formMethods.control = formMethods.control
    const formState: typeof formMethods.formState = formMethods.formState
    const handleSubmit: typeof formMethods.handleSubmit = formMethods.handleSubmit
    const reset: typeof formMethods.reset = formMethods.reset

    const jobsFieldArray = useFieldArray({
        control,
        name: 'jobs',
    })
    const fields = jobsFieldArray.fields
    const append = jobsFieldArray.append
    const remove = jobsFieldArray.remove

    useEffect(() => {
        if (!isEdit) {
            reset({
                jobs: [getDefaultJob()],
                name: '',
            })
            return
        }

        if (!taasProjectResult.data) {
            return
        }

        reset(toFormValues(taasProjectResult.data))
    }, [isEdit, reset, taasProjectResult.data])

    const breadCrumb = useMemo(
        () => [
            {
                index: 1,
                label: 'Projects',
            },
            {
                index: 2,
                label: isEdit ? 'Edit TaaS Project' : 'Create TaaS Project',
            },
        ],
        [isEdit],
    )

    const pageTitle = isEdit
        ? 'Edit TaaS Project'
        : 'Create TaaS Project'

    const onSubmit = useCallback(
        async (formData: TaasProjectFormValues): Promise<void> => {
            setIsSaving(true)

            try {
                const payload: SaveTaasProjectPayload = {
                    jobs: formData.jobs.map(job => toSubmitJob(job)),
                    name: formData.name.trim(),
                }

                if (!isEdit) {
                    const createdProject = await createTaasProject(payload)

                    showSuccessToast('TaaS project created successfully')
                    navigate(`/taas/${createdProject.id}/edit`)

                    return
                }

                if (!projectId) {
                    throw new Error('Project id is required for update')
                }

                const updatedProject = await updateTaasProject(projectId, payload)

                showSuccessToast('TaaS project updated successfully')
                reset(toFormValues(updatedProject))

                taasProjectResult.mutate(updatedProject, false)
                    .catch(() => undefined)
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : 'Failed to save TaaS project'

                showErrorToast(errorMessage)
            } finally {
                setIsSaving(false)
            }
        },
        [isEdit, navigate, projectId, reset, taasProjectResult],
    )

    const handleAddJob = useCallback(() => {
        if (fields.length >= MAX_JOBS) {
            return
        }

        append(getDefaultJob())
    }, [append, fields.length])

    const handleRemoveJob = useCallback((index: number) => {
        if (fields.length <= 1) {
            return
        }

        remove(index)
    }, [fields.length, remove])

    const removeHandlers: Array<() => void> = useMemo(
        () => fields.map((_, index) => (): void => {
            handleRemoveJob(index)
        }),
        [fields, handleRemoveJob],
    )

    if (isEdit && taasProjectResult.isLoading) {
        return (
            <PageWrapper
                backUrl='/taas'
                breadCrumb={breadCrumb}
                pageTitle={pageTitle}
            >
                <LoadingSpinner />
            </PageWrapper>
        )
    }

    if (isEdit && taasProjectResult.error) {
        return (
            <PageWrapper
                backUrl='/taas'
                breadCrumb={breadCrumb}
                pageTitle={pageTitle}
            >
                <ErrorMessage message={taasProjectResult.error.message} />
            </PageWrapper>
        )
    }

    if (isEdit && !taasProjectResult.data) {
        return (
            <PageWrapper
                backUrl='/taas'
                breadCrumb={breadCrumb}
                pageTitle={pageTitle}
            >
                <ErrorMessage message='TaaS project not found.' />
            </PageWrapper>
        )
    }

    const projectStatus = taasProjectResult.data?.status

    return (
        <PageWrapper
            backUrl='/taas'
            breadCrumb={breadCrumb}
            pageTitle={pageTitle}
        >
            <div className={styles.wrapper}>
                <div className={styles.topContainer}>
                    <h2 className={styles.title}>{pageTitle}</h2>
                    {projectStatus
                        ? <ProjectStatus status={projectStatus} />
                        : undefined}
                </div>

                <div className={styles.container}>
                    <div className={styles.formContainer}>
                        <div className={styles.textRequired}>* Required</div>
                        <FormProvider {...formMethods}>
                            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                                <section className={styles.section}>
                                    <FormTextField
                                        disabled={isSaving}
                                        label='Title of your project'
                                        maxLength={255}
                                        name='name'
                                        placeholder='Project name'
                                        required
                                    />
                                </section>

                                <section className={styles.section}>
                                    <div className={styles.jobsContainer}>
                                        {fields.map((field, index) => (
                                            <TaasJobFields
                                                canAdd={index === fields.length - 1 && fields.length < MAX_JOBS}
                                                canRemove={fields.length > 1}
                                                index={index}
                                                key={field.id}
                                                onAdd={handleAddJob}
                                                onRemove={removeHandlers[index]}
                                            />
                                        ))}
                                    </div>
                                </section>

                                <div className={styles.buttonContainer}>
                                    <Link className={styles.cancelLink} to='/taas'>
                                        Cancel
                                    </Link>
                                    <Button
                                        disabled={isSaving || !formState.isDirty}
                                        label={isSaving
                                            ? (isEdit ? 'Updating...' : 'Creating...')
                                            : (isEdit ? 'Update' : 'Create')}
                                        primary
                                        size='lg'
                                        type='submit'
                                    />
                                </div>
                            </form>
                        </FormProvider>
                    </div>
                </div>
            </div>
        </PageWrapper>
    )
}

export default TaasProjectFormPage
