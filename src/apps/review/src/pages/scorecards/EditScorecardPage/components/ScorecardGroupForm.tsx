import * as yup from 'yup';
import { FC, useCallback } from 'react'
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';

import styles from '../EditScorecardPage.module.scss'
import { Button, InputText, useConfirmationModal } from '~/libs/ui';
import ScorecardSectionForm, { scorecardSectionSchema } from './ScorecardSectionForm';
import classNames from 'classnames';
import { TrashIcon } from '@heroicons/react/outline';
import { getEmptyScorecardGroup, isFieldDirty, weightsSum } from '../utils';
import { usePageContext } from '../EditScorecardPage.context';
import CalculatedWeightsSum from './CalculatedWeightsSum';
import { get } from 'lodash';
import InputWrapper from './InputWrapper';

export const scorecardGroupSchema = {
    scorecardGroups: yup.array().of(
        yup.object().shape({
            name: yup.string().required('Group name is required'),
            weight: yup
                .number()
                .typeError('Weight must be a number')
                .required('Weight is required')
                .min(0, 'Weight must be at least 0')
                .max(100, 'Weight cannot exceed 100'),
            ...scorecardSectionSchema,
        })
    )
    .min(1, 'At least one group is required')
    .test(...weightsSum('groups')),
};

interface ScorecardGroupFormProps {
}

const ScorecardGroupForm: FC<ScorecardGroupFormProps> = props => {
    const form = useFormContext();
    const ctx = usePageContext();

    const name = "scorecardGroups";
    const formGroupsArray = useFieldArray({
        control: form.control,
        name,
    });

    const handleRemove = useCallback(async (index: number, field: any) => {
        if (!await ctx.confirm({
            title: 'Confirm Remove Group',
            content: `Are you sure you want to remove "${field.name ? field.name : `Group ${index + 1}`}" group?`
        })) {
            return;
        }

        formGroupsArray.remove(index)
    }, [ctx]);

    const handleAddGroup = useCallback(() => {
        formGroupsArray.append({
            ...getEmptyScorecardGroup(),
            sortOrder: formGroupsArray.fields.length,
        })
    }, [formGroupsArray])

    return (
        <div className={styles.groupWrap}>
            {!formGroupsArray.fields.length && (
                <div className='errorMessage'>At least one group is required</div>
            )}
            {formGroupsArray.fields.map((groupField, index) => (
                <div key={groupField.id}>
                    <div className={styles.headerArea}>
                        <div className={classNames('body-small', styles.headerAreaLabel)}>
                            Group {index+1}
                        </div>
                        <div className={styles.headerAreaInputs}>
                            <InputWrapper
                                placeholder="Group Name"
                                name={`${name}.${index}.name`}
                                className={styles.xlWidthInput}
                            >
                                <input type="text" />
                            </InputWrapper>
                            <InputWrapper
                                placeholder="Weight"
                                name={`${name}.${index}.weight`}
                                className={styles.smWidthInput}
                            >
                                <input type="number" />
                            </InputWrapper>
                            <TrashIcon className={styles.trashIcon} onClick={() => handleRemove(index, groupField)} />
                        </div>
                    </div>
                    <div className={styles.contentArea}>
                        <ScorecardSectionForm prefix={`${name}.${index}`} />
                    </div>
                </div>
            ))}
            <div className={styles.footerArea}>
                <Button secondary onClick={handleAddGroup} uiv2>
                    + Add New Group
                </Button>

                {formGroupsArray.fields.length > 0 && (
                    <CalculatedWeightsSum
                        fieldName={name}
                        label='Groups'
                        description='The sum of group weights must total 100.'
                        error={(
                            form.formState.errors?.scorecardGroups?.root?.message
                            || form.formState.errors?.scorecardGroups?.message
                        ) as string}
                    />
                )}
            </div>
        </div>
    )
}

export default ScorecardGroupForm
