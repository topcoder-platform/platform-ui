import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { NavigateFunction } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import type {
    ControllerRenderProps,
    UseFormReturn,
} from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import { yupResolver } from '@hookform/resolvers/yup'
import {
    Button,
    ConfirmModal,
    InputCheckbox,
    InputSelectReact,
    InputText,
    LinkButton,
} from '~/libs/ui'

import { FormAddWrapper } from '../common/FormAddWrapper'
import { FormAddDefaultReviewer } from '../../models'
import { formAddDefaultReviewerSchema } from '../../utils'
import {
    useManageAddDefaultReviewer,
    useManageAddDefaultReviewerProps,
} from '../../hooks'

import styles from './DefaultReviewersAddForm.module.scss'

interface Props {
    className?: string
}

const opportunityTypeOptions = [
    { label: 'None', value: '' },
    { label: 'Regular Review', value: 'REGULAR_REVIEW' },
    { label: 'Component Dev Review', value: 'COMPONENT_DEV_REVIEW' },
    { label: 'Spec Review', value: 'SPEC_REVIEW' },
    { label: 'Iterative Review', value: 'ITERATIVE_REVIEW' },
    { label: 'Scenarios Review', value: 'SCENARIOS_REVIEW' },
]

export const DefaultReviewersAddForm: FC<Props> = (props: Props) => {
    const [removeConfirmationOpen, setRemoveConfirmationOpen] = useState(false)
    const navigate: NavigateFunction = useNavigate()
    const { id }: { id?: string } = useParams<{ id?: string }>()
    const isEdit = !!id

    const {
        challengeTracks,
        challengeTypes,
        defaultReviewerInfo,
        doAddDefaultReviewer,
        doRemoveDefaultReviewer,
        doUpdateDefaultReviewer,
        isFetchingChallengeTracks,
        isFetchingChallengeTypes,
        isFetchingPhases,
        isFetchingScorecards,
        isFetchingTimelineTemplates,
        isLoading,
        isRemoving,
        phases,
        scorecards,
        timelineTemplates,
    }: useManageAddDefaultReviewerProps = useManageAddDefaultReviewer(id)

    const challengeTypesOptions = useMemo(
        () => challengeTypes.map(item => ({
            label: item.name,
            value: item.id,
        })),
        [challengeTypes],
    )

    const challengeTracksOptions = useMemo(
        () => challengeTracks.map(item => ({
            label: item.name,
            value: item.id,
        })),
        [challengeTracks],
    )

    const timelineTemplateOptions = useMemo(
        () => [
            { label: 'None', value: '' },
            ...timelineTemplates.map(item => ({
                label: item.name,
                value: item.id,
            })),
        ],
        [timelineTemplates],
    )

    const scorecardOptions = useMemo(
        () => scorecards.map(item => ({
            label: item.name,
            value: item.id,
        })),
        [scorecards],
    )

    const phaseNameOptions = useMemo(
        () => phases.map(item => ({
            label: item.name,
            value: item.name,
        })),
        [phases],
    )

    const opportunityOptions = useMemo(() => opportunityTypeOptions, [])

    const {
        control,
        handleSubmit,
        register,
        reset,
        watch,
        formState: { errors, isDirty },
    }: UseFormReturn<FormAddDefaultReviewer> = useForm({
        defaultValues: {
            baseCoefficient: 0,
            fixedAmount: 0,
            incrementalCoefficient: 0,
            isAIReviewer: false,
            isMemberReview: false,
            memberReviewerCount: 0,
            opportunityType: '',
            phaseId: '',
            phaseName: '',
            scorecardId: '',
            shouldOpenOpportunity: true,
            timelineTemplateId: '',
            trackId: '',
            typeId: '',
        },
        mode: 'all',
        resolver: yupResolver(formAddDefaultReviewerSchema),
    })

    const onSubmit = useCallback(
        (data: FormAddDefaultReviewer) => {
            const requestBody = _.pickBy(data, _.identity)
            if (isEdit) {
                doUpdateDefaultReviewer(requestBody, () => {
                    navigate('./../..')
                })
            } else {
                doAddDefaultReviewer(requestBody, () => {
                    navigate('./..')
                })
            }
        },
        [doAddDefaultReviewer, doUpdateDefaultReviewer, isEdit, navigate],
    )

    const isMemberReview = watch('isMemberReview')

    useEffect(() => {
        if (defaultReviewerInfo) {
            reset({
                baseCoefficient: defaultReviewerInfo.baseCoefficient ?? 0,
                fixedAmount: defaultReviewerInfo.fixedAmount ?? 0,
                incrementalCoefficient: defaultReviewerInfo.incrementalCoefficient ?? 0,
                isAIReviewer: defaultReviewerInfo.isAIReviewer,
                isMemberReview: defaultReviewerInfo.isMemberReview,
                memberReviewerCount: defaultReviewerInfo.memberReviewerCount ?? 0,
                opportunityType: defaultReviewerInfo.opportunityType ?? '',
                phaseId: defaultReviewerInfo.phaseId ?? '',
                phaseName: defaultReviewerInfo.phaseName,
                scorecardId: defaultReviewerInfo.scorecardId,
                shouldOpenOpportunity: defaultReviewerInfo.shouldOpenOpportunity,
                timelineTemplateId: defaultReviewerInfo.timelineTemplateId ?? '',
                trackId: defaultReviewerInfo.trackId,
                typeId: defaultReviewerInfo.typeId,
            })
        }
    }, [defaultReviewerInfo, reset])

    return (
        <>
            <FormAddWrapper
                className={classNames(styles.container, props.className)}
                isAdding={isLoading}
                onSubmit={handleSubmit(onSubmit)}
                actions={(
                    <>
                        {isEdit && (
                            <div className={styles.btnDelete}>
                                <Button
                                    disabled={isLoading}
                                    primary
                                    size='lg'
                                    variant='danger'
                                    onClick={function onClick() {
                                        setRemoveConfirmationOpen(true)
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        )}
                        <Button
                            disabled={!isDirty || isLoading}
                            primary
                            size='lg'
                            type='submit'
                        >
                            Save Changes
                        </Button>
                        <LinkButton
                            secondary
                            size='lg'
                            to={isEdit ? './../..' : './..'}
                        >
                            Cancel
                        </LinkButton>
                    </>
                )}
            >
                <Controller
                    name='typeId'
                    control={control}
                    render={function render(controlProps: {
                    field: ControllerRenderProps<FormAddDefaultReviewer, 'typeId'>
                }) {
                        return (
                            <InputSelectReact
                                name='typeId'
                                label='Challenge Type'
                                placeholder='Select'
                                options={challengeTypesOptions}
                                value={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                onBlur={controlProps.field.onBlur}
                                classNameWrapper={styles.inputField}
                                disabled={isLoading}
                                isLoading={isFetchingChallengeTypes}
                                dirty
                                error={_.get(errors, 'typeId.message')}
                            />
                        )
                    }}
                />
                <Controller
                    name='trackId'
                    control={control}
                    render={function render(controlProps: {
                    field: ControllerRenderProps<FormAddDefaultReviewer, 'trackId'>
                }) {
                        return (
                            <InputSelectReact
                                name='trackId'
                                label='Challenge Track'
                                placeholder='Select'
                                options={challengeTracksOptions}
                                value={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                onBlur={controlProps.field.onBlur}
                                classNameWrapper={styles.inputField}
                                disabled={isLoading}
                                isLoading={isFetchingChallengeTracks}
                                dirty
                                error={_.get(errors, 'trackId.message')}
                            />
                        )
                    }}
                />
                <Controller
                    name='timelineTemplateId'
                    control={control}
                    render={function render(controlProps: {
                    field: ControllerRenderProps<FormAddDefaultReviewer, 'timelineTemplateId'>
                }) {
                        return (
                            <InputSelectReact
                                name='timelineTemplateId'
                                label='Timeline Template'
                                placeholder='Select'
                                options={timelineTemplateOptions}
                                value={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                onBlur={controlProps.field.onBlur}
                                classNameWrapper={styles.inputField}
                                disabled={isLoading}
                                isLoading={isFetchingTimelineTemplates}
                                dirty
                                error={_.get(errors, 'timelineTemplateId.message')}
                            />
                        )
                    }}
                />
                <Controller
                    name='scorecardId'
                    control={control}
                    render={function render(controlProps: {
                    field: ControllerRenderProps<FormAddDefaultReviewer, 'scorecardId'>
                }) {
                        return (
                            <InputSelectReact
                                name='scorecardId'
                                label='Scorecard'
                                placeholder='Select'
                                options={scorecardOptions}
                                value={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                onBlur={controlProps.field.onBlur}
                                classNameWrapper={styles.inputField}
                                disabled={isLoading}
                                isLoading={isFetchingScorecards}
                                dirty
                                error={_.get(errors, 'scorecardId.message')}
                            />
                        )
                    }}
                />
                <Controller
                    name='phaseName'
                    control={control}
                    render={function render(controlProps: {
                    field: ControllerRenderProps<FormAddDefaultReviewer, 'phaseName'>
                }) {
                        return (
                            <InputSelectReact
                                name='phaseName'
                                label='Phase Name'
                                placeholder='Select'
                                options={phaseNameOptions}
                                value={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                onBlur={controlProps.field.onBlur}
                                classNameWrapper={styles.inputField}
                                disabled={isLoading}
                                isLoading={isFetchingPhases}
                                dirty
                                error={_.get(errors, 'phaseName.message')}
                            />
                        )
                    }}
                />
                <div className={styles.inputField}>
                    <Controller
                        name='isMemberReview'
                        control={control}
                        render={function render(controlProps: {
                        field: ControllerRenderProps<FormAddDefaultReviewer, 'isMemberReview'>
                    }) {
                            return (
                                <InputCheckbox
                                    name='isMemberReview'
                                    label='Is Member Review'
                                    onChange={function onChange(event: Event) {
                                        const target = event.target as HTMLInputElement | null
                                        controlProps.field.onChange(target?.checked ?? false)
                                    }}
                                    checked={controlProps.field.value}
                                    disabled={isLoading}
                                />
                            )
                        }}
                    />
                </div>
                {isMemberReview && (
                    <InputText
                        type='number'
                        name='memberReviewerCount'
                        label='Member Reviewer Count'
                        placeholder='Enter count'
                        tabIndex={0}
                        forceUpdateValue
                        onChange={_.noop}
                        error={_.get(errors, 'memberReviewerCount.message')}
                        inputControl={register('memberReviewerCount', {
                            valueAsNumber: true,
                        })}
                        dirty
                        disabled={isLoading}
                        classNameWrapper={styles.inputField}
                    />
                )}
                <InputText
                    type='number'
                    name='fixedAmount'
                    label='Fixed Amount'
                    placeholder='Enter amount'
                    tabIndex={0}
                    forceUpdateValue
                    onChange={_.noop}
                    error={_.get(errors, 'fixedAmount.message')}
                    inputControl={register('fixedAmount', {
                        valueAsNumber: true,
                    })}
                    dirty
                    disabled={isLoading}
                    classNameWrapper={styles.inputField}
                />
                <InputText
                    type='number'
                    name='baseCoefficient'
                    label='Base Coefficient'
                    placeholder='Enter value'
                    tabIndex={0}
                    forceUpdateValue
                    onChange={_.noop}
                    error={_.get(errors, 'baseCoefficient.message')}
                    inputControl={register('baseCoefficient', {
                        valueAsNumber: true,
                    })}
                    dirty
                    disabled={isLoading}
                    classNameWrapper={styles.inputField}
                />
                <InputText
                    type='number'
                    name='incrementalCoefficient'
                    label='Incremental Coefficient'
                    placeholder='Enter value'
                    tabIndex={0}
                    forceUpdateValue
                    onChange={_.noop}
                    error={_.get(errors, 'incrementalCoefficient.message')}
                    inputControl={register('incrementalCoefficient', {
                        valueAsNumber: true,
                    })}
                    dirty
                    disabled={isLoading}
                    classNameWrapper={styles.inputField}
                />
                <Controller
                    name='opportunityType'
                    control={control}
                    render={function render(controlProps: {
                    field: ControllerRenderProps<FormAddDefaultReviewer, 'opportunityType'>
                }) {
                        return (
                            <InputSelectReact
                                name='opportunityType'
                                label='Opportunity Type'
                                placeholder='Select'
                                options={opportunityOptions}
                                value={controlProps.field.value}
                                onChange={controlProps.field.onChange}
                                onBlur={controlProps.field.onBlur}
                                classNameWrapper={styles.inputField}
                                disabled={isLoading}
                                dirty
                                error={_.get(errors, 'opportunityType.message')}
                            />
                        )
                    }}
                />
                <div className={styles.inputField}>
                    <Controller
                        name='isAIReviewer'
                        control={control}
                        render={function render(controlProps: {
                        field: ControllerRenderProps<FormAddDefaultReviewer, 'isAIReviewer'>
                    }) {
                            return (
                                <InputCheckbox
                                    name='isAIReviewer'
                                    label='Is AI Reviewer'
                                    onChange={function onChange(event: Event) {
                                        const target = event.target as HTMLInputElement | null
                                        controlProps.field.onChange(target?.checked ?? false)
                                    }}
                                    checked={controlProps.field.value}
                                    disabled={isLoading}
                                />
                            )
                        }}
                    />
                </div>
                <div className={styles.inputField}>
                    <Controller
                        name='shouldOpenOpportunity'
                        control={control}
                        render={function render(controlProps: {
                        field: ControllerRenderProps<FormAddDefaultReviewer, 'shouldOpenOpportunity'>
                    }) {
                            return (
                                <InputCheckbox
                                    name='shouldOpenOpportunity'
                                    label='Should Open Opportunity'
                                    onChange={function onChange(event: Event) {
                                        const target = event.target as HTMLInputElement | null
                                        controlProps.field.onChange(target?.checked ?? false)
                                    }}
                                    checked={controlProps.field.value}
                                    disabled={isLoading}
                                />
                            )
                        }}
                    />
                </div>
            </FormAddWrapper>
            <ConfirmModal
                title='Delete Confirmation'
                action='delete'
                isLoading={isRemoving}
                open={removeConfirmationOpen}
                onClose={function onClose() {
                    setRemoveConfirmationOpen(false)
                }}
                onConfirm={function onConfirm() {
                    doRemoveDefaultReviewer(() => {
                        setRemoveConfirmationOpen(false)
                        navigate('./../..')
                    })
                }}
            >
                <div>Are you sure you want to delete this default reviewer?</div>
            </ConfirmModal>
        </>
    )
}

export default DefaultReviewersAddForm
