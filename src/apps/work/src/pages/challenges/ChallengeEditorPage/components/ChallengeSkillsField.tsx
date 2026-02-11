import {
    FC,
    useCallback,
    useMemo,
} from 'react'
import { useFormContext } from 'react-hook-form'
import debounce from 'lodash/debounce'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../lib/components/form'
import { SKILLS_SEARCH_DEBOUNCE_MS } from '../../../../lib/constants/challenge-editor.constants'
import { searchSkills } from '../../../../lib/services'
import { isSkillsRequired } from '../../../../lib/utils'

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

export const ChallengeSkillsField: FC = () => {
    const formContext = useFormContext()
    const billing = formContext.watch('billing') as BillingData | undefined

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
                            label: `${skill.name} (${skill.id})`,
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
                label: `${item.name} (${item.id})`,
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

    return (
        <FormSelectField
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
    )
}

export default ChallengeSkillsField
