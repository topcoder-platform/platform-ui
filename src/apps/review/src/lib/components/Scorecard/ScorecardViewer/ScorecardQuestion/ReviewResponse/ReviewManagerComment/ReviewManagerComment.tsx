import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import Select, { SingleValue } from 'react-select'
import classNames from 'classnames'

import { yupResolver } from '@hookform/resolvers/yup'

import { FormManagerComment, ReviewItemInfo, ScorecardQuestion, SelectOption } from '../../../../../../models'
import { formManagerCommentSchema } from '../../../../../../utils'
import { QUESTION_YES_NO_OPTIONS } from '../../../../../../../config/index.config'
import { MarkdownReview } from '../../../../../MarkdownReview'
import { FieldMarkdownEditor } from '../../../../../FieldMarkdownEditor'
import { ScorecardViewerContextValue, useScorecardViewerContext } from '../../../ScorecardViewer.context'
import { ScorecardQuestionRow } from '../../ScorecardQuestionRow'

import styles from './ReviewManagerComment.module.scss'

interface ReviewManagerCommentProps {
    managerComment?: string
    reviewItem?: ReviewItemInfo
    scorecardQuestion?: ScorecardQuestion
}

const ReviewManagerComment: FC<ReviewManagerCommentProps> = props => {
    const {
        isManagerEdit,
        isSavingManagerComment,
        addManagerComment,
    }: ScorecardViewerContextValue = useScorecardViewerContext()

    const [comment, setComment] = useState(props.managerComment || '')
    const [showCommentForm, setShowCommentForm] = useState(false)

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
    }: UseFormReturn<FormManagerComment> = useForm({
        defaultValues: {
            finalScore: '',
            response: '',
        },
        mode: 'all',
        resolver: yupResolver(formManagerCommentSchema),
    })

    const onSubmit = useCallback((data: FormManagerComment) => {
        if (addManagerComment && props.reviewItem) {
            addManagerComment(
                data.response,
                data.finalScore,
                props.reviewItem,
                () => {
                    setComment(data.response)
                    setShowCommentForm(false)
                },
            )
        }
    }, [addManagerComment, props.reviewItem])

    useEffect(() => {
        if (props.managerComment) {
            setComment(props.managerComment)
        }
    }, [props.managerComment])

    const handleShowCommentForm = useCallback(() => {
        setShowCommentForm(true)
    }, [])

    const handleCancelCommentForm = useCallback(() => {
        setShowCommentForm(false)
        setComment(props.managerComment || '')
    }, [props.managerComment])

    if (!props.managerComment && !isManagerEdit) {
        return <></>
    }

    return (
        <ScorecardQuestionRow
            index='Manager Comment'
            className={styles.wrap}
        >
            {!showCommentForm && comment && (
                <div className={styles.displayContainer}>
                    <div className={styles.content}>
                        <MarkdownReview value={comment} />
                    </div>
                    {isManagerEdit && (
                        <button
                            type='button'
                            onClick={handleShowCommentForm}
                            disabled={isSavingManagerComment}
                            className={styles.editButton}
                        >
                            Edit Manager Comment
                        </button>
                    )}
                </div>
            )}

            {!showCommentForm && !comment && isManagerEdit && (
                <button
                    type='button'
                    onClick={handleShowCommentForm}
                    disabled={isSavingManagerComment}
                    className={styles.addButton}
                >
                    Add a Manager Comment
                </button>
            )}

            {showCommentForm && isManagerEdit && (
                <form
                    className={styles.commentForm}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <div className={styles.commentFormHeader}>
                        <label className={styles.commentFormLabel}>Manager Comment</label>
                        {props.scorecardQuestion && responseOptions.length > 0 && (
                            <div className={styles.scoreSelect}>
                                <Controller
                                    name='finalScore'
                                    control={control}
                                    render={function render(controlProps: {
                                        field: ControllerRenderProps<
                                            FormManagerComment,
                                            'finalScore'
                                        >
                                    }) {
                                        return (
                                            <Select
                                                className={classNames('react-select-container', styles.select)}
                                                classNamePrefix='select'
                                                name='finalScore'
                                                placeholder='Select'
                                                options={responseOptions}
                                                value={
                                                    controlProps.field.value
                                                        ? {
                                                            label: controlProps.field.value,
                                                            value: controlProps.field.value,
                                                        }
                                                        : undefined
                                                }
                                                onChange={function handleChange(
                                                    option: SingleValue<SelectOption>,
                                                ): void {
                                                    controlProps.field.onChange(
                                                        (option as SelectOption | null)?.value || '',
                                                    )
                                                }}
                                                onBlur={controlProps.field.onBlur}
                                                isDisabled={isSavingManagerComment}
                                            />
                                        )
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    <Controller
                        name='response'
                        control={control}
                        render={function render(controlProps: {
                            field: ControllerRenderProps<
                                FormManagerComment,
                                'response'
                            >
                        }) {
                            return (
                                <FieldMarkdownEditor
                                    initialValue={comment}
                                    className={styles.markdownEditor}
                                    onChange={controlProps.field.onChange}
                                    showBorder
                                    onBlur={controlProps.field.onBlur}
                                    error={errors.response?.message}
                                    disabled={isSavingManagerComment}
                                    uploadCategory='manager-comment'
                                />
                            )
                        }}
                    />
                    <div className={styles.commentFormActions}>
                        <button
                            className={styles.submitButton}
                            type='submit'
                            disabled={isSavingManagerComment}
                        >
                            Submit Response
                        </button>
                        <button
                            type='button'
                            className={styles.cancelButton}
                            onClick={handleCancelCommentForm}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </ScorecardQuestionRow>
    )
}

export default ReviewManagerComment
