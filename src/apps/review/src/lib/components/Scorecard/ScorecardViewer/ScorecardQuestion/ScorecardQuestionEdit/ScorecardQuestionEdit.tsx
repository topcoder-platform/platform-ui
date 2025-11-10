import { Dispatch, FC, SetStateAction, useMemo } from 'react'
import {
    Control,
    Controller,
    ControllerRenderProps,
    FieldErrors,
    useFieldArray,
    UseFieldArrayReturn,
    UseFormTrigger,
} from 'react-hook-form'
import _, { capitalize, compact, isEmpty } from 'lodash'
import Select, { SingleValue } from 'react-select'
import classNames from 'classnames'

import { Button, IconOutline } from '~/libs/ui'

import { FieldMarkdownEditor } from '../../../../FieldMarkdownEditor'
import {
    QUESTION_RESPONSE_OPTIONS,
    QUESTION_YES_NO_OPTIONS,
} from '../../../../../../config/index.config'
import { MarkdownReview } from '../../../../MarkdownReview'
import {
    FormReviews,
    ReviewItemInfo,
    ScorecardQuestion,
    SelectOption,
} from '../../../../../models'
import { ScorecardQuestionRow } from '../ScorecardQuestionRow'
import { ScorecardViewerContextValue, useScorecardContext } from '../../ScorecardViewer.context'

import styles from './ScorecardQuestionEdit.module.scss'
import { ScorecardScore } from '../../ScorecardScore'
import { IconComment } from '~/apps/review/src/lib/assets/icons'

interface ScorecardQuestionEditProps {
    question: ScorecardQuestion
    reviewItem: ReviewItemInfo
    index: string
    control: Control<FormReviews, any>
    fieldIndex: number
    errors: FieldErrors<FormReviews>
    isTouched: { [key: string]: boolean }
    disabled?: boolean
    setIsTouched: Dispatch<
        SetStateAction<{
            [key: string]: boolean
        }>
    >
    trigger: UseFormTrigger<FormReviews>
    recalculateReviewProgress: () => void
}

export const ScorecardQuestionEdit: FC<ScorecardQuestionEditProps> = props => {
    const { toggleItem, toggledItems }: ScorecardViewerContextValue = useScorecardContext()
    const isExpanded = toggledItems[props.question.id!] ?? false
    const toggle = () => toggleItem(props.question.id!)

    const responseOptions = useMemo<SelectOption[]>(() => {
        if (props.question.type === 'SCALE') {
            const length = props.question.scaleMax - props.question.scaleMin + 1
            return Array.from(
                new Array(length),
                (x, i) => `${i + props.question.scaleMin}`,
            ).map(item => ({
                label: item,
                value: item,
            }))
        }

        if (props.question.type === 'YES_NO') {
            return QUESTION_YES_NO_OPTIONS
        }

        return []
    }, [props.question])

    const errorMessage = useMemo(
        () => {
            if (props.isTouched[
                `reviews.${props.fieldIndex}.initialAnswer.message`
            ]) {
                return _.get(
                    props.errors,
                    `reviews.${props.fieldIndex}.initialAnswer.message`,
                )
            }

            return ''
        },
        [props],
    )

    const initCommentContents = useMemo<{ [key: string]: string }>(() => {
        const results: { [key: string]: string } = {}
        _.forEach(
            props.reviewItem.reviewItemComments,
            (commentItem, idx) => {
                results[`${idx}.content`] = commentItem.content ?? ''
            },
        )
        return results
    }, [props])

    const {
        fields,
        append,
    }: UseFieldArrayReturn<FormReviews, 'reviews.0.comments', 'id'>
        = useFieldArray({
            control: props.control,
            name: `reviews.${props.fieldIndex}.comments` as 'reviews.0.comments',
        })

    const errorCommentsMessage = useMemo<{ [index: number]: string }>(() => {
        const result: { [index: number]: string } = {}
        _.forEach(fields, (field, idx) => {
            result[idx] = props.isTouched[
                `reviews.${props.fieldIndex}.comments.${idx}.content`
            ]
                ? _.get(
                    props.errors,
                    `reviews.${props.fieldIndex}.comments.${idx}.content.message`,
                ) ?? ''
                : ''
        })
        return result
    }, [props, fields])

    const hasErrors = !!errorMessage || !isEmpty(compact(Object.values(errorCommentsMessage)))

    return (
        <div className={classNames(styles.wrap, hasErrors && styles.hasError)}>
            <ScorecardQuestionRow
                icon={(
                    <IconOutline.ChevronDownIcon
                        className={classNames(styles.toggleBtn, isExpanded && styles.expanded)}
                        onClick={toggle}
                    />
                )}
                index={`Question ${props.index}`}
                className={styles.header}
            >
                <span className={styles.questionText}>
                    {props.question.description}
                </span>

                {errorMessage && (
                    <div className={styles.errorMessage}>
                        {errorMessage}
                    </div>
                )}

                {isExpanded && (
                    <div className={styles.guidelines}>
                        <MarkdownReview
                            value={props.question.guidelines}
                            className={styles.guidelinesContent}
                        />
                    </div>
                )}
            </ScorecardQuestionRow>

            <div className={styles.answerSection}>
                <Controller
                    name={`reviews.${props.fieldIndex}.initialAnswer`}
                    control={props.control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormReviews,
                            `reviews.${number}.initialAnswer`
                        >
                    }) {
                        return (
                            <ScorecardQuestionRow
                                index='Answer'
                                score={
                                    <ScorecardScore
                                        score={Number(controlProps.field.value)}
                                        scaleMax={props.question.scaleMax}
                                        weight={props.question.weight}
                                    />
                                }
                            >
                                <div className={styles.answerWrap}>
                                    <Select
                                        className={classNames(
                                            'react-select-container',
                                            errorMessage ? 'error' : '',
                                        )}
                                        classNamePrefix='select'
                                        name='response'
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
                                        onChange={function onChange(option: SingleValue<{ label: string; value: string }>) {
                                            controlProps.field.onChange(
                                                (option as SelectOption).value,
                                            )
                                            props.recalculateReviewProgress()
                                        }}
                                        onBlur={function onBlur() {
                                            controlProps.field.onBlur()
                                            props.setIsTouched(old => ({
                                                ...old,
                                                [`reviews.${props.fieldIndex}.initialAnswer.message`]: true,
                                            }))
                                            props.trigger(
                                                `reviews.${props.fieldIndex}.initialAnswer`,
                                            )
                                        }}
                                        isDisabled={props.disabled}
                                    />
                                </div>
                            </ScorecardQuestionRow>
                        )
                    }}
                />


                {fields.map((commentItem, idx) => (
                    <ScorecardQuestionRow
                        index={`Response ${idx+1}`}
                        key={commentItem.index}
                    >
                        <Controller
                            name={`reviews.${props.fieldIndex}.comments.${idx}.type`}
                            control={props.control}
                            render={function render(controlProps: {
                                field: ControllerRenderProps<
                                    FormReviews,
                                    `reviews.${number}.comments.${number}.type`
                                >
                            }) {
                                return (
                                    <div className={styles.responseTypeWrap}>
                                        <Select
                                            className='react-select-container'
                                            classNamePrefix='select'
                                            placeholder='Select'
                                            options={QUESTION_RESPONSE_OPTIONS}
                                            value={
                                                controlProps.field.value
                                                    ? {
                                                        label: capitalize(controlProps.field.value),
                                                        value: controlProps.field.value,
                                                    }
                                                    : undefined
                                            }
                                            onChange={function onChange(
                                                option: SingleValue<{label: string; value: string}>,
                                            ) {
                                                controlProps.field.onChange(
                                                    (option as SelectOption).value,
                                                )
                                                props.trigger(
                                                    `reviews.${props.fieldIndex}.comments.${idx}.content`,
                                                )
                                            }}
                                            onBlur={function onBlur() {
                                                controlProps.field.onBlur()
                                            }}
                                            isDisabled={props.disabled}
                                        />
                                    </div>
                                )
                            }}
                        />

                        <Controller
                            name={`reviews.${props.fieldIndex}.comments.${idx}.content`}
                            control={props.control}
                            render={function render(controlProps: {
                                field: ControllerRenderProps<
                                    FormReviews,
                                    `reviews.${number}.comments.${number}.content`
                                >
                            }) {
                                return (
                                    <FieldMarkdownEditor
                                        className={styles.markdownEditor}
                                        initialValue={
                                            initCommentContents[
                                                `${idx}.content`
                                            ]
                                        }
                                        onChange={controlProps.field.onChange}
                                        onBlur={function onBlur() {
                                            controlProps.field.onBlur()
                                            props.setIsTouched(
                                                old => ({
                                                    ...old,
                                                    [`reviews.${props.fieldIndex}.comments.${idx}.content`]: true,
                                                }),
                                            )
                                        }}
                                        error={errorCommentsMessage[idx]}
                                        disabled={props.disabled}
                                        uploadCategory='review-comment'
                                    />
                                )
                            }}
                        />
                    </ScorecardQuestionRow>
                ))}

                <ScorecardQuestionRow
                    index={
                        <button
                            type='button'
                            className={styles.addCommentBtn}
                            onClick={function onClick() {
                                append({
                                    content: '',
                                    id: '-1',
                                    index: fields.length,
                                    type: '',
                                })
                            }}
                            disabled={props.disabled}
                        >
                            <IconComment className='icon-xl' />
                            Add Response
                        </button>
                    }
                />
            </div>
        </div>
    )
}

export default ScorecardQuestionEdit


