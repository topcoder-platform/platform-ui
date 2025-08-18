import * as yup from 'yup';
import { FC } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import styles from '../EditScorecardPage.module.scss'
import classNames from 'classnames';
import { InputSelect, InputText } from '~/libs/ui';
import { ProjectTypeLabels, scorecardCategories, ScorecardStatusLabels, ScorecardTypeLabels } from '../../../../lib/models';
import { isFieldDirty } from '../utils';

const projectTypeOptions = Object.entries(ProjectTypeLabels).map(([value, label]) => ({ value, label }))
const statusOptions = Object.entries(ScorecardStatusLabels).map(([value, label]) => ({ value, label }))
const typeOptions = Object.entries(ScorecardTypeLabels).map(([value, label]) => ({ value, label }))
const categoryOptions = scorecardCategories.map((key) => ({ value: key, label: key }))

export const scorecardInfoSchema = {
    name: yup.string().required('Scorecard Name is required'),
    challengeType: yup.string().required('Category is required'),
    version: yup.string().required('Version is required'),
    status: yup.string().required('Status is required'),
    type: yup.string().required('Type is required'),
    minScore: yup
        .number()
        .typeError('Min. Score must be a number')
        .required('Min. Score is required')
        .min(0, 'Min. Score must be at least 0'),
    maxScore: yup
        .number()
        .typeError('Max. Score must be a number')
        .required('Max. Score is required')
        .moreThan(yup.ref('minScore'), 'Max. Score must be greater than Min. Score'),
    challengeTrack: yup.string().required('Project Type is required'),
};

interface ScorecardInfoFormProps {
}

const ScorecardInfoForm: FC<ScorecardInfoFormProps> = props => {
    const form = useFormContext();
    console.log('here', form.formState)

    return (
        <div className={classNames(styles.grayWrapper, styles.scorecardInfo)}>
            <Controller
                name="name"
                control={form.control}
                render={({ field: { ref, ...field } }) => (
                    <InputText
                        label='Scorecard Name'
                        type="text"
                        {...field}
                        forceUpdateValue
                        classNameWrapper={styles.mdWidthInput}
                        error={form.formState.errors.name?.message as unknown as string}
                        dirty={isFieldDirty(form, 'name')}
                    />
                )}
            />
            <Controller
                name="challengeType"
                control={form.control}
                render={({ field: { ref, ...field } }) => (
                    <InputSelect
                        {...field}
                        label="Category"
                        options={categoryOptions}
                        classNameWrapper={styles.mdWidthInput}
                        error={form.formState.errors.challengeType?.message as unknown as string}
                        dirty={isFieldDirty(form, 'challengeType')}
                    />
                )}
            />
            <Controller
                name="version"
                control={form.control}
                render={({ field: { ref, ...field } }) => (
                    <InputText
                        label='Version'
                        type="text"
                        {...field}
                        forceUpdateValue
                        classNameWrapper={styles.mdWidthInput}
                        error={form.formState.errors.version?.message as unknown as string}
                        dirty={isFieldDirty(form, 'version')}
                    />
                )}
            />
            <Controller
                name="status"
                control={form.control}
                render={({ field: { ref, ...field } }) => (
                    <InputSelect
                        {...field}
                        label="Status"
                        options={statusOptions}
                        classNameWrapper={styles.mdWidthInput}
                        error={form.formState.errors.status?.message as unknown as string}
                        dirty={isFieldDirty(form, 'status')}
                    />
                )}
            />
            <Controller
                name="type"
                control={form.control}
                render={({ field: { ref, ...field } }) => (
                    <InputSelect
                        {...field}
                        label="Type"
                        options={typeOptions}
                        classNameWrapper={styles.mdWidthInput}
                        error={form.formState.errors.type?.message as unknown as string}
                        dirty={isFieldDirty(form, 'type')}
                    />
                )}
            />
            <div className={classNames(styles.mdWidthInput, styles.doubleInputWrap)}>
                <Controller
                    name="minScore"
                    control={form.control}
                    render={({ field: { ref, ...field } }) => (
                        <InputText
                            label='Min. Score'
                            type="number"
                            {...field}
                            forceUpdateValue
                            classNameWrapper={styles.qWidthInput}
                            error={form.formState.errors.minScore?.message as unknown as string}
                            dirty={isFieldDirty(form, 'minScore')}
                        />
                    )}
                />
                <Controller
                    name="maxScore"
                    control={form.control}
                    render={({ field: { ref, ...field } }) => (
                        <InputText
                            label='Max. Score'
                            type="number"
                            {...field}
                            forceUpdateValue
                            classNameWrapper={styles.qWidthInput}
                            error={form.formState.errors.maxScore?.message as unknown as string}
                            dirty={isFieldDirty(form, 'maxScore')}
                        />
                    )}
                />
            </div>
            <Controller
                name="challengeTrack"
                control={form.control}
                render={({ field: { ref, ...field } }) => (
                    <InputSelect
                        {...field}
                        label="Project Type"
                        options={projectTypeOptions}
                        classNameWrapper={styles.mdWidthInput}
                        error={form.formState.errors.challengeTrack?.message as unknown as string}
                        dirty={isFieldDirty(form, 'challengeTrack')}
                    />
                )}
            />
        </div>
    )
}

export default ScorecardInfoForm
