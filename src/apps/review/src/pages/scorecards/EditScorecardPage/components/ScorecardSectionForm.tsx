import * as yup from 'yup'
import { get } from 'lodash'
import { FC, useCallback, useMemo } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import classNames from 'classnames'

import { Button } from '~/libs/ui'
import { TrashIcon } from '@heroicons/react/outline'
import {
    Active,
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    Over,
    PointerSensor,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core'

import { usePageContext } from '../EditScorecardPage.context'
import { getEmptyScorecardSection, weightsSum } from '../utils'
import styles from '../EditScorecardPage.module.scss'

import CalculatedWeightsSum from './CalculatedWeightsSum'
import InputWrapper from './InputWrapper'
import ScorecardQuestionForm, { scorecardQuestionSchema } from './ScorecardQuestionForm'

export const scorecardSectionSchema = {
    sections: yup.array()
        .of(
            yup.object()
                .shape({
                    name: yup.string()
                        .required('Section name is required'),
                    weight: yup.number()
                        .typeError('Weight must be a number')
                        .required('Weight is required')
                        .min(0, 'Weight must be at least 0')
                        .max(100, 'Weight cannot exceed 100'),
                    ...scorecardQuestionSchema,
                }),
        )
        .min(1, 'At least one section is required')
        .test(...weightsSum('sections')),
}

interface ScorecardSectionFormProps {
    prefix: string;
}

/** Simple droppable wrapper to allow dropping into empty sections */
const SectionDroppable: FC<
    {
        id: string;
        className?: string;
        children: React.ReactNode
    }
> = props => {
    const { setNodeRef }: ReturnType<typeof useDroppable> = useDroppable({ id: props.id })
    return (
        <div ref={setNodeRef} className={props.className}>
            {props.children}
        </div>
    )
}

const ScorecardSectionForm: FC<ScorecardSectionFormProps> = props => {
    const form = useFormContext()
    const ctx = usePageContext()

    const name = useMemo(() => `${props.prefix}.sections`, [props.prefix])
    const formSectionsArray = useFieldArray({
        control: form.control,
        keyName: 'rhfId',
        name,
    })

    // Sensors for mouse/touch/keyboard
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor),
    )

    const handleRemove = useCallback(async (index: number, field: any) => {
        if (!await ctx.confirm({
            content: `Are you sure you want to remove "${field.name ? field.name : `Section ${index + 1}`}" section?`,
            title: 'Confirm Remove Section',
        })) return
        formSectionsArray.remove(index)
    }, [ctx, formSectionsArray])

    const handleAddSection = useCallback(() => {
        formSectionsArray.append({
            ...getEmptyScorecardSection(),
            sortOrder: formSectionsArray.fields.length,
        })
    }, [formSectionsArray])

    /** Helpers to locate question by its field.id across sections */
    // const findQuestionPath = useCallback((qId: string) => {
    //     for (let sIdx = 0; sIdx < formSectionsArray.fields.length; sIdx++) {
    //         const qPath = `${name}.${sIdx}.questions`
    //         const qs = (form.getValues(qPath) ?? []) as Array<{ id: string }>
    //         const qIdx = qs.findIndex(q => q?.id === qId)
    //         if (qIdx >= 0) return { questionIdx: qIdx, sectionIdx: sIdx }
    //     }

    //     return undefined
    // }, [form, formSectionsArray.fields.length, name])

    // const findSectionIdxByDroppableId = useCallback((droppableId: string) => {
    //     // droppable id format: `section-${sectionField.id}`
    //     const suffix = droppableId.replace(/^section-/, '')
    //     return formSectionsArray.fields.findIndex(sec => sec.rhfId === suffix)
    // }, [formSectionsArray.fields])

    // const resyncSortOrder = useCallback((sectionIdx: number) => {
    //     const qPath = `${name}.${sectionIdx}.questions`
    //     const qs = (form.getValues(qPath) ?? []) as Array<Record<string, any>>
    //     qs.forEach((_, i) => {
    //         form.setValue(`${qPath}.${i}.sortOrder`, i + 1, { shouldDirty: true })
    //     })
    // }, [form, name])

    // Get questions array for a section
    const getQs = useCallback(
        (sectionIdx: number): Array<
            { id: string | number }
        > => (form.getValues(`${name}.${sectionIdx}.questions`) ?? []) as Array<{ id: string | number }>,
        [form, name],
    )

    // Find a question by its *domain* id across all sections
    const findById = useCallback(
        (rawId: string) => {
            for (let s = 0; s < formSectionsArray.fields.length; s++) {
                const arr = getQs(s)
                const i = arr.findIndex(q => String(q?.id) === rawId)
                if (i >= 0) return { questionIdx: i, sectionIdx: s }
            }

            return undefined
        },
        [formSectionsArray.fields.length, getQs],
    )

    // eslint-disable-next-line complexity
    const onDragEnd: (event: DragEndEvent) => void = useCallback(event => {
        const { active, over }: { active: Active; over: Over | null } = event
        if (!over) return

        const activeId = String(active.id)
        const overId = String(over.id)

        const from = findById(activeId)
        if (!from) return

        // Determine target section + index
        let toSectionIdx: number
        let toIndex: number

        if (overId.startsWith('section-')) {
            // Dropped on a section's empty area -> append
            const suffix = overId.replace(/^section-/, '')
            toSectionIdx = formSectionsArray.fields.findIndex(sec => String((sec as any).rhfId) === suffix)
            const toArr = getQs(toSectionIdx)
            toIndex = toArr.length
        } else {
            // Dropped on top of another question -> insert at that question's index
            const overPath = findById(overId)
            if (!overPath) return
            toSectionIdx = overPath.sectionIdx
            toIndex = overPath.questionIdx
        }

        // Move item
        const fromPath = `${name}.${from.sectionIdx}.questions`
        const toPath = `${name}.${toSectionIdx}.questions`

        const fromArr = [...getQs(from.sectionIdx)]
        const toArr = (from.sectionIdx === toSectionIdx) ? fromArr : [...getQs(toSectionIdx)]

        const [moved] = fromArr.splice(from.questionIdx, 1)

        // If moving downwards within the same section, adjust insertion index
        let insertAt = toIndex
        if (from.sectionIdx === toSectionIdx && from.questionIdx < toIndex) insertAt = toIndex - 1

        toArr.splice(insertAt, 0, moved)

        // Persist
        form.setValue(fromPath, fromArr, { shouldDirty: true })
        form.setValue(toPath, toArr, { shouldDirty: true })

        // Optional: resync sortOrder
        const resync = (sIdx: number): void => {
            const arr = getQs(sIdx)
            arr.forEach((_, i) => form.setValue(`
                ${name}.${sIdx}.questions.${i}.sortOrder
            `, i + 1, { shouldDirty: true }))
        }

        resync(from.sectionIdx)
        if (toSectionIdx !== from.sectionIdx) resync(toSectionIdx)
    }, [findById, formSectionsArray.fields, getQs, form, name])

    return (
        <div className={styles.sectionWrap}>
            {!formSectionsArray.fields.length && (
                <div className='errorMessage'>At least one section is required</div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
            >
                {formSectionsArray.fields.map((sectionField, index) => {
                    const droppableId = `section-${sectionField.rhfId}`

                    return (
                        <div>
                            <div className={styles.headerArea}>
                                <div className={classNames('body-small', styles.headerAreaLabel)}>
                                    Section
                                    {` ${index + 1}`}
                                </div>
                                <div className={styles.headerAreaInputs}>
                                    <InputWrapper
                                        placeholder='Section Name'
                                        name={`${name}.${index}.name`}
                                        className={styles.xlWidthInput}
                                    >
                                        <input type='text' />
                                    </InputWrapper>
                                    <InputWrapper
                                        placeholder='Weight'
                                        name={`${name}.${index}.weight`}
                                        className={styles.smWidthInput}
                                    >
                                        <input type='number' />
                                    </InputWrapper>
                                    <TrashIcon
                                        className={styles.trashIcon}
                                        onClick={function handleRemoveItem() { handleRemove(index, sectionField) }}
                                    />
                                </div>
                            </div>

                            {/* Droppable area ensures you can drop into empty sections */}
                            <SectionDroppable id={droppableId} className={styles.contentArea}>
                                {/* IMPORTANT: ScorecardQuestionForm must render ONLY a SortableContext,
                                    not its own DndContext, so cross-section works */}
                                <ScorecardQuestionForm
                                    prefix={`${name}.${index}`}
                                    sectionIndex={index + 1}
                                />
                            </SectionDroppable>
                        </div>
                    )
                })}
            </DndContext>

            <div className={styles.footerArea}>
                <Button secondary onClick={handleAddSection} uiv2>
                    + Add New Section
                </Button>

                {formSectionsArray.fields.length > 0 && (
                    <CalculatedWeightsSum
                        fieldName={name}
                        label='Sections'
                        description='The sum of section weights within a group must total 100.'
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

export default ScorecardSectionForm
