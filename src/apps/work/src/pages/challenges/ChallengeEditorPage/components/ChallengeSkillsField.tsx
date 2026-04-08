import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'
import { useFormContext } from 'react-hook-form'
import debounce from 'lodash/debounce'

import { Button } from '~/libs/ui'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../lib/components/form'
import { SKILLS_SEARCH_DEBOUNCE_MS } from '../../../../lib/constants/challenge-editor.constants'
import {
    extractSkillsFromText,
    searchSkills,
} from '../../../../lib/services'
import {
    isSkillsRequired,
    showErrorToast,
    showSuccessToast,
} from '../../../../lib/utils'

interface BillingData {
    billingAccountId?: number | string
}

interface SkillValue {
    id: string
    name: string
}

function normalizeSkillValue(value: unknown): SkillValue | undefined {
    if (typeof value !== 'object' || !value) {
        return undefined
    }

    const maybeSkill = value as Partial<SkillValue>
    const id = (maybeSkill.id || '').trim()
    const name = (maybeSkill.name || '').trim()

    if (!id || !name) {
        return undefined
    }

    return {
        id,
        name,
    }
}

function normalizeSkillValues(value: unknown): SkillValue[] {
    if (!Array.isArray(value)) {
        return []
    }

    const addedSkillIds = new Set<string>()

    return value
        .map(item => normalizeSkillValue(item))
        .filter((item): item is SkillValue => {
            if (!item) {
                return false
            }

            if (addedSkillIds.has(item.id)) {
                return false
            }

            addedSkillIds.add(item.id)
            return true
        })
}

export const ChallengeSkillsField: FC = () => {
    const formContext = useFormContext()
    const billing = formContext.watch('billing') as BillingData | undefined
    const description = String(formContext.watch('description') || '')
        .trim()
    const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false)

    const loadOptions = useMemo(
        () => {
            const debouncedFetcher = debounce(
                async (
                    inputValue: string,
                    callback: (options: FormSelectOption[]) => void,
                ) => {
                    try {
                        const skills = await searchSkills(inputValue)

                        callback(skills.map(skill => ({
                            id: skill.id,
                            label: skill.name,
                            name: skill.name,
                            value: skill.id,
                        })))
                    } catch {
                        callback([])
                    }
                },
                SKILLS_SEARCH_DEBOUNCE_MS,
            )

            return (inputValue: string): Promise<FormSelectOption[]> => new Promise(resolve => {
                debouncedFetcher(inputValue, resolve)
            })
        },
        [],
    )

    const mapFromFieldValue = useCallback((value: unknown): FormSelectOption[] => {
        if (!Array.isArray(value)) {
            return []
        }

        return value
            .map(item => normalizeSkillValue(item))
            .filter((item): item is SkillValue => !!item)
            .map(item => ({
                id: item.id,
                label: item.name,
                name: item.name,
                value: item.id,
            }))
    }, [])

    const mapToFieldValue = useCallback((selected: FormSelectOption[] | unknown): SkillValue[] => {
        if (!Array.isArray(selected)) {
            return []
        }

        return selected
            .map(item => {
                const id = item.value?.toString()
                const name = item.name?.toString() || item.label?.toString() || ''

                if (!id || !name) {
                    return undefined
                }

                return {
                    id,
                    name: name.replace(/\s*\([^)]*\)$/, ''),
                }
            })
            .filter((item): item is SkillValue => !!item)
    }, [])

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

            const existingSkills = normalizeSkillValues(formContext.getValues('skills'))
            const existingSkillIds = new Set(existingSkills.map(skill => skill.id))
            const newSkills = suggestedSkills
                .filter(skill => !existingSkillIds.has(skill.id))

            if (!newSkills.length) {
                showSuccessToast('All suggested skills are already selected.')
                return
            }

            formContext.setValue(
                'skills',
                [
                    ...existingSkills,
                    ...newSkills,
                ],
                {
                    shouldDirty: true,
                    shouldValidate: true,
                },
            )
            showSuccessToast(`${newSkills.length} skill(s) were added from AI suggestions.`)
        } catch {
            showErrorToast('Failed to extract skills. Please try again or add skills manually.')
        } finally {
            setIsLoadingAI(false)
        }
    }, [description, formContext, isLoadingAI])

    return (
        <div>
            <FormSelectField
                disabled={isLoadingAI}
                fromFieldValue={mapFromFieldValue}
                isAsync
                isMulti
                label='Skills'
                loadOptions={loadOptions}
                name='skills'
                placeholder='Search skills'
                required={isSkillsRequired(billing)}
                toFieldValue={mapToFieldValue}
            />

            {description
                ? (
                    <div style={{ marginTop: '12px' }}>
                        <Button
                            disabled={isLoadingAI}
                            label={isLoadingAI ? 'Suggesting...' : 'AI Suggest'}
                            onClick={handleAISuggest}
                            secondary
                            size='sm'
                        />
                    </div>
                )
                : undefined}
        </div>
    )
}

export default ChallengeSkillsField
