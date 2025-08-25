import * as yup from 'yup'
import { get } from 'lodash'
import { ChangeEvent, ChangeEventHandler, FC, useCallback, useMemo } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import classNames from 'classnames'

import {
    Active,
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    Over,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TrashIcon } from '@heroicons/react/outline'
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
                        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
                        .required('Documents requirements is required'),
                    type: yup.string()
                        .required('Scale is required'),
                    weight: yup.number()
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

/** Sortable item shell for each question row */
const SortableItem: FC<{
    id: string;
    header: React.ReactNode;
    body: React.ReactNode;
    onRemove: () => void;
}> = props => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    }: ReturnType<typeof useSortable> = useSortable({ id: props.id })

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={classNames(
                styles.questionItem,
                isDragging ? styles.dragging : undefined,
            )}
        >
            <div className={classNames('body-small main-group', styles.headerAreaLabel)}>
                {/* Drag handle */}
                <button
                    type='button'
                    aria-label='Drag question'
                    className={classNames(styles.dragHandle, 'cursor-grab active:cursor-grabbing')}
                    {...attributes}
                    {...listeners}
                >
                    {/* simple handle icon */}
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='16' height='16'>
                        <path
                            fill='currentColor'
                            d='M7 4h-2v2h2V4zm8 0h-2v2h2V4zM7 9H5v2h2V9zm8 0h-2v2h2V9zM7 14H5v2h2v-2zm8 0h-2v2h2v-2z'
                        />
                    </svg>
                </button>

                {props.header}

                <TrashIcon
                    className={classNames(styles.trashIcon, styles.blue, 'action-group')}
                    onClick={props.onRemove}
                />
            </div>

            {props.body}
        </div>
    )
}

const ScorecardQuestionForm: FC<ScorecardQuestionFormProps> = props => {
    const form = useFormContext()
    const ctx = usePageContext()
    const values = form.getValues()

    const name = useMemo(() => `${props.prefix}.questions`, [props.prefix])
    const formQuestionsArray = useFieldArray({ control: form.control, name })

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor),
    )

    const handleRemove = useCallback(async (index: number, field: any) => {
        const fieldName = field.name ? field.name : `Question ${props.sectionIndex}.${index + 1}`
        if (!await ctx.confirm({
            content: `Are you sure you want to remove "${fieldName}" question?`,
            title: 'Confirm Remove Question',
        })) return
        formQuestionsArray.remove(index)
    }, [ctx, formQuestionsArray, props.sectionIndex])

    const handleAddQuestion = useCallback(() => {
        formQuestionsArray.append({
            ...getEmptyScorecardQuestion(),
            sortOrder: (Math.max(0, ...formQuestionsArray.fields.map(f => get(f, 'sortOrder', 0))) || 0) + 1,
        })
    }, [formQuestionsArray])

    const handleScaleChange = useCallback((
        ev: any,
        field: { name: string, value: string, onChange: (...event: any[]) => void },
    ) => {
        const [, type, min, max] = ev.target.value.match(/^([A-Za-z0-9_]+)(?:\((\d+)-(\d+)\))?$/) ?? []
        form.setValue(field.name, (type || '').toUpperCase(), { shouldValidate: true })
        form.setValue(field.name.replace(/\.type$/, '.scaleMin'), Number(min) || 0, { shouldValidate: true })
        form.setValue(field.name.replace(/\.type$/, '.scaleMax'), Number(max) || 0, { shouldValidate: true })
    }, [form])

    /** Recompute sortOrder to match visual order after any move */
    const syncSortOrder = useCallback(() => {
        const ids = formQuestionsArray.fields.map(f => f.id)
        ids.forEach((_, idx) => {
            form.setValue(`${name}.${idx}.sortOrder`, idx + 1, { shouldDirty: true, shouldValidate: false })
        })
    }, [form, formQuestionsArray.fields, name])

    const onDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over }: { active: Active; over: Over | null } = event
        if (!over || active.id === over.id) return

        const oldIndex = formQuestionsArray.fields.findIndex(f => f.id === active.id)
        const newIndex = formQuestionsArray.fields.findIndex(f => f.id === over.id)
        if (oldIndex < 0 || newIndex < 0) return

        // Move in RHF array
        formQuestionsArray.move(oldIndex, newIndex)

        // Update sortOrder to match UI
        syncSortOrder()
    }, [formQuestionsArray, syncSortOrder])

    return (
        <div className={styles.questionWrap}>
            {!formQuestionsArray.fields.length && (
                <div className='errorMessage'>At least one question is required</div>
            )}

            {/* === DnD wrappers === */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext
                    items={formQuestionsArray.fields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {formQuestionsArray.fields.map((questionField, index) => {
                        const header = (
                            <div className={classNames('body-small', styles.headerAreaLabel)}>
                                {/* Keep the original label */}
                                {`Question ${props.sectionIndex}.${index + 1}`}
                            </div>
                        )

                        const body = (
                            <>
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

                                <InputWrapper
                                    placeholder='Question Guideline'
                                    name={`${name}.${index}.guidelines`}
                                    className='main-group'
                                >
                                    <textarea rows={4} />
                                </InputWrapper>

                                <div className={classNames('main-group', styles.doubleInputWrap)}>
                                    <InputWrapper placeholder='Select Scale' name={`${name}.${index}.type`}>
                                        <BasicSelect
                                            options={scorecardScaleOptions}
                                            {...{
                                                mapValue: (value: string) => `${value?.toLowerCase()}${
                                                    value === 'SCALE'
                                                        ? `(${
                                                            get(values, `${name}.${index}.scaleMin`)
                                                        }-${
                                                            get(values, `${name}.${index}.scaleMax`)
                                                        })`
                                                        : ''
                                                }`,
                                                onChange: ((
                                                    ev: ChangeEvent<HTMLInputElement>,
                                                    field: any,
                                                ) => handleScaleChange(ev, field)) as ChangeEventHandler,
                                            }}
                                        />
                                    </InputWrapper>

                                    <input type='hidden' {...form.register(`${name}.${index}.scaleMin`)} />
                                    <input type='hidden' {...form.register(`${name}.${index}.scaleMax`)} />

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
                            </>
                        )

                        const handleRemoveClick = (): Promise<void> => handleRemove(index, questionField)

                        return (
                            <SortableItem
                                key={questionField.id}
                                id={questionField.id}
                                header={header}
                                body={body}
                                // eslint-disable-next-line react/jsx-no-bind
                                onRemove={handleRemoveClick}
                            />
                        )
                    })}
                </SortableContext>
            </DndContext>

            <div className={styles.footerArea}>
                <Button secondary onClick={handleAddQuestion} uiv2>
                    + Add New Question
                </Button>

                {formQuestionsArray.fields.length > 0 && (
                    <CalculatedWeightsSum
                        fieldName={name}
                        label='Questions'
                        description='The sum of question weights within a section must total 100.'
                        error={
                            (get(form.formState.errors, `${name}.root.message`)
                            || get(form.formState.errors, `${name}.message`)) as unknown as string
                        }
                    />
                )}
            </div>
        </div>
    )
}

export default ScorecardQuestionForm
