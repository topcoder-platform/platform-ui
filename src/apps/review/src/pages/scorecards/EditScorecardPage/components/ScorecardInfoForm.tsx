import * as yup from 'yup'
import { FC, useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import classNames from 'classnames'

import {
    ProjectTypeLabels,
    ScorecardStatusLabels,
    ScorecardTypeLabels,
} from '../../../../lib/models'
import {
    useFetchChallengeTracks,
    useFetchChallengeTypes,
} from '../../../../lib/hooks'
import type {
    useFetchChallengeTracksProps,
    useFetchChallengeTypesProps,
} from '../../../../lib/hooks'
import styles from '../EditScorecardPage.module.scss'

import BasicSelect from './BasicSelect'
import InputWrapper from './InputWrapper'

const statusOptions = Object.entries(ScorecardStatusLabels)
    .map(([value, label]) => ({ label, value }))
const typeOptions = Object.entries(ScorecardTypeLabels)
    .map(([value, label]) => ({ label, value }))

export const scorecardInfoSchema = {
    challengeTrack: yup.string()
        .required('Challenge Track is required'),
    challengeType: yup.string()
        .required('Challenge Type is required'),
    maxScore: yup
        .number()
        .typeError('Max score must be a number')
        .required('Max score is required')
        .moreThan(yup.ref('minScore'), 'Max score must be greater than min score')
        .max(100, 'Max score must be lower than 100'),
    minimumPassingScore: yup
        .number()
        .typeError('Passing score must be a number')
        .required('Passing score is required')
        .min(
            yup.ref('minScore'),
            'Passing score must be greater than or equal to min score',
        )
        .max(
            yup.ref('maxScore'),
            'Passing score must be less than or equal to max score',
        ),
    minScore: yup
        .number()
        .typeError('Min Score must be a number')
        .required('Min Score is required')
        .min(0, 'Min Score must be at least 0'),
    name: yup.string()
        .required('Scorecard Name is required'),
    status: yup.string()
        .required('Status is required'),
    type: yup.string()
        .required('Type is required'),
    version: yup.string()
        .required('Version is required'),
}

const toChallengeTrackLabel = (value: string): string => (
    ProjectTypeLabels[value as keyof typeof ProjectTypeLabels]
    ?? value
)

const legacyChallengeTrackMap: Record<string, string> = {
    DEVELOPMENT: 'DEVELOP',
    QUALITY_ASSURANCE: 'QA',
}

const normalizeChallengeTrackValue = (
    value: string,
    tracks: useFetchChallengeTracksProps['challengeTracks'],
): string | undefined => {
    if (!value) return undefined

    const directMatch = tracks.find(track => track.track === value && track.isActive)
    if (directMatch) {
        return directMatch.track
    }

    const mappedValue = legacyChallengeTrackMap[value]
    if (mappedValue) {
        const mappedMatch = tracks.find(track => track.track === mappedValue && track.isActive)
        if (mappedMatch) {
            return mappedMatch.track
        }
    }

    const normalizedLabel = toChallengeTrackLabel(value)
    const nameMatch = tracks.find(track => track.name === normalizedLabel && track.isActive)
    if (nameMatch) {
        return nameMatch.track
    }

    const uppercaseValue = value
        .replace(/\s+/g, '_')
        .toUpperCase()
    const fallbackMatch = tracks.find(track => (
        track.name
            .replace(/\s+/g, '_')
            .toUpperCase() === uppercaseValue
        && track.isActive
    ))

    return fallbackMatch?.track
}

const ScorecardInfoForm: FC = () => {
    const form = useFormContext()
    const { challengeTracks }: useFetchChallengeTracksProps = useFetchChallengeTracks()
    const { challengeTypes }: useFetchChallengeTypesProps = useFetchChallengeTypes()

    const challengeTrackOptions = useMemo(() => (
        challengeTracks
            .filter(track => track.isActive)
            .map(track => ({
                label: track.name,
                value: track.track,
            }))
    ), [challengeTracks])

    const challengeTypeOptions = useMemo(() => (
        challengeTypes
            .filter(type => type.isActive)
            .map(type => ({
                label: type.name,
                value: type.name,
            }))
    ), [challengeTypes])

    useEffect(() => {
        if (!challengeTrackOptions.length) {
            return
        }

        const currentValue: string = form.getValues('challengeTrack') as string
        const isCurrentValid: boolean = !!currentValue
            && challengeTrackOptions.some(option => option.value === currentValue)

        if (currentValue && !isCurrentValid) {
            const normalizedValue = normalizeChallengeTrackValue(currentValue, challengeTracks)
            if (normalizedValue) {
                form.setValue('challengeTrack', normalizedValue, {
                    shouldDirty: false,
                    shouldValidate: true,
                })
                return
            }
        }

        if (!isCurrentValid) {
            form.setValue('challengeTrack', challengeTrackOptions[0].value, {
                shouldDirty: false,
                shouldValidate: true,
            })
        }
    }, [challengeTrackOptions, challengeTracks, form])

    useEffect(() => {
        if (!challengeTypeOptions.length) {
            return
        }

        const currentChallengeType: string = form.getValues('challengeType') as string
        const partOfCategories: { label: string; value: string } | undefined
            = challengeTypeOptions.find(item => item.value === currentChallengeType)
        if ((!partOfCategories || !currentChallengeType) && challengeTypeOptions.length > 0) {
            form.setValue('challengeType', challengeTypeOptions[0].value, {
                shouldDirty: false,
                shouldValidate: true,
            })
        }
    }, [challengeTypeOptions, form])

    return (
        <div className={classNames(styles.grayWrapper, styles.scorecardInfo)}>
            <InputWrapper
                label='Scorecard Name'
                name='name'
                className={styles.mdWidthInput}
            >
                <input type='text' />
            </InputWrapper>
            <InputWrapper
                label='Challenge Type'
                name='challengeType'
                className={styles.mdWidthInput}
            >
                <BasicSelect options={challengeTypeOptions} />
            </InputWrapper>
            <InputWrapper
                label='Version'
                name='version'
                className={styles.mdWidthInput}
            >
                <input type='text' />
            </InputWrapper>
            <InputWrapper
                label='Status'
                name='status'
                className={styles.mdWidthInput}
            >
                <BasicSelect options={statusOptions} />
            </InputWrapper>
            <InputWrapper
                label='Scorecard Type'
                name='type'
                className={styles.mdWidthInput}
            >
                <BasicSelect options={typeOptions} />
            </InputWrapper>
            <div className={classNames(styles.mdWidthInput, styles.doubleInputWrap)}>
                <InputWrapper
                    label='Min. Score'
                    name='minScore'
                    className={styles.qWidthInput}
                >
                    <input type='number' />
                </InputWrapper>
                <InputWrapper
                    label='Max. Score'
                    name='maxScore'
                    className={styles.qWidthInput}
                >
                    <input type='number' />
                </InputWrapper>
                <InputWrapper
                    label='Passing Score'
                    name='minimumPassingScore'
                    className={styles.qWidthInput}
                >
                    <input type='number' />
                </InputWrapper>
            </div>
            <InputWrapper
                label='Challenge Track'
                name='challengeTrack'
                className={styles.mdWidthInput}
            >
                <BasicSelect options={challengeTrackOptions} />
            </InputWrapper>
        </div>
    )
}

export default ScorecardInfoForm
