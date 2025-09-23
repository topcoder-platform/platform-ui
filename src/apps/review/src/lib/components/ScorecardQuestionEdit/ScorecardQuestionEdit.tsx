/**
 * Scorecard Question Edit.
 */
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

import { FieldMarkdownEditor } from '../FieldMarkdownEditor'
import { IconChevronDown } from '../../assets/icons'
import {
    QUESTION_RESPONSE_OPTIONS,
    QUESTION_YES_NO_OPTIONS,
} from '../../../config/index.config'
import { MarkdownReview } from '../MarkdownReview'
import {
    FormReviews,
    ReviewItemInfo,
    ScorecardQuestion,
    SelectOption,
} from '../../models'

import styles from './ScorecardQuestionEdit.module.scss'

interface Props {
    className?: string
    scorecardQuestion: ScorecardQuestion
    reviewItem: ReviewItemInfo
    groupIndex: number
    sectionIndex: number
    questionIndex: number
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
    isExpand: { [key: string]: boolean }
    setIsExpand: Dispatch<
        SetStateAction<{
            [key: string]: boolean
        }>
    >
}

export const ScorecardQuestionEdit: FC<Props> = (props: Props) => {
    const isExpand = props.isExpand[props.reviewItem.id]
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
                results[`${idx}.content`]
                    = commentItem.content ?? ''
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

    return (
        <>
            <tr
                className={classNames(
                    styles.container,
                    props.className,
                    styles.blockRowQuestionHeader,
                    {
                        [styles.isExpand]: isExpand,
                        [styles.isError]:
                            !!errorMessage
                            || !isEmpty(
                                compact(Object.values(errorCommentsMessage)),
                            ),
                    },
                )}
            >
                <td>
                    <div className={styles.blockQuestion}>
                        <button
                            type='button'
                            className={classNames(styles.btnExpand, {
                                [styles.expand]: isExpand,
                            })}
                            onClick={function onClick() {
                                props.setIsExpand({
                                    ...props.isExpand,
                                    [props.reviewItem.id]: !isExpand,
                                })
                            }}
                        >
                            <IconChevronDown />
                        </button>
                        <span className={styles.textQuestion}>
                            <strong>
                                Question
                                {props.groupIndex + 1}
                                .
                                {props.sectionIndex + 1}
                                .
                                {props.questionIndex + 1}
                                {' '}
                            </strong>
                            {props.scorecardQuestion.description}
                        </span>
                    </div>
                </td>
                <td className={classNames(styles.blockCellWeight)}>
                    <i>Weight: </i>
                    {props.scorecardQuestion.weight.toFixed(1)}
                </td>
                <td className={styles.blockCellResponse}>
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
                                                label: controlProps.field
                                                    .value,
                                                value: controlProps.field
                                                    .value,
                                            }
                                            : undefined
                                    }
                                    onChange={function onChange(option: SingleValue<{ label: string; value: string }>) {
                                        controlProps.field.onChange(
                                            (option as SelectOption).value,
                                        )
                                        props.recalculateReviewProgress()
                                        controlProps.field.onChange(
                                            (option as SelectOption).value,
                                        )
                                        props.recalculateReviewProgress()
                                    }}
                                    onBlur={function onBlur() {
                                        controlProps.field.onBlur()
                                        props.setIsTouched(old => ({
                                            ...old,
                                            [`reviews.${props.fieldIndex}.initialAnswer.message`]:
                                                true,
                                        }))
                                        props.trigger(
                                            `reviews.${props.fieldIndex}.initialAnswer`,
                                        )
                                    }}
                                    isDisabled={props.disabled}
                                />
                            )
                        }}
                    />
                </td>
            </tr>
            {errorMessage && (
                <tr
                    className={classNames(
                        styles.container,
                        styles.errorMessage,
                        {
                            [styles.isExpand]: isExpand,
                            [styles.isError]: !!errorMessage,
                        },
                    )}
                >
                    <td colSpan={3}>
                        <div className='errorMessage'>{errorMessage}</div>
                    </td>
                </tr>
            )}
            {isExpand && (
                <tr
                    className={classNames(
                        styles.container,
                        props.className,
                        styles.blockRowGuidelines,
                        {
                            [styles.isError]:
                                !!errorMessage
                                || !isEmpty(
                                    compact(Object.values(errorCommentsMessage)),
                                ),
                        },
                    )}
                >
                    <td colSpan={3}>
                        <MarkdownReview
                            value={props.scorecardQuestion.guidelines}
                            className={styles.textGuidelines}
                        />
                    </td>
                </tr>
            )}
            <tr
                className={classNames(
                    styles.container,
                    props.className,
                    styles.blockRowResponseComment,
                    {
                        [styles.isError]:
                            !!errorMessage
                            || !isEmpty(
                                compact(Object.values(errorCommentsMessage)),
                            ),
                    },
                )}
            >
                <td colSpan={3}>
                    <div>
                        <div className={styles.blockComments}>
                            {fields.map((commentItem, idx) => (
                                <div
                                    key={commentItem.index}
                                    className={styles.blockCommentForm}
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
                                                <div
                                                    className={
                                                        styles.fieldSelectResponse
                                                    }
                                                >
                                                    <label>
                                                        {`Response ${idx + 1}: `}
                                                    </label>
                                                    <Select
                                                        className={classNames(
                                                            'react-select-container',
                                                        )}
                                                        classNamePrefix='select'
                                                        placeholder='Select'
                                                        options={
                                                            QUESTION_RESPONSE_OPTIONS
                                                        }
                                                        value={
                                                            controlProps.field
                                                                .value
                                                                ? {
                                                                    label: capitalize(
                                                                        controlProps
                                                                            .field
                                                                            .value,
                                                                    ),
                                                                    value: controlProps
                                                                        .field
                                                                        .value,
                                                                }
                                                                : undefined
                                                        }
                                                        onChange={function onChange(
                                                            option: SingleValue<{label: string; value: string}>,
                                                        ) {
                                                            controlProps.field.onChange(
                                                                (
                                                                    option as SelectOption
                                                                ).value,
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
                                                    className={
                                                        styles.blockMarkdownEditor
                                                    }
                                                    initialValue={
                                                        initCommentContents[
                                                            `${idx}.content`
                                                        ]
                                                    }
                                                    onChange={
                                                        controlProps.field
                                                            .onChange
                                                    }
                                                    onBlur={function onBlur() {
                                                        controlProps.field.onBlur()
                                                        props.setIsTouched(
                                                            old => ({
                                                                ...old,
                                                                [`reviews.${props.fieldIndex}.comments.${idx}.content`]:
                                                                    true,
                                                            }),
                                                        )
                                                    }}
                                                    error={
                                                        errorCommentsMessage[
                                                            idx
                                                        ]
                                                    }
                                                    disabled={props.disabled}
                                                />
                                            )
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <button
                            type='button'
                            className='borderButton'
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
                            Add Response
                        </button>
                    </div>
                </td>
            </tr>
        </>
    )
}

export default ScorecardQuestionEdit
