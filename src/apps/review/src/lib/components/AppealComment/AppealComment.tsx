/**
 * AppealComment.
 */
import { FC, useCallback, useContext, useMemo, useState } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import { bind, get } from 'lodash'
import Select, { SingleValue } from 'react-select'
import classNames from 'classnames'

import { yupResolver } from '@hookform/resolvers/yup'

import { MarkdownReview } from '../MarkdownReview'
import { FieldMarkdownEditor } from '../FieldMarkdownEditor'
import {
    AppealInfo,
    ChallengeDetailContextModel,
    FormAppealResponse,
    ReviewItemInfo,
    ScorecardQuestion,
    SelectOption,
} from '../../models'
import { formAppealResponseSchema, isAppealsResponsePhase } from '../../utils'
import {
    QUESTION_YES_NO_OPTIONS,
} from '../../../config/index.config'
import { ChallengeDetailContext } from '../../contexts'

import styles from './AppealComment.module.scss'

interface Props {
    className?: string
    data: AppealInfo
    scorecardQuestion: ScorecardQuestion
    isSavingAppealResponse: boolean
    reviewItem: ReviewItemInfo
    appealInfo?: AppealInfo
    addAppealResponse: (
        content: string,
        updatedResponse: string,
        appeal: AppealInfo,
        reviewItem: ReviewItemInfo,
        success: () => void,
    ) => void
}

export const AppealComment: FC<Props> = (props: Props) => {
    const [appealResponse, setAppealResponse] = useState('')
    const [showResponseForm, setShowResponseForm] = useState(false)

    const { challengeInfo }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const canAddAppealResponse = useMemo(() => isAppealsResponsePhase(challengeInfo), [challengeInfo])

    const [updatedResponse, setUpdatedResponse] = useState<
        SingleValue<{
            label: string
            value: string
        }>
    >()

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

    const onSubmit = useCallback((data: FormAppealResponse) => {
        if (props.appealInfo) {
            props.addAppealResponse(
                data.response,
                updatedResponse?.value ?? '',
                props.appealInfo,
                props.reviewItem,
                () => {
                    setAppealResponse(data.response)
                    setShowResponseForm(false)
                },
            )
        }
    }, [updatedResponse, props.appealInfo, props.addAppealResponse, props.reviewItem])

    const responseOptions = useMemo<SelectOption[]>(() => {
        if (props.scorecardQuestion.type === 'SCALE') {
            const length
                = props.scorecardQuestion.scaleMax
                - props.scorecardQuestion.scaleMin
                + 1
            return Array.from(
                new Array(length),
                (x, i) => `${i + props.scorecardQuestion.scaleMin}`,
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

    return (
        <div className={classNames(styles.container, props.className)}>
            <div className={styles.blockAppealComment}>
                <span className={styles.textTitle}>Appeal Comment</span>
                <MarkdownReview value={props.data.content} />
            </div>
            {!showResponseForm && appealResponse && (
                <div className={styles.blockAppealResponse}>
                    <span className={styles.textTitle}>Appeal Response</span>
                    <MarkdownReview value={appealResponse} />
                    {canAddAppealResponse && (
                        <div className={styles.blockBtns}>
                            <button
                                onClick={function onClick() {
                                    setShowResponseForm(true)
                                }}
                                className='filledButton'
                                type='button'
                            >
                                Edit Appeal Response
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!showResponseForm && !appealResponse && canAddAppealResponse && (
                <button
                    type='button'
                    className='borderButton'
                    onClick={function onClick() {
                        setShowResponseForm(true)
                    }}
                >
                    Respond to Appeal
                </button>
            )}

            {showResponseForm && (
                <form
                    className={styles.blockForm}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <div className={styles.blockReaponseAppealHeader}>
                        <label>Respond Appeal</label>

                        <Select
                            className={classNames('react-select-container')}
                            classNamePrefix='select'
                            name='response'
                            placeholder='Select'
                            options={responseOptions}
                            value={updatedResponse}
                            onChange={function onChange(
                                option: SingleValue<{
                                    label: string
                                    value: string
                                }>,
                            ) {
                                setUpdatedResponse(option)
                            }}
                            isDisabled={props.isSavingAppealResponse}
                        />
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
                                    disabled={props.isSavingAppealResponse}
                                />
                            )
                        }}
                    />
                    <div className={styles.blockBtns}>
                        <button
                            className='filledButton'
                            type='submit'
                            disabled={props.isSavingAppealResponse}
                        >
                            Submit Appeal
                        </button>
                        <button
                            type='button'
                            className='borderButton'
                            onClick={bind(
                                setShowResponseForm,
                                undefined,
                                false,
                            )}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default AppealComment
