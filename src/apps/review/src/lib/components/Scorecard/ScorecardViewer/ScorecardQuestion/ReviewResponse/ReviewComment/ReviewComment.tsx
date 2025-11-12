import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import { get } from 'lodash'

import { yupResolver } from '@hookform/resolvers/yup'

import { AppealInfo, ChallengeDetailContextModel, FormAppealResponse } from '../../../../../../models'
import { ReviewItemComment } from '../../../../../../models/ReviewItemComment.model'
import { formAppealResponseSchema, isAppealsPhase } from '../../../../../../utils'
import { ChallengeDetailContext } from '../../../../../../contexts'
import { FieldMarkdownEditor } from '../../../../../FieldMarkdownEditor'
import { ScorecardViewerContextValue, useScorecardViewerContext } from '../../../ScorecardViewer.context'
import { ScorecardQuestionRow } from '../../ScorecardQuestionRow'

import styles from './ReviewComment.module.scss'

interface ReviewCommentProps {
    comment: ReviewItemComment
    appeal?: AppealInfo
    index: number
}

const ReviewComment: FC<ReviewCommentProps> = props => {
    const {
        actionChallengeRole,
        addAppeal,
        doDeleteAppeal,
        isSavingAppeal,
    }: ScorecardViewerContextValue = useScorecardViewerContext()

    const { challengeInfo }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const canAddAppeal = useMemo(() => isAppealsPhase(challengeInfo), [challengeInfo])
    const isSubmitter = actionChallengeRole === 'Submitter'

    const [appealContent, setAppealContent] = useState(props.appeal?.content || '')
    const [showAppealForm, setShowAppealForm] = useState(false)

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

    const handleDeleteAppeal = useCallback(() => {
        if (doDeleteAppeal && window.confirm('Are you sure you want to delete this appeal?')) {
            doDeleteAppeal(props.appeal, () => {
                setAppealContent('')
            })
        }
    }, [doDeleteAppeal, props.appeal])

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

            {isSubmitter && canAddAppeal && (
                <>
                    {!props.appeal && !showAppealForm && (
                        <div className={styles.appealActions}>
                            <button
                                type='button'
                                onClick={handleShowAppealForm}
                                disabled={isSavingAppeal}
                                className={styles.addAppealButton}
                            >
                                Add Appeal
                            </button>
                        </div>
                    )}

                    {props.appeal && (
                        <div className={styles.appealActions}>
                            <button
                                type='button'
                                onClick={handleShowAppealForm}
                                disabled={isSavingAppeal}
                                className={styles.editAppealButton}
                            >
                                Edit Appeal
                            </button>
                            <button
                                type='button'
                                onClick={handleDeleteAppeal}
                                disabled={isSavingAppeal}
                                className={styles.deleteAppealButton}
                            >
                                Delete
                            </button>
                        </div>
                    )}

                    {showAppealForm && (
                        <form
                            className={styles.appealForm}
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            <label className={styles.appealFormLabel}>Submit Appeal</label>
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
                            <div className={styles.appealFormActions}>
                                <button
                                    disabled={isSavingAppeal}
                                    className={styles.submitButton}
                                    type='submit'
                                >
                                    Submit Appeal
                                </button>
                                <button
                                    type='button'
                                    className={styles.cancelButton}
                                    onClick={handleCancelAppealForm}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </div>
    )
}

export default ReviewComment
