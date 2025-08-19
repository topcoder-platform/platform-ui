import classNames from 'classnames';
import * as yup from 'yup';
import { get } from 'lodash';
import { ChangeEvent, ChangeEventHandler, FC, useCallback, useMemo } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form';

import { TrashIcon } from '@heroicons/react/outline';
import { Button } from '~/libs/ui';
import { ScorecardScales } from '~/apps/review/src/lib/models';

import styles from '../EditScorecardPage.module.scss'
import { usePageContext } from '../EditScorecardPage.context';
import { getEmptyScorecardQuestion, weightsSum } from '../utils';

import CalculatedWeightsSum from './CalculatedWeightsSum';
import InputWrapper from './InputWrapper';
import BasicSelect from './BasicSelect';

const scorecardScaleOptions = Object.entries(ScorecardScales).map(([value, label]) => ({ value, label }))
const yesNoOptions = [{ value: true, label: 'Yes' }, { value: false, label: 'No' }]

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
    const values = form.getValues();

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

        form.setValue(field.name, type.toUpperCase(), { shouldValidate: true })
        form.setValue(field.name.replace(/\.type$/, '.scaleMin'), Number(min) || 0, { shouldValidate: true })
        form.setValue(field.name.replace(/\.type$/, '.scaleMax'), Number(max) || 0, { shouldValidate: true })
    }, [form]);

    return (
        <div className={styles.questionWrap}>
            {!formQuestionsArray.fields.length && (
                <div className='errorMessage'>At least one question is required</div>
            )}
            {formQuestionsArray.fields.map((questionField, index) => (
                <div key={questionField.id} className={styles.questionItem}>
                    <div className={classNames('body-small main-group', styles.headerAreaLabel)}>
                        Question {props.sectionIndex}.{index+1}
                    </div>
                    <InputWrapper
                        placeholder="Question Name"
                        name={`${name}.${index}.description`}
                        className='main-group'
                    >
                        <input type="text" />
                    </InputWrapper>
                    <InputWrapper
                        placeholder="Weight"
                        name={`${name}.${index}.weight`}
                        className='weight-group'
                    >
                        <input type="number" />
                    </InputWrapper>
                    <TrashIcon
                        className={classNames(styles.trashIcon, styles.blue, 'action-group')}
                        onClick={() => handleRemove(index, questionField)}
                    />

                    <InputWrapper
                        placeholder="Question Guideline"
                        name={`${name}.${index}.guidelines`}
                        className='main-group'
                    >
                        <textarea rows={4} />
                    </InputWrapper>

                    <div className={classNames('main-group', styles.doubleInputWrap)}>
                        <InputWrapper
                            placeholder="Select Scale"
                            name={`${name}.${index}.type`}
                        >
                            <BasicSelect
                                options={scorecardScaleOptions}
                                {...{
                                    mapValue: (value: string) => (
                                        `${value?.toLowerCase()}${value === 'SCALE' ? `(${get(values, `${name}.${index}.scaleMin`)}-${get(values, `${name}.${index}.scaleMax`)})` : ''}`
                                    ),
                                    onChange: ((ev: ChangeEvent<HTMLInputElement>, field: any) => handleScaleChange(ev, field)) as ChangeEventHandler,
                                }}
                            />
                        </InputWrapper>
                        <input
                            type="hidden"
                            {...form.register(`${name}.${index}.scaleMin`)}
                        />
                        <input
                            type="hidden"
                            {...form.register(`${name}.${index}.scaleMax`)}
                        />


                        <InputWrapper
                            placeholder="Select Document Requirements"
                            name={`${name}.${index}.requiresUpload`}
                        >
                            <BasicSelect options={yesNoOptions} />
                        </InputWrapper>
                    </div>
                </div>
            ))}
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
    )
}

export default ScorecardQuestionForm
