/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'
import {
    useController,
    UseControllerReturn,
    useFormContext,
} from 'react-hook-form'
import Select from 'react-select'

import { Button } from '~/libs/ui'

import {
    FormFieldWrapper,
    FormSelectOption,
} from '../../../../lib/components/form'
import {
    useSearchSkills,
} from '../../../../lib/hooks'
import {
    Skill,
} from '../../../../lib/models'
import {
    extractSkillsFromText,
} from '../../../../lib/services'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../../lib/utils'

import styles from './EngagementSkillsField.module.scss'

interface EngagementSkillsFieldProps {
    disabled?: boolean
}

interface SkillOption extends FormSelectOption {
    name: string
}

function toSkillOptions(skills: Skill[]): SkillOption[] {
    return skills.map(skill => ({
        label: skill.name,
        name: skill.name,
        value: skill.id,
    }))
}

function toSelectedOptions(value: unknown): SkillOption[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map(item => {
            if (typeof item === 'string') {
                return {
                    label: item,
                    name: item,
                    value: item,
                }
            }

            if (typeof item === 'object' && item) {
                const skillValue = item as {
                    id?: string
                    name?: string
                    value?: string
                    label?: string
                }

                const id = (skillValue.id || skillValue.value || '').trim()
                const name = (skillValue.name || skillValue.label || id).trim()

                if (!id || !name) {
                    return undefined
                }

                return {
                    label: name,
                    name,
                    value: id,
                }
            }

            return undefined
        })
        .filter((option): option is SkillOption => !!option)
}

function toFieldValue(options: SkillOption[]): Skill[] {
    return options.map(option => ({
        id: option.value,
        name: option.name,
    }))
}

export const EngagementSkillsField: FC<EngagementSkillsFieldProps> = (
    props: EngagementSkillsFieldProps,
) => {
    const formContext = useFormContext()
    const controller: UseControllerReturn = useController({
        control: formContext.control,
        name: 'skills',
    })
    const description = String(formContext.watch('description') || '')
        .trim()

    const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false)
    const [searchTerm, setSearchTerm] = useState<string>('')

    const searchedSkills = useSearchSkills(searchTerm)

    const options = useMemo(
        () => toSkillOptions(searchedSkills.skills),
        [searchedSkills.skills],
    )

    const selectedOptions = useMemo(
        () => toSelectedOptions(controller.field.value),
        [controller.field.value],
    )

    const menuPortalTarget = useMemo(
        () => (typeof document === 'undefined' ? undefined : document.body),
        [],
    )

    const handleAISuggest = useCallback(async (): Promise<void> => {
        if (!description || isLoadingAI) {
            return
        }

        setIsLoadingAI(true)

        try {
            const suggestedSkills = await extractSkillsFromText(description)

            if (!suggestedSkills.length) {
                showErrorToast('No matching standardized skills found based on the description.')
                return
            }

            const existingSkills = toFieldValue(selectedOptions)
            const existingSkillIds = new Set(existingSkills.map(skill => skill.id))
            const newSkills = suggestedSkills
                .filter(skill => !existingSkillIds.has(skill.id))

            if (!newSkills.length) {
                showSuccessToast('All suggested skills are already selected.')
                return
            }

            controller.field.onChange([
                ...existingSkills,
                ...newSkills,
            ])
            showSuccessToast(`${newSkills.length} skill(s) were added from AI suggestions.`)
        } catch {
            showErrorToast('Failed to extract skills. Please try again or add skills manually.')
        } finally {
            setIsLoadingAI(false)
        }
    }, [controller.field, description, isLoadingAI, selectedOptions])

    return (
        <FormFieldWrapper
            error={controller.fieldState.error?.message}
            hint={searchedSkills.error?.message}
            label='Skills'
            name='skills'
            required
        >
            <div className={styles.container}>
                <Select
                    className={styles.select}
                    classNamePrefix='challenge-select'
                    id='skills'
                    isDisabled={props.disabled || isLoadingAI}
                    isLoading={searchedSkills.isLoading}
                    isMulti
                    menuPortalTarget={menuPortalTarget}
                    onBlur={controller.field.onBlur}
                    onChange={nextValue => {
                        const selected = Array.isArray(nextValue)
                            ? nextValue as SkillOption[]
                            : []

                        controller.field.onChange(toFieldValue(selected))
                    }}
                    onInputChange={nextValue => {
                        setSearchTerm(nextValue)
                        return nextValue
                    }}
                    options={options}
                    placeholder='Search skills'
                    value={selectedOptions}
                />

                {description
                    ? (
                        <div className={styles.actions}>
                            <Button
                                disabled={props.disabled || isLoadingAI}
                                label={isLoadingAI ? 'Suggesting...' : 'AI Suggest'}
                                onClick={handleAISuggest}
                                secondary
                                size='sm'
                            />
                        </div>
                    )
                    : undefined}
            </div>
        </FormFieldWrapper>
    )
}

export default EngagementSkillsField
