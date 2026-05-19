import * as yup from 'yup'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useFieldArray,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import _ from 'lodash'

import {
    BaseModal,
    Button,
    FormToggleSwitch,
    IconOutline,
    InputSelect,
    InputSelectOption,
    InputSelectReact,
    InputText,
    InputTextarea,
    LoadingSpinner,
} from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { ChallengeTrack, ChallengeType } from '../../lib/models'
import { getChallengeTracks, getChallengeTypes } from '../../lib/services/challenge-management.service'
import { AiWorkflow, getAiWorkflows } from '../../lib/services/ai-workflows.service'
import { createAiReviewTemplate, CreateAiReviewTemplateRequest } from '../../lib/services/ai-templates.service'

import styles from './CreateTemplateModal.module.scss'

interface WorkflowFormItem {
    isGating: boolean
    weightPercent: number
    workflowId: string
}

interface FormValues {
    autoFinalize: boolean
    challengeTrack: string
    challengeType: string
    description: string
    disabled: boolean
    minPassingThreshold: number
    mode: string
    title: string
    workflows: WorkflowFormItem[]
}

const MODE_OPTIONS: InputSelectOption[] = [
    { label: 'AI Gating', value: 'AI_GATING' },
    { label: 'AI Only', value: 'AI_ONLY' },
]

const schema = yup.object()
    .shape({
        autoFinalize: yup.boolean()
            .required(),
        challengeTrack: yup.string()
            .required('Challenge track is required'),
        challengeType: yup.string()
            .required('Challenge type is required'),
        description: yup.string()
            .required('Description is required'),
        disabled: yup.boolean()
            .required(),
        minPassingThreshold: yup
            .number()
            .required('Passing threshold is required')
            .min(0, 'Must be at least 0')
            .max(100, 'Must be at most 100'),
        mode: yup.string()
            .required('Mode is required'),
        title: yup.string()
            .required('Title is required')
            .min(3, 'Title must be at least 3 characters'),
        workflows: yup
            .array()
            .of(
                yup.object()
                    .shape({
                        isGating: yup.boolean()
                            .required(),
                        weightPercent: yup
                            .number()
                            .required('Weight is required')
                            .min(0, 'Must be at least 0')
                            .max(100, 'Must be at most 100'),
                        workflowId: yup.string()
                            .required('Workflow is required'),
                    }),
            )
            .min(1, 'At least one workflow is required')
            .test(
                'sum-100',
                'Total workflow weights must equal 100%',
                workflows => {
                    if (!workflows || workflows.length === 0) {
                        return true
                    }

                    const sum: number = workflows.reduce(
                        (acc: number, w) => acc + (w?.weightPercent || 0),
                        0,
                    )
                    return sum === 100
                },
            ),
    })

interface Props {
    onClose: () => void
    onCreated: () => void
    open: boolean
}

export const CreateTemplateModal: FC<Props> = (props: Props) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [tracks, setTracks] = useState<ChallengeTrack[]>([])
    const [types, setTypes] = useState<ChallengeType[]>([])
    const [workflows, setWorkflows] = useState<AiWorkflow[]>([])
    const [isLoadingData, setIsLoadingData] = useState(true)

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isDirty },
        reset,
        watch,
    }: UseFormReturn<FormValues> = useForm<FormValues>({
        defaultValues: {
            autoFinalize: false,
            challengeTrack: '',
            challengeType: '',
            description: '',
            disabled: false,
            minPassingThreshold: 70,
            mode: 'AI_GATING',
            title: '',
            workflows: [],
        },
        mode: 'all',
        resolver: yupResolver(schema) as never,
    })

    const fieldArrayResult = useFieldArray({
        control,
        name: 'workflows',
    })
    const fields = fieldArrayResult.fields
    const append = fieldArrayResult.append
    const remove = fieldArrayResult.remove

    const trackOptions: InputSelectOption[] = useMemo(() => [
        { label: 'Select track', value: '' },
        ...tracks.map(t => {
            const trackValue: string = (t as ChallengeTrack & { track?: string }).track || t.name.toUpperCase()
            return { label: t.name, value: trackValue }
        }),
    ], [tracks])

    const typeOptions: InputSelectOption[] = useMemo(() => [
        { label: 'Select type', value: '' },
        ...types.map(t => ({ label: t.name, value: t.abbreviation })),
    ], [types])

    const workflowOptions: InputSelectOption[] = useMemo(() => workflows
        .filter(w => !w.disabled)
        .map(w => ({ label: w.name, value: w.id })), [workflows])

    const watchedWorkflows: WorkflowFormItem[] = watch('workflows') || []
    const selectedWorkflowIds: string[] = watchedWorkflows.map(
        (w: WorkflowFormItem) => w.workflowId,
    )

    const availableWorkflowOptions: InputSelectOption[] = useMemo(
        () => workflowOptions.filter(o => !selectedWorkflowIds.includes(o.value as string)),
        [workflowOptions, selectedWorkflowIds],
    )

    useEffect(() => {
        if (props.open) {
            setIsLoadingData(true)
            Promise.all([
                getChallengeTracks(),
                getChallengeTypes(),
                getAiWorkflows(),
            ])
                .then(([tracksData, typesData, workflowsData]) => {
                    setTracks(tracksData || [])
                    setTypes(typesData || [])
                    setWorkflows(workflowsData || [])
                })
                .catch(() => {
                    setTracks([])
                    setTypes([])
                    setWorkflows([])
                })
                .finally(() => setIsLoadingData(false))
        }
    }, [props.open])

    const handleClose = useCallback(() => {
        if (!isSubmitting) {
            reset()
            props.onClose()
        }
    }, [isSubmitting, props, reset])

    const handleAddWorkflow = useCallback(() => {
        append({ isGating: false, weightPercent: 100, workflowId: '' })
    }, [append])

    const onSubmit = useCallback((data: FormValues) => {
        setIsSubmitting(true)

        const formula: Record<string, number> = {}
        data.workflows.forEach((w: WorkflowFormItem) => {
            formula[w.workflowId] = w.weightPercent / 100
        })

        const request: CreateAiReviewTemplateRequest = {
            autoFinalize: data.autoFinalize,
            challengeTrack: data.challengeTrack,
            challengeType: data.challengeType,
            description: data.description || '',
            disabled: data.disabled,
            formula,
            minPassingThreshold: data.minPassingThreshold,
            mode: data.mode,
            title: data.title,
            workflows: data.workflows.map(w => ({
                isGating: w.isGating,
                weightPercent: w.weightPercent,
                workflowId: w.workflowId,
            })),
        }

        createAiReviewTemplate(request)
            .then(() => {
                reset()
                props.onCreated()
                props.onClose()
            })
            .catch(() => {
                // Error handling done via toast in xhr
            })
            .finally(() => setIsSubmitting(false))
    }, [props, reset])

    return (
        <BaseModal
            allowBodyScroll
            blockScroll
            size='body'
            title='Create Review Template'
            onClose={handleClose}
            open={props.open}
        >
            {isLoadingData ? (
                <div className={styles.loadingContainer}>
                    <LoadingSpinner />
                </div>
            ) : (
                <form
                    className={styles.container}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <div className={styles.formGrid}>
                        <InputText
                            type='text'
                            name='title'
                            label='Title'
                            placeholder='Enter template title'
                            tabIndex={0}
                            onChange={_.noop}
                            inputControl={register('title')}
                            error={_.get(errors, 'title.message')}
                            dirty
                            disabled={isSubmitting}
                        />

                        <Controller
                            name='challengeTrack'
                            control={control}
                            render={function render(controlProps: {
                                field: ControllerRenderProps<FormValues, 'challengeTrack'>
                            }) {
                                return (
                                    <InputSelect
                                        name='challengeTrack'
                                        label='Challenge Track'
                                        options={trackOptions}
                                        value={controlProps.field.value}
                                        onChange={controlProps.field.onChange}
                                        error={_.get(errors, 'challengeTrack.message')}
                                        dirty
                                        disabled={isSubmitting}
                                        tabIndex={0}
                                    />
                                )
                            }}
                        />

                        <Controller
                            name='challengeType'
                            control={control}
                            render={function render(controlProps: {
                                field: ControllerRenderProps<FormValues, 'challengeType'>
                            }) {
                                return (
                                    <InputSelect
                                        name='challengeType'
                                        label='Challenge Type'
                                        options={typeOptions}
                                        value={controlProps.field.value}
                                        onChange={controlProps.field.onChange}
                                        error={_.get(errors, 'challengeType.message')}
                                        dirty
                                        disabled={isSubmitting}
                                        tabIndex={0}
                                    />
                                )
                            }}
                        />

                        <Controller
                            name='mode'
                            control={control}
                            render={function render(controlProps: {
                                field: ControllerRenderProps<FormValues, 'mode'>
                            }) {
                                return (
                                    <InputSelect
                                        name='mode'
                                        label='Mode'
                                        options={MODE_OPTIONS}
                                        value={controlProps.field.value}
                                        onChange={controlProps.field.onChange}
                                        error={_.get(errors, 'mode.message')}
                                        dirty
                                        disabled={isSubmitting}
                                        tabIndex={0}
                                    />
                                )
                            }}
                        />

                        <InputText
                            type='number'
                            name='minPassingThreshold'
                            label='Passing Threshold (%)'
                            placeholder='70'
                            tabIndex={0}
                            onChange={_.noop}
                            inputControl={register('minPassingThreshold', { max: 100, min: 0, valueAsNumber: true })}
                            error={_.get(errors, 'minPassingThreshold.message')}
                            dirty
                            disabled={isSubmitting}
                        />
                    </div>

                    <InputTextarea
                        name='description'
                        label='Description'
                        placeholder='Enter template description'
                        tabIndex={0}
                        onChange={_.noop}
                        inputControl={register('description')}
                        error={_.get(errors, 'description.message')}
                        dirty
                        disabled={isSubmitting}
                    />

                    <div className={styles.toggles}>
                        <Controller
                            name='autoFinalize'
                            control={control}
                            render={function render(controlProps: {
                                field: ControllerRenderProps<FormValues, 'autoFinalize'>
                            }) {
                                return (
                                    <div className={styles.toggleItem}>
                                        <FormToggleSwitch
                                            name='autoFinalize'
                                            value={controlProps.field.value}
                                            onChange={controlProps.field.onChange}
                                            disabled={isSubmitting}
                                        />
                                        <span className={styles.toggleLabel}>Auto Finalize</span>
                                    </div>
                                )
                            }}
                        />

                        <Controller
                            name='disabled'
                            control={control}
                            render={function render(controlProps: {
                                field: ControllerRenderProps<FormValues, 'disabled'>
                            }) {
                                return (
                                    <div className={styles.toggleItem}>
                                        <FormToggleSwitch
                                            name='disabled'
                                            value={controlProps.field.value}
                                            onChange={controlProps.field.onChange}
                                            disabled={isSubmitting}
                                        />
                                        <span className={styles.toggleLabel}>Disabled</span>
                                    </div>
                                )
                            }}
                        />
                    </div>

                    <div className={styles.workflowsSection}>
                        <div className={styles.workflowsHeader}>
                            <h4>Workflows</h4>
                            <Button
                                secondary
                                size='sm'
                                onClick={handleAddWorkflow}
                                disabled={isSubmitting || availableWorkflowOptions.length === 0}
                            >
                                Add Workflow
                            </Button>
                        </div>

                        {errors.workflows && typeof errors.workflows.message === 'string' && (
                            <p className={styles.errorText}>{errors.workflows.message}</p>
                        )}

                        {fields.map((field, index) => (
                            <div key={field.id} className={styles.workflowRow}>
                                <Controller
                                    name={`workflows.${index}.workflowId`}
                                    control={control}
                                    render={function render(controlProps: {
                                        field: ControllerRenderProps<FormValues, `workflows.${number}.workflowId`>
                                    }) {
                                        const currentValue: string = controlProps.field.value
                                        const currentOption: InputSelectOption | undefined = workflowOptions
                                            .find(o => o.value === currentValue)
                                        const options: InputSelectOption[] = currentOption
                                            ? [currentOption, ...availableWorkflowOptions]
                                            : availableWorkflowOptions

                                        return (
                                            <InputSelectReact
                                                name={`workflows.${index}.workflowId`}
                                                label='Workflow'
                                                placeholder='Select workflow'
                                                options={options}
                                                value={controlProps.field.value}
                                                onChange={controlProps.field.onChange}
                                                error={_.get(errors, `workflows.${index}.workflowId.message`)}
                                                dirty
                                                disabled={isSubmitting}
                                                classNameWrapper={styles.workflowSelect}
                                            />
                                        )
                                    }}
                                />

                                <InputText
                                    type='number'
                                    name={`workflows.${index}.weightPercent`}
                                    label='Weight (%)'
                                    placeholder='100'
                                    tabIndex={0}
                                    onChange={_.noop}
                                    inputControl={register(`workflows.${index}.weightPercent`, {
                                        max: 100,
                                        min: 0,
                                        valueAsNumber: true,
                                    })}
                                    error={_.get(errors, `workflows.${index}.weightPercent.message`)}
                                    dirty
                                    disabled={isSubmitting}
                                    classNameWrapper={styles.weightInput}
                                />

                                <Controller
                                    name={`workflows.${index}.isGating`}
                                    control={control}
                                    render={function render(controlProps: {
                                        field: ControllerRenderProps<FormValues, `workflows.${number}.isGating`>
                                    }) {
                                        return (
                                            <div className={styles.toggleItem}>
                                                <FormToggleSwitch
                                                    name={`workflows.${index}.isGating`}
                                                    value={controlProps.field.value}
                                                    onChange={controlProps.field.onChange}
                                                    disabled={isSubmitting}
                                                />
                                                <span className={styles.toggleLabel}>Gating</span>
                                            </div>
                                        )
                                    }}
                                />

                                <button
                                    type='button'
                                    className={styles.removeBtn}
                                    onClick={function onClick() { remove(index) }}
                                    disabled={isSubmitting}
                                >
                                    <IconOutline.TrashIcon />
                                </button>
                            </div>
                        ))}

                        {fields.length === 0 && (
                            <p className={styles.noWorkflows}>No workflows added yet.</p>
                        )}
                    </div>

                    <div className={styles.actionButtons}>
                        <Button
                            secondary
                            size='lg'
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type='submit'
                            primary
                            size='lg'
                            disabled={isSubmitting || !isDirty}
                        >
                            Create Template
                        </Button>
                    </div>

                    {isSubmitting && (
                        <div className={styles.loadingOverlay}>
                            <LoadingSpinner />
                        </div>
                    )}
                </form>
            )}
        </BaseModal>
    )
}

export default CreateTemplateModal
