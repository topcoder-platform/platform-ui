import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
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
import { ChallengeDetailContext } from '../../../../../../contexts'
import { MarkdownReview } from '../../../../../../components/MarkdownReview'
import { FieldMarkdownEditor } from '../../../../../../components/FieldMarkdownEditor'
import { ScorecardViewerContextValue, useScorecardContext } from '../../../ScorecardViewer.context'
import { ScorecardQuestionRow } from '../../ScorecardQuestionRow'

import styles from './ReviewAppeal.module.scss'

interface ReviewAppealProps {
    appeal: AppealInfo
    reviewItem?: ReviewItemInfo
    scorecardQuestion?: ScorecardQuestion
}

const ReviewAppeal: FC<ReviewAppealProps> = props => {
    const {
        actionChallengeRole,
        addAppealResponse,
        isSavingAppealResponse,
        reviewInfo,
    }: ScorecardViewerContextValue = useScorecardContext()

    const { challengeInfo }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )

    // Determine if user can respond to appeal (reviewer/copilot/admin roles)
    const canRespondToAppeal = useMemo(() => {
        const role = actionChallengeRole?.toLowerCase() || ''
        return role.includes('reviewer') || role.includes('admin') || role.includes('copilot')
    }, [actionChallengeRole])

    const canAddAppealResponse = useMemo(
        () => canRespondToAppeal && isAppealsResponsePhase(challengeInfo),
        [challengeInfo, canRespondToAppeal],
    )

    const isReviewerRole = useMemo(() => {
        const role = actionChallengeRole?.toLowerCase() || ''
        return role.includes('reviewer') || role.includes('admin') || role.includes('copilot')
    }, [actionChallengeRole])

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
            ).map(item => ({
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

    return (
        <div className={styles.wrap}>
            <ScorecardQuestionRow
                index='Appeal'
                className={styles.appealRow}
            >
                <div className={styles.content}>
                    {props.appeal.content}
                </div>
            </ScorecardQuestionRow>

            {props.appeal.appealResponse && !showResponseForm && (
                <ScorecardQuestionRow
                    index='Appeal Response'
                    className={styles.responseRow}
                >
                    <div className={styles.content}>
                        {props.appeal.appealResponse.content}
                    </div>
                    {props.appeal.appealResponse.success !== undefined && (
                        <div className={styles.status}>
                            {props.appeal.appealResponse.success ? 'Accepted' : 'Rejected'}
                        </div>
                    )}
                    {canAddAppealResponse && (
                        <div className={styles.responseActions}>
                            <button
                                type='button'
                                onClick={() => setShowResponseForm(true)}
                                disabled={isSavingAppealResponse}
                                className={styles.editResponseButton}
                            >
                                Edit Appeal Response
                            </button>
                        </div>
                    )}
                </ScorecardQuestionRow>
            )}

            {!props.appeal.appealResponse && !showResponseForm && canAddAppealResponse && (
                <div className={styles.responseActions}>
                    <button
                        type='button'
                        onClick={() => setShowResponseForm(true)}
                        disabled={isSavingAppealResponse}
                        className={styles.respondButton}
                    >
                        Respond to Appeal
                    </button>
                </div>
            )}

            {showResponseForm && canAddAppealResponse && (
                <form
                    className={styles.responseForm}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <div className={styles.responseFormHeader}>
                        <label className={styles.responseFormLabel}>Respond to Appeal</label>
                        {props.scorecardQuestion && responseOptions.length > 0 && (
                            <Select
                                className={classNames('react-select-container', styles.responseSelect)}
                                classNamePrefix='select'
                                name='response'
                                placeholder='Select'
                                options={responseOptions}
                                value={updatedResponse}
                                onChange={(option: SingleValue<SelectOption>) => {
                                    setUpdatedResponse(option)
                                }}
                                isDisabled={isSavingAppealResponse}
                            />
                        )}
                    </div>
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
                    <div className={styles.responseFormActions}>
                        <button
                            className={styles.submitButton}
                            type='submit'
                            disabled={isSavingAppealResponse}
                        >
                            Submit Response
                        </button>
                        <button
                            type='button'
                            className={styles.cancelButton}
                            onClick={() => {
                                setShowResponseForm(false)
                                setAppealResponse(props.appeal.appealResponse?.content || '')
                            }}
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

