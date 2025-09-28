import * as yup from 'yup'
import { FC, useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import classNames from 'classnames'

import {
    categoryByProjectType,
    ProjectType,
    ProjectTypeLabels,
    scorecardCategories,
    ScorecardStatusLabels,
    ScorecardTypeLabels,
} from '../../../../lib/models'
import styles from '../EditScorecardPage.module.scss'

import BasicSelect from './BasicSelect'
import InputWrapper from './InputWrapper'

const projectTypeOptions = Object.entries(ProjectTypeLabels)
    .map(([value, label]) => ({ label, value }))
const statusOptions = Object.entries(ScorecardStatusLabels)
    .map(([value, label]) => ({ label, value }))
const typeOptions = Object.entries(ScorecardTypeLabels)
    .map(([value, label]) => ({ label, value }))
const categoryOptions = (projectType?: ProjectType): { label: string; value: string }[] => {
    let categories = scorecardCategories
    if (projectType) {
        categories = categoryByProjectType[projectType]
    }

    return categories.map(key => ({ label: key, value: key }))
}

export const scorecardInfoSchema = {
    challengeTrack: yup.string()
        .required('Project Type is required'),
    challengeType: yup.string()
        .required('Category is required'),
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

const ScorecardInfoForm: FC = () => {
    const form = useFormContext()
    const challengeTrack = form.watch('challengeTrack')
    const categories = useMemo(() => categoryOptions(challengeTrack), [challengeTrack])

    useEffect(() => {
        const currentChallengeType = form.getValues('challengeType')
        const partOfCategories = categories.find(item => item.value === currentChallengeType)
        if ((!partOfCategories || !currentChallengeType || currentChallengeType === '') && categories.length > 0) {
            form.setValue('challengeType', categories[0].value, { shouldDirty: true })
        }
    }, [challengeTrack, categories, form])

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
                label='Category'
                name='challengeType'
                className={styles.mdWidthInput}
            >
                <BasicSelect options={categories} />
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
                label='Type'
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
                label='Project Type'
                name='challengeTrack'
                className={styles.mdWidthInput}
            >
                <BasicSelect options={projectTypeOptions} />
            </InputWrapper>
        </div>
    )
}

export default ScorecardInfoForm
