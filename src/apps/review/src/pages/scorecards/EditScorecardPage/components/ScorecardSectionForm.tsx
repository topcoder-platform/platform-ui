import * as yup from 'yup'
import { get } from 'lodash'
import { FC, useCallback, useMemo } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import classNames from 'classnames'

import { Button } from '~/libs/ui'
import { TrashIcon } from '@heroicons/react/outline'

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
                    weight: yup
                        .number()
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

const ScorecardSectionForm: FC<ScorecardSectionFormProps> = props => {
    const form = useFormContext()
    const ctx = usePageContext()

    const name = useMemo(() => `${props.prefix}.sections`, [props.prefix])
    const formSectionsArray = useFieldArray({
        control: form.control,
        name,
    })

    const handleRemove = useCallback(async (index: number, field: any) => {
        if (!await ctx.confirm({
            content: `Are you sure you want to remove "${field.name ? field.name : `Section ${index + 1}`}" section?`,
            title: 'Confirm Remove Section',
        })) {
            return
        }

        formSectionsArray.remove(index)
    }, [ctx, formSectionsArray])

    const handleAddSection = useCallback(() => {
        formSectionsArray.append({
            ...getEmptyScorecardSection(),
            sortOrder: formSectionsArray.fields.length,
        })
    }, [formSectionsArray])

    return (
        <div className={styles.sectionWrap}>
            {!formSectionsArray.fields.length && (
                <div className='errorMessage'>At least one section is required</div>
            )}
            {formSectionsArray.fields.map((sectionField, index) => (
                <div key={sectionField.id}>
                    <div className={styles.headerArea}>
                        <div className={classNames('body-small', styles.headerAreaLabel)}>
                            Section
                            {' '}
                            {index + 1}
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
                    <div className={styles.contentArea}>
                        <ScorecardQuestionForm prefix={`${name}.${index}`} sectionIndex={index + 1} />
                    </div>
                </div>
            ))}
            <div className={styles.footerArea}>
                <Button secondary onClick={handleAddSection} uiv2>
                    + Add New Section
                </Button>

                {formSectionsArray.fields.length > 0 && (
                    <CalculatedWeightsSum
                        fieldName={name}
                        label='Sections'
                        description='The sum of section weights within a group must total 100.'
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

export default ScorecardSectionForm
