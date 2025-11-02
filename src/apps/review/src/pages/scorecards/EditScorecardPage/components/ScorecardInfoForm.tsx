import * as yup from 'yup'
import { FC, useCallback, useEffect, useMemo, useRef } from 'react'
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
    DEVELOPMENT: 'DEVELOPMENT',
    DEVELOP: 'DEVELOPMENT',
    QUALITY_ASSURANCE: 'QUALITY_ASSURANCE',
    QA: 'QUALITY_ASSURANCE',
}

const normalizeTrackOptionValue = (track: useFetchChallengeTracksProps['challengeTracks'][number]): string => {
    if (track.track) {
        return track.track
    }

    const normalizedName = track.name
        ?.replace(/\s+/g, '_')
        .toUpperCase()

    if (normalizedName && legacyChallengeTrackMap[normalizedName]) {
        return legacyChallengeTrackMap[normalizedName]
    }

    if (track.name) {
        return normalizedName || track.name
    }

    return track.id
}

const normalizeChallengeTrackValue = (
    value: string,
    tracks: useFetchChallengeTracksProps['challengeTracks'],
): string | undefined => {
    if (!value) return undefined

    const directMatch = tracks.find(track => track.track === value && track.isActive)
    if (directMatch) {
        return normalizeTrackOptionValue(directMatch)
    }

    const mappedValue = legacyChallengeTrackMap[value]
    if (mappedValue) {
        const mappedMatch = tracks.find(track => (
            normalizeTrackOptionValue(track) === mappedValue && track.isActive
        ))
        if (mappedMatch) {
            return normalizeTrackOptionValue(mappedMatch)
        }
    }

    const normalizedLabel = toChallengeTrackLabel(value)
    const nameMatch = tracks.find(track => track.name === normalizedLabel && track.isActive)
    if (nameMatch) {
        return normalizeTrackOptionValue(nameMatch)
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

    return fallbackMatch ? normalizeTrackOptionValue(fallbackMatch) : undefined
}

const ScorecardInfoForm: FC = () => {
    const form = useFormContext()
    const { challengeTracks }: useFetchChallengeTracksProps = useFetchChallengeTracks()
    const { challengeTypes }: useFetchChallengeTypesProps = useFetchChallengeTypes()
    const { getValues, setValue } = form
    const normalizeValue = useCallback((
        value: string | number | boolean | null | undefined,
    ): string | undefined => {
        if (value === null || value === undefined) {
            return undefined
        }

        const normalized = String(value).trim()

        return normalized.length ? normalized : undefined
    }, [])

    const challengeTrackOptions = useMemo(() => (
        challengeTracks
            .filter(track => track.isActive)
            .map(track => ({
                label: track.name,
                value: normalizeTrackOptionValue(track),
            }))
    ), [challengeTracks])

    const fallbackChallengeTrack = useMemo(
        () => challengeTrackOptions.find(option => option.value)?.value,
        [challengeTrackOptions],
    )
    const shouldNormalizeTrack = useRef(true)

    const challengeTypeOptions = useMemo(() => (
        challengeTypes
            .filter(type => type.isActive)
            .map(type => ({
                label: type.name,
                value: type.name,
            }))
    ), [challengeTypes])

    const fallbackChallengeType = useMemo(
        () => challengeTypeOptions.find(option => option.value)?.value,
        [challengeTypeOptions],
    )
    const shouldNormalizeType = useRef(true)

    useEffect(() => {
        if (!shouldNormalizeTrack.current) {
            return
        }

        if (!challengeTrackOptions.length) {
            return
        }

        const currentValue = normalizeValue(getValues('challengeTrack') as string)
        const isCurrentValid: boolean = !!currentValue
            && challengeTrackOptions.some(option => (
                normalizeValue(option.value) === currentValue
            ))

        if (currentValue && !isCurrentValid) {
            const normalizedValue = normalizeValue(
                normalizeChallengeTrackValue(currentValue, challengeTracks),
            )

            if (normalizedValue && normalizedValue !== currentValue) {
                setValue('challengeTrack', normalizedValue, {
                    shouldDirty: false,
                    shouldValidate: true,
                })
            }

            return
        }

        if (!isCurrentValid && fallbackChallengeTrack) {
            const normalizedFallback = normalizeValue(fallbackChallengeTrack)

            if (normalizedFallback && normalizedFallback !== currentValue) {
                setValue('challengeTrack', normalizedFallback, {
                    shouldDirty: false,
                    shouldValidate: true,
                })
            }
        }

        shouldNormalizeTrack.current = false
    }, [
        challengeTrackOptions,
        challengeTracks,
        fallbackChallengeTrack,
        getValues,
        normalizeValue,
        setValue,
    ])

    useEffect(() => {
        if (!shouldNormalizeType.current) {
            return
        }

        if (!challengeTypeOptions.length) {
            return
        }

        const currentChallengeType = normalizeValue(getValues('challengeType') as string)
        const partOfCategories: { label: string; value: string } | undefined
            = challengeTypeOptions.find(item => (
                normalizeValue(item.value) === currentChallengeType
            ))

        if ((!partOfCategories || !currentChallengeType) && fallbackChallengeType) {
            const normalizedFallback = normalizeValue(fallbackChallengeType)

            if (normalizedFallback && normalizedFallback !== currentChallengeType) {
                setValue('challengeType', normalizedFallback, {
                    shouldDirty: false,
                    shouldValidate: true,
                })
            }
        }

        shouldNormalizeType.current = false
    }, [
        challengeTypeOptions,
        fallbackChallengeType,
        getValues,
        normalizeValue,
        setValue,
    ])

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
