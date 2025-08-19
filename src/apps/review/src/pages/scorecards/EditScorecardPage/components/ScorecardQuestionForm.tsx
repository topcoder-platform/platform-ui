import classNames from 'classnames';
import * as yup from 'yup';
import { get, merge } from 'lodash';
import { FC, useCallback, useMemo } from 'react'
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import { TrashIcon } from '@heroicons/react/outline';
import { Button, InputSelect, InputText, InputTextarea } from '~/libs/ui';
import { ScorecardQuestion, ScorecardScales, ScorecardSection } from '~/apps/review/src/lib/models';

import styles from '../EditScorecardPage.module.scss'
import { usePageContext } from '../EditScorecardPage.context';
import { getEmptyScorecardQuestion, isFieldDirty, weightsSum } from '../utils';

import CalculatedWeightsSum from './CalculatedWeightsSum';

const scorecardScaleOptions = Object.entries(ScorecardScales).map(([value, label]) => ({ value, label }))

export const scorecardQuestionSchema = {
    questions: yup.array().of(
            yup.object().shape({
            description: yup.string().required('Description is required'),
            weight: yup
                .number()
                .typeError('Weight must be a number')
                .required('Weight is required')
                .min(0, 'Weight must be at least 0')
                .max(100, 'Weight must be at most 100'),
            guidelines: yup.string().nullable(),
            type: yup.string().required('Scale is required'),
        })
    )
    .min(1, 'At least one question is required')
    .test(...weightsSum('questions'))
};

interface ScorecardQuestionFormProps {
    sectionIndex: number;
    prefix: string;
}

const ScorecardQuestionForm: FC<ScorecardQuestionFormProps> = props => {
    const form = useFormContext();
    const ctx = usePageContext();

    const name = useMemo(() => `${props.prefix}.questions`, [props.prefix]);
    const formQuestionsArray = useFieldArray({
        control: form.control,
        name,
    });

    const handleRemove = useCallback(async (index: number, field: any) => {
        if (!await ctx.confirm({
            title: 'Confirm Remove Question',
            content: `Are you sure you want to remove "${field.name ? field.name : `Question ${index + 1}`}" question?`
        })) {
            return;
        }

        formQuestionsArray.remove(index)
    }, [ctx]);

    const handleAddQuestion = useCallback(() => {
        formQuestionsArray.append({
            ...getEmptyScorecardQuestion(),
            sortOrder: Math.max(...formQuestionsArray.fields.map(f => get(f, 'sortOrder', 0))) + 1,
        })
    }, [formQuestionsArray])

    const handleScaleChange = useCallback((ev: any, field: {name: string, value: string, onChange: (...event: any[]) => void}) => {
        const [_, type, min, max] = ev.target.value.match(/^([A-Za-z0-9_]+)(?:\((\d+)-(\d+)\))?$/) ?? []

        form.setValue(field.name, type.toUpperCase())
        form.setValue(field.name.replace(/\.type$/, '.scaleMin'), Number(min) || 0)
        form.setValue(field.name.replace(/\.type$/, '.scaleMax'), Number(max) || 0)

        form.trigger()
        // field.onChange(merge({}, ev, {target: {value: type.toUpperCase()}}))
        console.log('here77', field.name, type, min, max, ev, merge({}, ev, {target: {value: type.toUpperCase()}}));

    }, []);

    return (
        <div className={styles.questionWrap}>
            {!formQuestionsArray.fields.length && (
                <div className='errorMessage'>At least one question is required</div>
            )}
            {formQuestionsArray.fields.map((questionField, index) => (
                <div key={questionField.id} className={styles.questionItem}>
                    <div className={classNames('body-small', styles.headerAreaLabel)}>
                        Question {props.sectionIndex}.{index+1}
                    </div>
                    <Controller
                        name={`${name}.${index}.description`}
                        control={form.control}
                        render={({ field: { ref, ...field } }) => (
                            <InputText
                                label='Question Description'
                                type="text"
                                {...field}
                                forceUpdateValue
                                classNameWrapper={styles.xlWidthInput}
                                error={get(form.formState.errors, `${name}.${index}.description.message`) as unknown as string}
                                dirty={isFieldDirty(form, `${name}.${index}.description`)}
                            />
                        )}
                    />
                    <Controller
                        name={`${name}.${index}.weight`}
                        control={form.control}
                        render={({ field: { ref, ...field } }) => (
                            <InputText
                                label='Weight'
                                type="number"
                                {...field}
                                forceUpdateValue
                                classNameWrapper={styles.smWidthInput}
                                error={get(form.formState.errors, `${name}.${index}.weight.message`) as unknown as string}
                                dirty={isFieldDirty(form, `${name}.${index}.weight`)}
                            />
                        )}
                    />
                    <TrashIcon className={classNames(styles.trashIcon, styles.blue)} onClick={() => handleRemove(index, questionField)} />

                    <Controller
                        name={`${name}.${index}.guidelines`}
                        control={form.control}
                        render={({ field: { ref, ...field } }) => (
                            <InputTextarea
                                label='Question Guidelines'
                                {...field}
                                classNameWrapper={styles.xlWidthInput}
                                rows={4}
                                error={get(form.formState.errors, `${name}.${index}.quidelines.message`) as unknown as string}
                                dirty={isFieldDirty(form, `${name}.${index}.quidelines`)}
                            />
                        )}
                    />

                    <Controller
                        name={`${name}.${index}.type`}
                        control={form.control}
                        render={({ field: { ref, ...field } }) => (
                            <InputSelect
                                label="Scale"
                                {...field}
                                value={`${field.value.toLowerCase()}${field.value === 'SCALE' ? `(${(questionField as ScorecardQuestion).scaleMin}-${(questionField as ScorecardQuestion).scaleMax})` : ''}`}
                                classNameWrapper={styles.xlWidthInput}
                                options={scorecardScaleOptions}
                                error={get(form.formState.errors, `${name}.${index}.type.message`) as unknown as string}
                                dirty={isFieldDirty(form, `${name}.${index}.type`)}
                                onChange={(ev) => handleScaleChange(ev, field)}
                            />
                        )}
                    />
                    <input
                        type="hidden"
                        {...form.register(`${name}.${index}.scaleMin`)}
                    />
                    <input
                        type="hidden"
                        {...form.register(`${name}.${index}.scaleMax`)}
                    />
                </div>
            ))}
            <div className={styles.footerArea}>
                <Button secondary onClick={handleAddQuestion}>
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
    )
}

export default ScorecardQuestionForm
