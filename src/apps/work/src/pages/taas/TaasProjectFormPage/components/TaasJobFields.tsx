import {
    FC,
    useCallback,
    useMemo,
} from 'react'
import {
    useFormContext,
} from 'react-hook-form'

import { PlusIcon, TrashIcon } from '@heroicons/react/outline'

import {
    FormSelectField,
    FormSelectOption,
    FormTextAreaField,
    FormTextField,
} from '../../../../lib/components/form'
import {
    JOB_ROLE_OPTIONS,
    JOB_WORKLOAD_OPTIONS,
} from '../../../../lib/constants'

import {
    TaasSkillsField,
} from './TaasSkillsField'
import styles from './TaasJobFields.module.scss'

interface TaasJobFieldsProps {
    canAdd: boolean
    canRemove: boolean
    index: number
    onAdd: () => void
    onRemove: () => void
}

interface SelectFieldValue {
    label: string
    value: string
}

function toSelectOption(value: unknown, options: FormSelectOption[]): FormSelectOption | undefined {
    if (typeof value === 'object' && value && 'value' in value && 'label' in value) {
        const typedValue = value as Partial<SelectFieldValue>
        if (typeof typedValue.value === 'string' && typeof typedValue.label === 'string') {
            return {
                label: typedValue.label,
                value: typedValue.value,
            }
        }
    }

    if (typeof value === 'string') {
        return options.find(option => option.value === value)
    }

    return undefined
}

function toFieldSelectValue(selected: FormSelectOption | FormSelectOption[] | undefined): SelectFieldValue {
    if (!selected || Array.isArray(selected)) {
        return {
            label: '',
            value: '',
        }
    }

    return {
        label: String(selected.label),
        value: String(selected.value),
    }
}

export const TaasJobFields: FC<TaasJobFieldsProps> = (props: TaasJobFieldsProps) => {
    const formContext = useFormContext()
    const disabled = formContext.formState.isSubmitting
    const fieldPrefix = `jobs[${props.index}]`

    const roleOptions = useMemo<FormSelectOption[]>(
        () => JOB_ROLE_OPTIONS.map(option => ({
            label: option.label,
            value: option.value,
        })),
        [],
    )

    const workLoadOptions = useMemo<FormSelectOption[]>(
        () => JOB_WORKLOAD_OPTIONS.map(option => ({
            label: option.label,
            value: option.value,
        })),
        [],
    )

    const mapRoleFromFieldValue = useCallback(
        (value: unknown): FormSelectOption | undefined => toSelectOption(value, roleOptions),
        [roleOptions],
    )

    const mapWorkLoadFromFieldValue = useCallback(
        (value: unknown): FormSelectOption | undefined => toSelectOption(value, workLoadOptions),
        [workLoadOptions],
    )

    return (
        <section className={styles.jobBlock}>
            <div className={styles.jobHeader}>
                <h3 className={styles.jobTitle}>
                    JOB
                    {' '}
                    {props.index + 1}
                </h3>

                <div className={styles.actions}>
                    {props.canAdd
                        ? (
                            <button
                                aria-label='Add job'
                                className={styles.iconButton}
                                disabled={disabled}
                                onClick={props.onAdd}
                                type='button'
                            >
                                <PlusIcon className={styles.icon} />
                            </button>
                        )
                        : undefined}
                    {props.canRemove
                        ? (
                            <button
                                aria-label='Remove job'
                                className={styles.iconButton}
                                disabled={disabled}
                                onClick={props.onRemove}
                                type='button'
                            >
                                <TrashIcon className={styles.icon} />
                            </button>
                        )
                        : undefined}
                </div>
            </div>

            <div className={styles.grid}>
                <FormTextField
                    disabled={disabled}
                    label='Job Title'
                    name={`${fieldPrefix}.title`}
                    placeholder='Job title'
                    required
                />
                <FormTextField
                    disabled={disabled}
                    label='Number of People'
                    name={`${fieldPrefix}.people`}
                    placeholder='1'
                    required
                    type='number'
                />
                <FormSelectField
                    disabled={disabled}
                    fromFieldValue={mapRoleFromFieldValue}
                    label='Role'
                    name={`${fieldPrefix}.role`}
                    options={roleOptions}
                    placeholder='Select role'
                    required
                    toFieldValue={toFieldSelectValue}
                />
                <FormTextField
                    disabled={disabled}
                    label='Duration (Weeks)'
                    name={`${fieldPrefix}.duration`}
                    placeholder='4'
                    required
                    type='number'
                />
                <FormSelectField
                    disabled={disabled}
                    fromFieldValue={mapWorkLoadFromFieldValue}
                    label='Workload'
                    name={`${fieldPrefix}.workLoad`}
                    options={workLoadOptions}
                    placeholder='Select workload'
                    required
                    toFieldValue={toFieldSelectValue}
                />
            </div>

            <FormTextAreaField
                disabled={disabled}
                label='Job Description'
                name={`${fieldPrefix}.description`}
                placeholder='Describe the role and responsibilities'
                required
                rows={4}
            />

            <TaasSkillsField index={props.index} />
        </section>
    )
}

export default TaasJobFields
