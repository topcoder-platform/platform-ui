import {
    FC,
    useCallback,
    useMemo,
} from 'react'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../lib/components/form'
import { SPECIAL_CHALLENGE_TAGS } from '../../../../lib/constants/challenge-editor.constants'

function normalizeTag(tag: unknown): string | undefined {
    if (!tag) {
        return undefined
    }

    if (typeof tag === 'string') {
        const normalizedTag = tag.trim()
        return normalizedTag || undefined
    }

    if (typeof tag === 'object' && 'value' in tag) {
        const typedTag = tag as { value?: string }
        const normalizedTag = (typedTag.value || '').trim()
        return normalizedTag || undefined
    }

    return undefined
}

function normalizeTags(tags: unknown): string[] {
    if (!Array.isArray(tags)) {
        return []
    }

    const uniqueTags = new Set(
        tags
            .map(item => normalizeTag(item))
            .filter((tag): tag is string => !!tag),
    )

    return Array.from(uniqueTags)
}

export const ChallengeTagsField: FC = () => {
    const tagOptions = useMemo<FormSelectOption[]>(
        () => SPECIAL_CHALLENGE_TAGS.map(tag => ({
            label: tag,
            value: tag,
        })),
        [],
    )

    const mapFromFieldValue = useCallback(
        (value: unknown): FormSelectOption[] => normalizeTags(value)
            .map(tag => ({
                label: tag,
                value: tag,
            })),
        [],
    )

    const mapToFieldValue = useCallback(
        (selected: FormSelectOption[] | unknown): string[] => normalizeTags(selected),
        [],
    )

    return (
        <FormSelectField
            fromFieldValue={mapFromFieldValue}
            isCreatable
            isMulti
            label='Tags'
            name='tags'
            options={tagOptions}
            placeholder='Add tags'
            toFieldValue={mapToFieldValue}
        />
    )
}

export default ChallengeTagsField
