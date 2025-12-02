import { FC, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import { get } from 'lodash'
import Select, { SingleValue } from 'react-select'
import classNames from 'classnames'

import { yupResolver } from '@hookform/resolvers/yup'
import { IconAppealResponse, IconEdit } from '~/apps/review/src/lib/assets/icons'

import {
    AppealInfo,
    ChallengeDetailContextModel,
    FormAppealResponse,
    ReviewItemInfo,
    ScorecardQuestion,
    SelectOption,
} from '../../../../../../models'
import { formAppealResponseSchema, isAppealsResponsePhase } from '../../../../../../utils'
import { QUESTION_YES_NO_OPTIONS } from '../../../../../../../config/index.config'
import { useChallengeDetailsContext } from '../../../../../../contexts'
import { FieldMarkdownEditor } from '../../../../../FieldMarkdownEditor'
import { MarkdownReview } from '../../../../../MarkdownReview'
import { ScorecardViewerContextValue, useScorecardViewerContext } from '../../../ScorecardViewer.context'

import styles from './ReviewAppeal.module.scss'

interface ReviewAppealProps extends PropsWithChildren {
    appeal: AppealInfo
    reviewItem?: ReviewItemInfo
    scorecardQuestion?: ScorecardQuestion
    canRespondToAppeal: boolean
}

const ReviewAppeal: FC<ReviewAppealProps> = props => {
    const {
        addAppealResponse,
        isSavingAppealResponse,
    }: ScorecardViewerContextValue = useScorecardViewerContext()

    const { challengeInfo }: ChallengeDetailContextModel = useChallengeDetailsContext()

    const canAddAppealResponse = useMemo(
        () => props.canRespondToAppeal && isAppealsResponsePhase(challengeInfo),
        [challengeInfo, props.canRespondToAppeal],
    )

    const [showResponseForm, setShowResponseForm] = useState(false)
    const [appealResponse, setAppealResponse] = useState(props.appeal.appealResponse?.content || '')
    const [updatedResponse, setUpdatedResponse] = useState<SingleValue<SelectOption>>()

    const responseOptions = useMemo<SelectOption[]>(() => {
        if (!props.scorecardQuestion) {
            return []
        }

        if (props.scorecardQuestion.type === 'SCALE') {
            const length = props.scorecardQuestion.scaleMax - props.scorecardQuestion.scaleMin + 1
            return Array.from(
                new Array(length),
                (x, i) => `${i + props.scorecardQuestion!.scaleMin}`,
            )
                .map(item => ({
                    label: item,
                    value: item,
                }))
        }

        if (props.scorecardQuestion.type === 'YES_NO') {
            return QUESTION_YES_NO_OPTIONS
        }

        return []
    }, [props.scorecardQuestion])

    const {
        handleSubmit,
        control,
        formState: { errors },
    }: UseFormReturn<FormAppealResponse> = useForm({
        defaultValues: {
            response: '',
        },
        mode: 'all',
        resolver: yupResolver(formAppealResponseSchema),
    })

    const onSubmit = useCallback((formData: FormAppealResponse) => {
        if (addAppealResponse && props.reviewItem) {
            addAppealResponse(
                formData.response,
                updatedResponse?.value ?? '',
                props.appeal,
                props.reviewItem,
                () => {
                    setAppealResponse(formData.response)
                    setShowResponseForm(false)
                },
            )
        }
    }, [addAppealResponse, props.appeal, props.reviewItem, updatedResponse])

    useEffect(() => {
        setAppealResponse(props.appeal.appealResponse?.content || '')
    }, [props.appeal.appealResponse?.content])

    const handleShowResponseForm = useCallback(() => {
        setShowResponseForm(true)
    }, [])

    const handleCancelResponseForm = useCallback(() => {
        setShowResponseForm(false)
        setAppealResponse(props.appeal.appealResponse?.content || '')
    }, [props.appeal.appealResponse?.content])

    const handleResponseChange = useCallback((option: SingleValue<SelectOption>) => {
        setUpdatedResponse(option)
    }, [])

    return (
        <div className={styles.container}>
            <div className={styles.blockAppealComment}>
                <span className={styles.textTitle}>
                    <strong>Appeal</strong>
                </span>
                <MarkdownReview value={props.appeal.content} />
                {props.children}
            </div>

            {props.appeal.appealResponse && !showResponseForm && (
                <div className={styles.blockAppealResponse}>
                    <span className={styles.textTitle}>Appeal Response</span>
                    <MarkdownReview value={props.appeal.appealResponse.content} />
                    {props.appeal.appealResponse.success !== undefined && (
                        <div className={styles.status}>
                            {props.appeal.appealResponse.success ? 'Accepted' : 'Rejected'}
                        </div>
                    )}
                    {canAddAppealResponse && (
                        <div className={styles.blockBtns}>
                            <button
                                type='button'
                                onClick={handleShowResponseForm}
                                disabled={isSavingAppealResponse}
                                className={styles.linkStyleBtn}
                            >
                                <IconEdit />
                                Edit
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!props.appeal.appealResponse && !showResponseForm && canAddAppealResponse && (
                <button
                    type='button'
                    onClick={handleShowResponseForm}
                    disabled={isSavingAppealResponse}
                    className={styles.linkStyleBtn}
                >
                    <IconAppealResponse />
                    Respond to Appeal
                </button>
            )}

            {showResponseForm && canAddAppealResponse && (
                <form
                    className={styles.blockForm}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <label>Respond to Appeal</label>
                    {props.scorecardQuestion && responseOptions.length > 0 && (
                        <Select
                            className={classNames('react-select-container', styles.responseSelect)}
                            classNamePrefix='select'
                            name='response'
                            placeholder='Select'
                            options={responseOptions}
                            value={updatedResponse}
                            onChange={handleResponseChange}
                            isDisabled={isSavingAppealResponse}
                        />
                    )}
                    <Controller
                        name='response'
                        control={control}
                        render={function render(controlProps: {
                            field: ControllerRenderProps<
                                FormAppealResponse,
                                'response'
                            >
                        }) {
                            return (
                                <FieldMarkdownEditor
                                    initialValue={appealResponse}
                                    className={styles.markdownEditor}
                                    onChange={controlProps.field.onChange}
                                    showBorder
                                    onBlur={controlProps.field.onBlur}
                                    error={get(errors, 'response.message')}
                                    disabled={isSavingAppealResponse}
                                    uploadCategory='appeal-response'
                                />
                            )
                        }}
                    />
                    <div className={styles.blockBtns}>
                        <button
                            className='filledButton'
                            type='submit'
                            disabled={isSavingAppealResponse}
                        >
                            Submit Response
                        </button>
                        <button
                            type='button'
                            className='borderButton'
                            onClick={handleCancelResponseForm}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default ReviewAppeal
