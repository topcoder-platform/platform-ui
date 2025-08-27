/* eslint-disable import/no-extraneous-dependencies */
import * as yup from 'yup'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Button, LinkButton } from '~/libs/ui'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { yupResolver } from '@hookform/resolvers/yup'

import { PageWrapper } from '../../../lib'
import { useFetchScorecard } from '../../../lib/hooks/useFetchScorecard'
import { saveScorecard } from '../../../lib/services'
import { rootRoute } from '../../../config/routes.config'
import type { ScorecardQuestion, ScorecardSection } from '../../../lib/models'

import { getEmptyScorecard } from './utils'
import { EditScorecardPageContextProvider } from './EditScorecardPage.context'
import ScorecardGroupForm, { scorecardGroupSchema } from './components/ScorecardGroupForm'
import ScorecardInfoForm, { scorecardInfoSchema } from './components/ScorecardInfoForm'
import styles from './EditScorecardPage.module.scss'

const EditScorecardPage: FC = () => {
    const navigate = useNavigate()
    const [isSaving, setSaving] = useState(false)
    const params = useParams()
    const isEditMode = !!params.scorecardId
    const scorecardQuery = useFetchScorecard(params.scorecardId, false)
    const title = useMemo(() => (
        `${isEditMode ? 'Edit' : 'Create'} Scorecard`
    ), [isEditMode])
    const breadCrumb = useMemo(
        () => [
            { index: 1, label: 'Scorecards', path: '..' },
            { index: 2, label: title },
        ],
        [title],
    )

    const editForm = useForm({
        defaultValues: getEmptyScorecard(),
        mode: 'all',
        resolver: yupResolver(yup.object({
            ...scorecardInfoSchema,
            ...(scorecardGroupSchema as unknown as any),
        })),
    })

    useEffect(() => {
        if (scorecardQuery.scorecard && !scorecardQuery.isValidating) {
            editForm.reset(scorecardQuery.scorecard)
        }
    }, [scorecardQuery.scorecard, scorecardQuery.isValidating])

    const handleSubmit = useCallback(async (value: any): Promise<void> => {
        setSaving(true)
        try {
            const response = await saveScorecard(value)
            toast.info('Scorecard saved successfully!')
            if (response.id || value.id) {
                navigate(`${rootRoute}/scorecard/${response.id || value.id}`)
            }
        } catch (e: any) {
            toast.error(`Couldn't save scorecard! ${e.message}`)
            console.error("Couldn't save scorecard!", e)
        } finally {
            setSaving(false)
        }
    }, [params.scorecardId, navigate])

    // Helper function to reorder array items
    const reorder = (list: any[], startIndex: number, endIndex: number): any[] => {
        const result = Array.from(list)
        const [removed] = result.splice(startIndex, 1)
        result.splice(endIndex, 0, removed)
        return result
    }

    // Helper function to move item between arrays
    const move = (
        source: any[],
        destination: any[],
        sourceIndex: number,
        destinationIndex: number,
    ): { source: any[]; destination: any[] } => {
        const sourceClone = Array.from(source)
        const destClone = Array.from(destination)
        const [removed] = sourceClone.splice(sourceIndex, 1)
        destClone.splice(destinationIndex, 0, removed)
        return {
            destination: destClone,
            source: sourceClone,
        }
    }

    function onDragEnd(result: DropResult): void {
        if (!result.destination) return

        const { source, destination, type }: DropResult<string> = result

        if (type === 'group') {
            const newGroups = reorder(editForm.getValues('scorecardGroups'), source.index, destination.index)
            editForm.setValue('scorecardGroups', newGroups, { shouldDirty: true, shouldValidate: true })
        } else if (type === 'section') {
            const groups = editForm.getValues('scorecardGroups')
            const sourceGroupIndex = Number(source.droppableId.split('.')[1])
            const destGroupIndex = Number(destination.droppableId.split('.')[1])

            if (sourceGroupIndex === destGroupIndex) {
                const newSections = reorder(groups[sourceGroupIndex].sections, source.index, destination.index)
                groups[sourceGroupIndex].sections = newSections
            } else {
                const {
                    source: newSourceSections,
                    destination: newDestSections,
                }: { source: ScorecardSection[], destination: ScorecardSection[]} = move(
                    groups[sourceGroupIndex].sections,
                    groups[destGroupIndex].sections,
                    source.index,
                    destination.index,
                )

                const movedSection = newDestSections[destination.index]
                if (movedSection) {
                    delete movedSection.id

                    movedSection.questions.forEach((question: any) => {
                        delete question.id
                    })
                }

                groups[sourceGroupIndex].sections = newSourceSections
                groups[destGroupIndex].sections = newDestSections
            }

            editForm.setValue('scorecardGroups', groups, { shouldDirty: true, shouldValidate: true })
        } else if (type === 'question') {
            const groups = editForm.getValues('scorecardGroups')
            const parseDroppableId = (id: string): { groupIndex: number; sectionIndex: number } => {
                const parts = id.split('.')
                return {
                    groupIndex: Number(parts[1]),
                    sectionIndex: Number(parts[3]),
                }
            }

            const sourceIds = parseDroppableId(source.droppableId)
            const destIds = parseDroppableId(destination.droppableId)

            if (sourceIds.groupIndex === destIds.groupIndex && sourceIds.sectionIndex === destIds.sectionIndex) {
                const questions = groups[sourceIds.groupIndex].sections[sourceIds.sectionIndex].questions
                const newQuestions = reorder(questions, source.index, destination.index)
                groups[sourceIds.groupIndex].sections[sourceIds.sectionIndex].questions = newQuestions
            } else {
                const sourceQuestions = groups[sourceIds.groupIndex].sections[sourceIds.sectionIndex].questions
                const destQuestions = groups[destIds.groupIndex].sections[destIds.sectionIndex].questions
                const {
                    source: newSourceQuestions,
                    destination: newDestQuestions,
                }: { source: ScorecardQuestion[], destination: ScorecardQuestion[]} = move(
                    sourceQuestions,
                    destQuestions,
                    source.index,
                    destination.index,
                )

                const movedQuestion = newDestQuestions[destination.index]
                if (movedQuestion) {
                    delete movedQuestion.id
                }

                groups[sourceIds.groupIndex].sections[sourceIds.sectionIndex].questions = newSourceQuestions
                groups[destIds.groupIndex].sections[destIds.sectionIndex].questions = newDestQuestions
            }

            editForm.setValue('scorecardGroups', groups, { shouldDirty: true, shouldValidate: true })
        }
    }

    if (scorecardQuery.isValidating) {
        return <></>
    }

    return (
        <EditScorecardPageContextProvider>
            <PageWrapper
                pageTitle={title}
                breadCrumb={breadCrumb}
            >
                <form className={styles.pageContentWrap} onSubmit={editForm.handleSubmit(handleSubmit)}>
                    <FormProvider {...editForm}>
                        <DragDropContext onDragEnd={onDragEnd}>
                            <h3 className={styles.sectionTitle}>1. Scorecard Information</h3>
                            <ScorecardInfoForm />

                            <h3 className={styles.sectionTitle}>2. Evaluation Structure</h3>
                            <ScorecardGroupForm />
                        </DragDropContext>

                        <div className={styles.bottomContainer}>
                            <hr />
                            <div className={styles.buttonsWrap}>
                                <LinkButton to='..' type='button' secondary uiv2>
                                    Cancel
                                </LinkButton>
                                <Button type='submit' primary disabled={isSaving || !editForm.formState.isDirty} uiv2>
                                    Save Scorecard
                                </Button>
                            </div>
                        </div>
                    </FormProvider>
                </form>
            </PageWrapper>
        </EditScorecardPageContextProvider>
    )
}

export default EditScorecardPage
