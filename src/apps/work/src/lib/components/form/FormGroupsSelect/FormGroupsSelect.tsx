import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useController,
    UseControllerReturn,
    useFormContext,
} from 'react-hook-form'
import AsyncCreatableSelect from 'react-select/async-creatable'

import {
    AUTOCOMPLETE_DEBOUNCE_TIME_MS,
    AUTOCOMPLETE_MIN_LENGTH,
} from '../../../constants/challenge-editor.constants'
import {
    Group,
    GroupCreatePayload,
} from '../../../models'
import {
    createGroup,
    fetchGroupById,
    fetchGroups,
} from '../../../services'
import { FormFieldWrapper } from '../FormFieldWrapper'

import styles from './FormGroupsSelect.module.scss'

interface FormGroupsSelectProps {
    disabled?: boolean
    label: string
    name: string
    required?: boolean
}

interface GroupOption {
    label: string
    value: string
}

function toOption(group: Group): GroupOption {
    return {
        label: group.name,
        value: group.id,
    }
}

function createDebouncedLoader(
    loader: (value: string) => Promise<GroupOption[]>,
): (value: string) => Promise<GroupOption[]> {
    let timeoutId: number | undefined

    return (value: string): Promise<GroupOption[]> => new Promise(resolve => {
        if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId)
        }

        timeoutId = window.setTimeout(async () => {
            resolve(await loader(value))
        }, AUTOCOMPLETE_DEBOUNCE_TIME_MS)
    })
}

function mergeOptions(
    optionSet: GroupOption[],
    nextOptions: GroupOption[],
): GroupOption[] {
    const optionMap = new Map<string, GroupOption>()

    optionSet.forEach(option => {
        optionMap.set(option.value, option)
    })

    nextOptions.forEach(option => {
        optionMap.set(option.value, option)
    })

    return Array.from(optionMap.values())
}

function normalizeGroupIds(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map(groupId => (typeof groupId === 'string'
            ? groupId.trim()
            : ''))
        .filter(Boolean)
}

export const FormGroupsSelect: FC<FormGroupsSelectProps> = (props: FormGroupsSelectProps) => {
    const formContext = useFormContext()
    const controller: UseControllerReturn = useController({
        control: formContext.control,
        name: props.name,
    })
    const field = controller.field
    const fieldState = controller.fieldState

    const [optionCache, setOptionCache] = useState<GroupOption[]>([])

    const menuPortalTarget = useMemo(
        () => (typeof document === 'undefined' ? undefined : document.body),
        [],
    )

    const loadGroupOptions = useCallback(
        async (inputValue: string): Promise<GroupOption[]> => {
            const normalizedInputValue = inputValue.trim()

            if (normalizedInputValue.length < AUTOCOMPLETE_MIN_LENGTH) {
                return []
            }

            const groups = await fetchGroups({
                name: normalizedInputValue,
            })
            const options = groups.map(group => toOption(group))

            setOptionCache(previousOptions => mergeOptions(previousOptions, options))

            return options
        },
        [],
    )

    const debouncedLoadGroupOptions = useMemo(
        () => createDebouncedLoader(loadGroupOptions),
        [loadGroupOptions],
    )

    const selectedGroupIds = useMemo(
        () => normalizeGroupIds(field.value),
        [field.value],
    )

    const optionIds = useMemo(
        () => new Set(optionCache.map(option => option.value)),
        [optionCache],
    )

    const missingGroupIds = useMemo(
        () => selectedGroupIds.filter(groupId => !optionIds.has(groupId)),
        [optionIds, selectedGroupIds],
    )

    useEffect(() => {
        if (!missingGroupIds.length) {
            return undefined
        }

        let isMounted = true

        Promise.all(missingGroupIds.map(async groupId => {
            try {
                const group = await fetchGroupById(groupId)

                return toOption(group)
            } catch {
                return {
                    label: groupId,
                    value: groupId,
                }
            }
        }))
            .then(resolvedOptions => {
                if (!isMounted) {
                    return
                }

                setOptionCache(previousOptions => mergeOptions(previousOptions, resolvedOptions))
            })
            .catch(() => undefined)

        return () => {
            isMounted = false
        }
    }, [missingGroupIds])

    const selectedValue = useMemo<GroupOption[]>(() => {
        if (!selectedGroupIds.length) {
            return []
        }

        return selectedGroupIds
            .map(groupId => optionCache.find(option => option.value === groupId) || {
                label: groupId,
                value: groupId,
            })
            .filter((value): value is GroupOption => !!value)
    }, [optionCache, selectedGroupIds])

    const handleSelectionChange = useCallback(
        (selectedOptions: unknown): void => {
            const typedSelectedOptions = Array.isArray(selectedOptions)
                ? selectedOptions as GroupOption[]
                : []

            setOptionCache(previousOptions => mergeOptions(previousOptions, typedSelectedOptions))

            field.onChange(typedSelectedOptions.map(option => option.value))
        },
        [field],
    )

    const handleCreateGroup = useCallback(
        async (inputValue: string): Promise<void> => {
            const normalizedInputValue = inputValue.trim()

            if (!normalizedInputValue) {
                return
            }

            const createdGroup = await createGroup({
                name: normalizedInputValue,
            } as GroupCreatePayload)
            const createdGroupOption = toOption(createdGroup)

            setOptionCache(previousOptions => mergeOptions(previousOptions, [createdGroupOption]))

            const currentValue = Array.isArray(field.value)
                ? field.value
                : []

            field.onChange([
                ...currentValue,
                createdGroupOption.value,
            ])
        },
        [field],
    )

    return (
        <FormFieldWrapper
            error={fieldState.error?.message}
            label={props.label}
            name={props.name}
            required={props.required}
        >
            <AsyncCreatableSelect
                cacheOptions
                className={styles.select}
                classNamePrefix='challenge-select'
                defaultOptions={false}
                id={props.name}
                isDisabled={props.disabled}
                isMulti
                loadOptions={debouncedLoadGroupOptions}
                menuPortalTarget={menuPortalTarget}
                onBlur={field.onBlur}
                onChange={handleSelectionChange}
                onCreateOption={handleCreateGroup}
                placeholder='Search groups'
                value={selectedValue}
            />
        </FormFieldWrapper>
    )
}

export default FormGroupsSelect
