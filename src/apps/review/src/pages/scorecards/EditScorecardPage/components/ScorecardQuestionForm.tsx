/* eslint-disable import/no-extraneous-dependencies */
import * as yup from 'yup'
import { get } from 'lodash'
import { ChangeEvent, ChangeEventHandler, FC, useCallback, useMemo } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import classNames from 'classnames'

import { TrashIcon } from '@heroicons/react/outline'
import { Draggable, Droppable } from '@hello-pangea/dnd'
import { Button } from '~/libs/ui'
import { ScorecardScales } from '~/apps/review/src/lib/models'

import { getEmptyScorecardQuestion, weightsSum } from '../utils'
import { usePageContext } from '../EditScorecardPage.context'
import styles from '../EditScorecardPage.module.scss'

import BasicSelect from './BasicSelect'
import CalculatedWeightsSum from './CalculatedWeightsSum'
import InputWrapper from './InputWrapper'

const scorecardScaleOptions = Object.entries(ScorecardScales)
    .map(([value, label]) => ({ label, value }))
const yesNoOptions = [{ label: 'Yes', value: true }, { label: 'No', value: false }]

export const scorecardQuestionSchema = {
    questions: yup.array()
        .of(
            yup.object()
                .shape({
                    description: yup.string()
                        .required('Description is required'),
                    guidelines: yup.string()
                        .nullable(),
                    requiresUpload: yup.boolean()
                        .transform((value, originalValue) => {
                            // Handle empty string as undefined (so required() can catch it)
                            if (originalValue === '') return undefined

                            // Yup already transforms "true"/"false" strings into booleans
                            return value
                        })
                        .required('Documents requirements is required'),
                    type: yup.string()
                        .required('Scale is required'),
                    weight: yup
                        .number()
                        .typeError('Weight must be a number')
                        .required('Weight is required')
                        .min(0, 'Weight must be at least 0')
                        .max(100, 'Weight must be at most 100'),
                }),
        )
        .min(1, 'At least one question is required')
        .test(...weightsSum('questions')),
}

interface ScorecardQuestionFormProps {
    sectionIndex: number;
    prefix: string;
}

const ScorecardQuestionForm: FC<ScorecardQuestionFormProps> = props => {
    const form = useFormContext()
    const ctx = usePageContext()
    const values = form.getValues()

    const name = useMemo(() => `${props.prefix}.questions`, [props.prefix])
    const formQuestionsArray = useFieldArray({
        control: form.control,
        name,
    })

    const handleRemove = useCallback(async (index: number, field: any) => {
        const fieldName = field.name ? field.name : `Question ${props.sectionIndex}.${index + 1}`
        if (!await ctx.confirm({
            content: `Are you sure you want to remove "${fieldName}" question?`,
            title: 'Confirm Remove Question',
        })) {
            return
        }

        formQuestionsArray.remove(index)
    }, [ctx, formQuestionsArray])

    const handleAddQuestion = useCallback(() => {
        formQuestionsArray.append({
            ...getEmptyScorecardQuestion(),
            sortOrder: (Math.max(0, ...formQuestionsArray.fields.map(f => get(f, 'sortOrder', 0))) || 0) + 1,
        })
    }, [formQuestionsArray])

    const handleScaleChange = useCallback((
        ev: any,
        field: {name: string, value: string, onChange: (...event: any[]) => void},
    ) => {
        const [, type, min, max] = ev.target.value.match(/^([A-Za-z0-9_]+)(?:\((\d+)-(\d+)\))?$/) ?? []

        const options = { shouldDirty: true, shouldTouch: true, shouldValidate: true }
        form.setValue(field.name, type.toUpperCase(), options)
        form.setValue(field.name.replace(/\.type$/, '.scaleMin'), Number(min) || 0, options)
        form.setValue(field.name.replace(/\.type$/, '.scaleMax'), Number(max) || 0, options)
    }, [form])

    return (
        <Droppable droppableId={name} type='question'>
            {provided => (
                <div
                    className={styles.questionWrap}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                >
                    {!formQuestionsArray.fields.length && (
                        <div className='errorMessage'>At least one question is required</div>
                    )}
                    {formQuestionsArray.fields.map((questionField, index) => (
                        <Draggable
                            key={questionField.id}
                            draggableId={questionField.id}
                            index={index}
                        >
                            {draggableProvided => (
                                <div
                                    ref={draggableProvided.innerRef}
                                    {...draggableProvided.draggableProps}
                                    {...draggableProvided.dragHandleProps}
                                    className={styles.questionItem}
                                >
                                    <div className={classNames('body-small main-group', styles.headerAreaLabel)}>
                                        Question
                                        {` ${props.sectionIndex}`}
                                        .
                                        {index + 1}
                                    </div>
                                    <InputWrapper
                                        placeholder='Question Name'
                                        name={`${name}.${index}.description`}
                                        className='main-group'
                                    >
                                        <input type='text' />
                                    </InputWrapper>
                                    <InputWrapper
                                        placeholder='Weight'
                                        name={`${name}.${index}.weight`}
                                        className='weight-group'
                                    >
                                        <input type='number' />
                                    </InputWrapper>
                                    <TrashIcon
                                        className={classNames(styles.trashIcon, styles.blue, 'action-group')}
                                        onClick={function handleRemoveItem() { handleRemove(index, questionField) }}
                                    />

                                    <InputWrapper
                                        placeholder='Question Guideline'
                                        name={`${name}.${index}.guidelines`}
                                        className='main-group'
                                    >
                                        <textarea rows={4} />
                                    </InputWrapper>

                                    <div className={classNames('main-group', styles.doubleInputWrap)}>
                                        <InputWrapper
                                            placeholder='Select Scale'
                                            name={`${name}.${index}.type`}
                                        >
                                            <BasicSelect
                                                options={scorecardScaleOptions}
                                                {...{
                                                    mapValue: (value: string) => (
                                                        `${value?.toLowerCase()}${
                                                            value === 'SCALE'
                                                                ? `(${
                                                                    get(values, `${name}.${index}.scaleMin`)
                                                                }-${
                                                                    get(values, `${name}.${index}.scaleMax`)
                                                                })`
                                                                : ''
                                                        }`
                                                    ),
                                                    onChange: ((
                                                        ev: ChangeEvent<HTMLInputElement>,
                                                        field: any,
                                                    ) => handleScaleChange(ev, field)) as ChangeEventHandler,
                                                }}
                                            />
                                        </InputWrapper>
                                        <input
                                            type='hidden'
                                            {...form.register(`${name}.${index}.scaleMin`)}
                                        />
                                        <input
                                            type='hidden'
                                            {...form.register(`${name}.${index}.scaleMax`)}
                                        />

                                        <InputWrapper
                                            name={`${name}.${index}.requiresUpload`}
                                            placeholder='Select Document Requirements'
                                        >
                                            <BasicSelect
                                                options={yesNoOptions}
                                                onChange={(function handleChangeRequireUpload(
                                                    ev: ChangeEvent<HTMLInputElement>,
                                                    field: any,
                                                ) {
                                                    field.onChange({
                                                        ...ev,
                                                        target: { ...ev.target, value: ev.target.value === 'true' },
                                                    })
                                                }) as ChangeEventHandler}
                                            />
                                        </InputWrapper>
                                    </div>
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                    <div className={styles.footerArea}>
                        <Button secondary onClick={handleAddQuestion} uiv2>
                            + Add New Question
                        </Button>

                        {formQuestionsArray.fields.length > 0 && (
                            <CalculatedWeightsSum
                                fieldName={name}
                                label='Questions'
                                description='The sum of question weights within a section must total 100.'
                                error={(
                                    get(form.formState.errors, `${name}.root.message`)
                                    || get(form.formState.errors, `${name}.message`)
                                ) as unknown as string}
                            />
                        )}
                    </div>
                </div>
            )}
        </Droppable>
    )
}

export default ScorecardQuestionForm
