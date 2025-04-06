/**
 * Scorecard Question Edit.
 */
import {
    ChangeEvent,
    Dispatch,
    FC,
    SetStateAction,
    useMemo,
} from 'react'
import {
    Control,
    Controller,
    ControllerRenderProps,
    FieldErrors,
    useFieldArray,
    UseFieldArrayReturn,
    UseFormTrigger,
} from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import { Button } from '~/libs/ui'

import { FieldMarkdownEditor } from '../FieldMarkdownEditor'
import { FieldSelect } from '../FieldSelect'
import { IconChevronDown } from '../../assets/icons'
import {
    QUESTION_RESPONSE_OPTIONS,
    QUESTION_YES_NO_OPTIONS,
} from '../../../config/index.config'
import { MarkdownReview } from '../MarkdownReview'
import { FormReviews, ReviewItemInfo, ScorecardQuestion } from '../../models'

import styles from './ScorecardQuestionEdit.module.scss'

interface Props {
    className?: string
    scorecardQuestion: ScorecardQuestion
    reviewItem: ReviewItemInfo
    groupIndex: number
    sectionIndex: number
    questionIndex: number
    control: Control<FormReviews, any>
    formFieldItemIndex: number
    errors: FieldErrors<FormReviews>
    isTouched: { [key: string]: boolean }
    setIsTouched: Dispatch<
        SetStateAction<{
            [key: string]: boolean
        }>
    >
    trigger: UseFormTrigger<FormReviews>
    recalculateReviewProgress: () => void
    isExpand: {[key: string]: boolean}
    setIsExpand: Dispatch<SetStateAction<{
        [key: string]: boolean;
    }>>
}

export const ScorecardQuestionEdit: FC<Props> = (props: Props) => {
    const isExpand = props.isExpand[props.reviewItem.id]
    const responseOptions = useMemo(() => {
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
        () => (props.isTouched[
            `reviews.${props.formFieldItemIndex}.initialAnswer.message`
        ]
            ? _.get(
                props.errors,
                `reviews.${props.formFieldItemIndex}.initialAnswer.message`,
            )
            : ''),
        [props],
    )

    const initCommentContents = useMemo<{ [key: string]: string }>(() => {
        const results: { [key: string]: string } = {}
        _.forEach(
            props.reviewItem.reviewItemComments,
            (commentItem, commentItemIndex) => {
                results[`${commentItemIndex}.content`]
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
            name: `reviews.${props.formFieldItemIndex}.comments` as 'reviews.0.comments',
        })

    const errorCommentsMessage = useMemo<{ [index: number]: string }>(() => {
        const result: { [index: number]: string } = {}
        _.forEach(fields, (field, commentItemIndex) => {
            result[commentItemIndex] = props.isTouched[
                `reviews.${props.formFieldItemIndex}.comments.${commentItemIndex}.content`
            ]
                ? _.get(
                    props.errors,
                    `reviews.${props.formFieldItemIndex}.comments.${commentItemIndex}.content.message`,
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
                        [styles.isError]: !!errorMessage,
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
                        <span>
                            Question
                            {' '}
                            {props.groupIndex + 1}
                            .
                            {props.sectionIndex + 1}
                            .
                            {props.questionIndex + 1}
                            {' '}
                            {props.scorecardQuestion.description}
                        </span>
                    </div>
                </td>
                <td className={classNames(styles.blockCellWeight)}>
                    {props.scorecardQuestion.weight.toFixed(1)}
                </td>
                <td className={styles.blockCellResponse}>
                    <Controller
                        name={`reviews.${props.formFieldItemIndex}.initialAnswer`}
                        control={props.control}
                        render={function render(controlProps: {
                            field: ControllerRenderProps<
                                FormReviews,
                                `reviews.${number}.initialAnswer`
                            >
                        }) {
                            return (
                                <FieldSelect
                                    name='response'
                                    label=''
                                    placeholder='Select'
                                    options={responseOptions}
                                    value={controlProps.field.value}
                                    onChange={function onChange(event: ChangeEvent<HTMLInputElement>) {
                                        controlProps.field.onChange(event)
                                        props.recalculateReviewProgress()
                                    }}
                                    onBlur={function onBlur() {
                                        controlProps.field.onBlur()
                                        props.setIsTouched(old => ({
                                            ...old,
                                            [`reviews.${props.formFieldItemIndex}.initialAnswer.message`]:
                                                true,
                                        }))
                                        props.trigger(
                                            `reviews.${props.formFieldItemIndex}.initialAnswer`,
                                        )
                                    }}
                                    classNameWrapper={styles.blockSelect}
                                    error={errorMessage}
                                    dirty
                                />
                            )
                        }}
                    />
                </td>
            </tr>
            {isExpand && (
                <tr
                    className={classNames(
                        styles.container,
                        props.className,
                        styles.blockRowGuidelines,
                        {
                            [styles.isError]: !!errorMessage,
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
                        [styles.isError]: !!errorMessage,
                    },
                )}
            >
                <td colSpan={3}>
                    <div>
                        <div className={styles.blockComments}>
                            {fields.map((commentItem, commentItemIndex) => (
                                <div
                                    key={commentItem.index}
                                    className={styles.blockCommentForm}
                                >
                                    <Controller
                                        // eslint-disable-next-line max-len
                                        name={`reviews.${props.formFieldItemIndex}.comments.${commentItemIndex}.type`}
                                        control={props.control}
                                        render={function render(controlProps: {
                                            field: ControllerRenderProps<
                                                FormReviews,
                                                `reviews.${number}.comments.${number}.type`
                                            >
                                        }) {
                                            return (
                                                <FieldSelect
                                                    name='response1'
                                                    label='Response 1'
                                                    placeholder='Select'
                                                    options={
                                                        QUESTION_RESPONSE_OPTIONS
                                                    }
                                                    value={
                                                        controlProps.field.value
                                                    }
                                                    // eslint-disable-next-line max-len
                                                    onChange={function onChange(
                                                        event: ChangeEvent<HTMLInputElement>,
                                                    ) {
                                                        controlProps.field.onChange(
                                                            event,
                                                        )
                                                        props.trigger(
                                                            // eslint-disable-next-line max-len
                                                            `reviews.${props.formFieldItemIndex}.comments.${commentItemIndex}.content`,
                                                        )
                                                    }}
                                                    onBlur={function onBlur() {
                                                        controlProps.field.onBlur()
                                                    }}
                                                    error=''
                                                    dirty
                                                    classNameWrapper={
                                                        styles.fieldSelectResponse
                                                    }
                                                />
                                            )
                                        }}
                                    />

                                    <Controller
                                        // eslint-disable-next-line max-len
                                        name={`reviews.${props.formFieldItemIndex}.comments.${commentItemIndex}.content`}
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
                                                            `${commentItemIndex}.content`
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
                                                                // eslint-disable-next-line max-len
                                                                [`reviews.${props.formFieldItemIndex}.comments.${commentItemIndex}.content`]:
                                                                    true,
                                                            }),
                                                        )
                                                    }}
                                                    error={
                                                        errorCommentsMessage[
                                                            commentItemIndex
                                                        ]
                                                    }
                                                />
                                            )
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <Button
                            className={styles.btnAddResponse}
                            secondary
                            size='lg'
                            label='Add Response'
                            onClick={function onClick() {
                                append({
                                    content: '',
                                    id: '-1',
                                    index: fields.length,
                                    type: '',
                                })
                            }}
                        />
                    </div>
                </td>
            </tr>
        </>
    )
}

export default ScorecardQuestionEdit
