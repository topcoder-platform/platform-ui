import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import { get, includes } from 'lodash'

import { yupResolver } from '@hookform/resolvers/yup'
import { IconAppeal, IconEdit } from '~/apps/review/src/lib/assets/icons'
import { ADMIN, COPILOT, REVIEWER } from '~/apps/review/src/config/index.config'

import {
    AppealInfo,
    ChallengeDetailContextModel,
    FormAppealResponse,
    ReviewItemInfo,
    ScorecardQuestion,
} from '../../../../../../models'
import { ReviewItemComment } from '../../../../../../models/ReviewItemComment.model'
import { formAppealResponseSchema, isAppealsPhase } from '../../../../../../utils'
import { ChallengeDetailContext } from '../../../../../../contexts'
import { FieldMarkdownEditor } from '../../../../../FieldMarkdownEditor'
import { ScorecardViewerContextValue, useScorecardViewerContext } from '../../../ScorecardViewer.context'
import { ScorecardQuestionRow } from '../../ScorecardQuestionRow'
import { ReviewAppeal } from '../ReviewAppeal'

import styles from './ReviewComment.module.scss'

interface ReviewCommentProps {
    comment: ReviewItemComment
    appeal?: AppealInfo
    reviewItem?: ReviewItemInfo
    index: number
    question: ScorecardQuestion
}

// eslint-disable-next-line complexity
const ReviewComment: FC<ReviewCommentProps> = props => {
    const {
        isManagerEdit,
        actionChallengeRole,
        addAppeal,
        isSavingAppeal,
    }: ScorecardViewerContextValue = useScorecardViewerContext()

    const { challengeInfo }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const canAddAppeal = useMemo(() => isAppealsPhase(challengeInfo), [challengeInfo])
    const isSubmitter = actionChallengeRole === 'Submitter'

    const [appealContent, setAppealContent] = useState(props.appeal?.content || '')
    const [showAppealForm, setShowAppealForm] = useState(false)

    const isReviewerRole = useMemo(() => (
        includes([REVIEWER, COPILOT, ADMIN], actionChallengeRole)
    ), [actionChallengeRole])

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
        if (addAppeal) {
            addAppeal(data.response, props.comment, () => {
                setAppealContent(data.response)
                setShowAppealForm(false)
            })
        }
    }, [addAppeal, props.comment])

    useEffect(() => {
        if (props.appeal) {
            setAppealContent(props.appeal.content)
        }
    }, [props.appeal])

    const typeDisplay = props.comment.typeDisplay || props.comment.type

    const handleShowAppealForm = useCallback(() => {
        setShowAppealForm(true)
    }, [])

    const handleCancelAppealForm = useCallback(() => {
        setShowAppealForm(false)
        setAppealContent(props.appeal?.content || '')
    }, [props.appeal])

    return (
        <div className={styles.wrap}>
            <ScorecardQuestionRow
                index={`Comment ${props.index}${typeDisplay ? ` (${typeDisplay})` : ''}`}
                className={styles.commentRow}
            >
                <div className={styles.content}>
                    {props.comment.content}
                </div>
            </ScorecardQuestionRow>

            <ScorecardQuestionRow>
                {isSubmitter && canAddAppeal && (!props.appeal && !showAppealForm && (
                    <button
                        type='button'
                        onClick={handleShowAppealForm}
                        disabled={isSavingAppeal}
                        className={styles.linkStyleBtn}
                    >
                        <IconAppeal />
                        Submit Appeal
                    </button>
                ))}

                {showAppealForm && (
                    <form
                        className={styles.blockForm}
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <label>Submit Appeal</label>
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
                                        initialValue={appealContent}
                                        className={styles.markdownEditor}
                                        onChange={controlProps.field.onChange}
                                        showBorder
                                        onBlur={controlProps.field.onBlur}
                                        error={get(errors, 'response.message')}
                                        disabled={isSavingAppeal}
                                        uploadCategory='appeal'
                                    />
                                )
                            }}
                        />
                        <div className={styles.blockBtns}>
                            <button
                                disabled={isSavingAppeal}
                                className='filledButton'
                                type='submit'
                            >
                                Submit Appeal
                            </button>
                            <button
                                type='button'
                                className='borderButton'
                                onClick={handleCancelAppealForm}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {props.appeal && !showAppealForm && (isSubmitter || isReviewerRole || isManagerEdit) && (
                    <ReviewAppeal
                        appeal={props.appeal}
                        reviewItem={props.reviewItem}
                        scorecardQuestion={props.question}
                        canRespondToAppeal={isReviewerRole}
                    >
                        {isSubmitter && canAddAppeal && (
                            <div className={styles.blockBtns}>
                                <button
                                    type='button'
                                    onClick={handleShowAppealForm}
                                    disabled={isSavingAppeal}
                                    className={styles.linkStyleBtn}
                                >
                                    <IconEdit />
                                    Edit
                                </button>
                            </div>
                        )}
                    </ReviewAppeal>
                )}
            </ScorecardQuestionRow>

        </div>
    )
}

export default ReviewComment
