import * as yup from 'yup'
import { get } from 'lodash'
import { FieldValues, UseFormReturn } from 'react-hook-form'

import { Scorecard, ScorecardGroup, ScorecardQuestion, ScorecardSection } from '../../../lib/models'

export const getEmptyScorecardQuestion = (): ScorecardQuestion => ({
    description: '',
    guidelines: '',
    requiresUpload: '',
    scaleMax: '',
    scaleMin: '',
    sortOrder: 0,
    type: '',
    weight: '',
} as unknown as ScorecardQuestion)

export const getEmptyScorecardSection = (questions: ScorecardQuestion[] = []): ScorecardSection => ({
    name: '',
    questions,
    sortOrder: 0,
    weight: '',
} as unknown as ScorecardSection)

export const getEmptyScorecardGroup = (sections: ScorecardSection[] = []): ScorecardGroup => ({
    name: '',
    sections,
    sortOrder: 0,
    weight: '',
} as unknown as ScorecardGroup)

export const getEmptyScorecard = (): Scorecard => ({
    challengeTrack: '',
    challengeType: '',
    maxScore: '',
    minimumPassingScore: '',
    minScore: '',
    name: '',
    scorecardGroups: [getEmptyScorecardGroup(
        [getEmptyScorecardSection(
            [getEmptyScorecardQuestion()],
        )],
    )],
    status: '',
    type: '',
    version: '',
} as unknown as Scorecard)

export const isFieldDirty = (form: UseFormReturn<FieldValues, any, FieldValues>, fieldName: string): boolean => (
    get(form.formState.dirtyFields, fieldName)
    || get(form.formState.touchedFields, fieldName)
    || form.formState.submitCount > 0
)

export const weightsSum = (
    label: string,
    value = 100,
): [string, string, (items?: {weight: number}[]) => boolean] => ([
    'sum-weights-100',
    `The sum of ${label} weights must total ${value}.`,
    ((items: {weight: number}[] | undefined, ctx: yup.TestContext) => {
        if (!items?.length) return false
        const sum = items.reduce((acc, g) => acc + (Number(g.weight) || 0), 0)

        if (sum !== value) {
            // force the error to go into `.root`, otherwise it will overwride the array errors
            return ctx.createError({
                path: ctx.path.replace(/(\.root$)|$/, '.root'),
            })
        }

        return true
    }) as any,
])
