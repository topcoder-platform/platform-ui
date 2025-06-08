/**
 * AppealComment.
 */
import { FC, useCallback, useMemo, useState } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import _, { bind } from 'lodash'
import Select, { SingleValue } from 'react-select'
import classNames from 'classnames'

import { yupResolver } from '@hookform/resolvers/yup'

import { MarkdownReview } from '../MarkdownReview'
import { FieldMarkdownEditor } from '../FieldMarkdownEditor'
import { FormManagerComment, ScorecardQuestion, SelectOption } from '../../models'
import { formManagerCommentSchema } from '../../utils'
import { QUESTION_YES_NO_OPTIONS } from '../../../config/index.config'

import styles from './ManagerComment.module.scss'

interface Props {
    className?: string
    scorecardQuestion: ScorecardQuestion
    updateScorecardQuestion: (value: string) => void
}

export const ManagerComment: FC<Props> = (props: Props) => {
    const [comment, setComment] = useState('')
    const [showCommentForm, setShowCommentForm] = useState(false)
    const [showComment, setShowComment] = useState(false)

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
        setComment(data.response)
        props.updateScorecardQuestion(data.finalScore)
        setShowCommentForm(false)
        setShowComment(true)
    }, [props])

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
            {showComment && (
                <div className={styles.blockManagerComment}>
                    <span className={styles.textTitle}>Manager Comment</span>
                    <MarkdownReview value={comment} />
                </div>
            )}

            {!showCommentForm && !showComment && (
                <button
                    type='button'
                    className='borderButton'
                    onClick={function onClick() {
                        setShowCommentForm(true)
                    }}
                >
                    Add a Manager Comment
                </button>
            )}

            {showCommentForm && (
                <form
                    className={styles.blockForm}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <div className={styles.caption}>
                        <label className={styles.title}>Manager Comment</label>
                        <div className={styles.dropdownWrap}>
                            <div className={styles.dropdown}>
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
                                                className={classNames(
                                                    'react-select-container',
                                                    _.get(
                                                        errors,
                                                        'finalScore.message',
                                                    ) ? 'error' : '',
                                                )}
                                                classNamePrefix='select'
                                                name='finalScore'
                                                placeholder='Select'
                                                options={responseOptions}
                                                value={
                                                    controlProps.field.value
                                                        ? {
                                                            label: controlProps.field
                                                                .value,
                                                            value: controlProps.field
                                                                .value,
                                                        }
                                                        : undefined
                                                }
                                                onChange={function onChange(
                                                    option: SingleValue<{
                                                        label: string
                                                        value: string
                                                    }>,
                                                ) {
                                                    controlProps.field.onChange(
                                                        (option as SelectOption)
                                                            .value,
                                                    )
                                                }}
                                                onBlur={function onBlur() {
                                                    controlProps.field.onBlur()
                                                }}
                                            />
                                        )
                                    }}
                                />
                            </div>
                            {_.get(errors, 'finalScore.message') && (
                                <div className='errorMessage'>
                                    {_.get(errors, 'finalScore.message')}
                                </div>
                            )}
                        </div>
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
                                    className={styles.markdownEditor}
                                    onChange={controlProps.field.onChange}
                                    showBorder
                                    onBlur={controlProps.field.onBlur}
                                    error={_.get(errors, 'response.message')}
                                />
                            )
                        }}
                    />
                    <div className={styles.blockBtns}>
                        <button className='filledButton' type='submit'>
                            Submit Response
                        </button>
                        <button
                            type='button'
                            className='borderButton'
                            onClick={bind(setShowCommentForm, undefined, false)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default ManagerComment
