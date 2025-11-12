import { FC, useCallback, useMemo } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useFieldArray,
    UseFieldArrayReturn,
} from 'react-hook-form'
import _, { capitalize, compact, isEmpty } from 'lodash'
import Select, { SingleValue } from 'react-select'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'
import { IconComment } from '~/apps/review/src/lib/assets/icons'

import {
    QUESTION_RESPONSE_OPTIONS,
    QUESTION_YES_NO_OPTIONS,
} from '../../../../../../config/index.config'
import {
    FormReviews,
    ReviewItemInfo,
    ScorecardQuestion,
    SelectOption,
} from '../../../../../models'
import { FieldMarkdownEditor } from '../../../../FieldMarkdownEditor'
import { MarkdownReview } from '../../../../MarkdownReview'
import { ScorecardViewerContextValue, useScorecardViewerContext } from '../../ScorecardViewer.context'
import { ScorecardQuestionRow } from '../ScorecardQuestionRow'
import { ScorecardScore } from '../../ScorecardScore'

import styles from './ScorecardQuestionEdit.module.scss'

interface ScorecardQuestionEditProps {
    question: ScorecardQuestion
    reviewItem: ReviewItemInfo
    index: string
    fieldIndex: number
    disabled?: boolean
}

export const ScorecardQuestionEdit: FC<ScorecardQuestionEditProps> = props => {
    const {
        toggleItem,
        toggledItems,
        form,
        formErrors,
        isTouched,
        setIsTouched,
        formTrigger,
        scoreMap,
    }: ScorecardViewerContextValue = useScorecardViewerContext()

    const isExpanded = toggledItems[props.question.id!] ?? false
    const toggle = useCallback((): void => {
        toggleItem(props.question.id!)
    }, [toggleItem])

    const control = form?.control
    const errors = formErrors || {}
    const touched = isTouched || {}
    const trigger = formTrigger || ((): Promise<boolean> => Promise.resolve(true))

    const responseOptions = useMemo<SelectOption[]>(() => {
        if (props.question.type === 'SCALE') {
            const length = props.question.scaleMax - props.question.scaleMin + 1
            return Array.from(
                new Array(length),
                (x, i) => `${i + props.question.scaleMin}`,
            )
                .map(item => ({
                    label: item,
                    value: item,
                }))
        }

        if (props.question.type === 'YES_NO') {
            return QUESTION_YES_NO_OPTIONS
        }

        return []
    }, [props.question])

    const {
        fields,
        append,
    }: UseFieldArrayReturn<FormReviews, 'reviews.0.comments', 'id'>
        = useFieldArray({
            control: control!,
            name: `reviews.${props.fieldIndex}.comments` as 'reviews.0.comments',
        })

    const errorMessage = touched[
        `reviews.${props.fieldIndex}.initialAnswer.message`
    ] ? _.get(
            errors,
            `reviews.${props.fieldIndex}.initialAnswer.message`,
        ) : ''

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

    const errorCommentsMessage = useMemo<{ [index: number]: string }>(() => {
        const result: { [index: number]: string } = {}
        _.forEach(fields, (field, idx) => {
            result[idx] = touched[
                `reviews.${props.fieldIndex}.comments.${idx}.content`
            ]
                ? _.get(
                    errors,
                    `reviews.${props.fieldIndex}.comments.${idx}.content.message`,
                ) ?? ''
                : ''
        })
        return result
    }, [touched, errors, errors?.reviews, props.fieldIndex, fields])

    const hasErrors = !!errorMessage || !isEmpty(compact(Object.values(errorCommentsMessage)))

    const handleAddResponse = useCallback(() => {
        append({
            content: '',
            id: '-1',
            index: fields.length,
            type: '',
        })
    }, [append, fields.length])

    if (!form || !control) {
        return <></>
    }

    return (
        <div className={styles.wrap}>
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
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormReviews,
                            `reviews.${number}.initialAnswer`
                        >
                    }) {
                        return (
                            <ScorecardQuestionRow
                                index='Answer'
                                score={(
                                    <ScorecardScore
                                        score={scoreMap.get(props.question.id as string) ?? 0}
                                        weight={props.question.weight}
                                    />
                                )}
                                className={classNames(hasErrors && styles.hasError)}
                            >
                                <div className={styles.answerWrap}>
                                    <Select
                                        className={classNames(
                                            styles.answerInput,
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
                                        onChange={function onChange(
                                            option: SingleValue<{ label: string; value: string }>,
                                        ) {
                                            controlProps.field.onChange(
                                                (option as SelectOption).value,
                                            )
                                        }}
                                        onBlur={function onBlur() {
                                            controlProps.field.onBlur()
                                            setIsTouched(old => ({
                                                ...old,
                                                [`reviews.${props.fieldIndex}.initialAnswer.message`]: true,
                                            }))
                                            trigger(
                                                `reviews.${props.fieldIndex}.initialAnswer`,
                                            )
                                        }}
                                        isDisabled={props.disabled}
                                    />

                                    {errorMessage && (
                                        <div className={styles.errorMessage}>
                                            {errorMessage}
                                        </div>
                                    )}
                                </div>
                            </ScorecardQuestionRow>
                        )
                    }}
                />

                {fields.map((commentItem, idx) => (
                    <ScorecardQuestionRow
                        index={`Response ${idx + 1}`}
                        key={commentItem.index}
                    >
                        <Controller
                            name={`reviews.${props.fieldIndex}.comments.${idx}.type`}
                            control={control}
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
                                                trigger(
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
                            control={control}
                            render={function render(controlProps: {
                                field: ControllerRenderProps<
                                    FormReviews,
                                    `reviews.${number}.comments.${number}.content`
                                >
                            }) {
                                return (
                                    <FieldMarkdownEditor
                                        className={classNames(styles.markdownEditor, errorCommentsMessage[idx] && styles.editorError)}
                                        initialValue={
                                            initCommentContents[
                                                `${idx}.content`
                                            ]
                                        }
                                        onChange={controlProps.field.onChange}
                                        onBlur={function onBlur() {
                                            controlProps.field.onBlur()
                                            setIsTouched(
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
                    index={(
                        <button
                            type='button'
                            className={styles.addCommentBtn}
                            onClick={handleAddResponse}
                            disabled={props.disabled}
                        >
                            <IconComment className='icon-xl' />
                            Add Response
                        </button>
                    )}
                />
            </div>
        </div>
    )
}

export default ScorecardQuestionEdit
