import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'
import {
    Controller,
    useFormContext,
} from 'react-hook-form'
import type {
    ControllerFieldState,
    ControllerRenderProps,
} from 'react-hook-form'
import Select from 'react-select'

import {
    FormFieldWrapper,
} from '../../../../lib/components/form'
import {
    useSearchSkills,
} from '../../../../lib/hooks'
import {
    TaasSkill,
} from '../../../../lib/models'

import styles from './TaasSkillsField.module.scss'

interface SkillOption {
    label: string
    name: string
    value: string
}

interface TaasSkillsFieldProps {
    index: number
}

interface RenderSkillsSelectParams {
    field: ControllerRenderProps
    fieldState: ControllerFieldState
}

function normalizeSkillValue(skill: unknown): TaasSkill | undefined {
    if (typeof skill !== 'object' || !skill) {
        return undefined
    }

    const typedSkill = skill as {
        id?: unknown
        name?: unknown
        skillId?: unknown
    }
    const skillId = typeof typedSkill.skillId === 'string'
        ? typedSkill.skillId
        : (
            typeof typedSkill.id === 'string'
                ? typedSkill.id
                : ''
        )
    const name = typeof typedSkill.name === 'string'
        ? typedSkill.name
        : ''

    if (!skillId || !name) {
        return undefined
    }

    return {
        name,
        skillId,
    }
}

function asSkillOptions(value: unknown): SkillOption[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map(item => normalizeSkillValue(item))
        .filter((item): item is TaasSkill => !!item)
        .map(item => ({
            label: `${item.name} (${item.skillId})`,
            name: item.name,
            value: item.skillId,
        }))
}

export const TaasSkillsField: FC<TaasSkillsFieldProps> = (props: TaasSkillsFieldProps) => {
    const [searchTerm, setSearchTerm] = useState<string>('')
    const formContext = useFormContext()
    const control: typeof formContext.control = formContext.control

    const searchSkillsResult = useSearchSkills(searchTerm)
    const isLoading: boolean = searchSkillsResult.isLoading
    const skills: typeof searchSkillsResult.skills = searchSkillsResult.skills

    const options = useMemo<SkillOption[]>(
        () => skills.map(skill => ({
            label: `${skill.name} (${skill.id})`,
            name: skill.name,
            value: skill.id,
        })),
        [skills],
    )

    const menuPortalTarget = useMemo(
        () => (typeof document === 'undefined' ? undefined : document.body),
        [],
    )

    const handleInputChange = useCallback((value: string): string => {
        setSearchTerm(value)

        return value
    }, [])

    const fieldName: string = `jobs.${props.index}.skills`

    const handleSelectChange = useCallback(
        (onChange: ControllerRenderProps['onChange'], selected: unknown): void => {
            const selectedOptions = Array.isArray(selected)
                ? selected as SkillOption[]
                : []

            onChange(selectedOptions.map(item => ({
                name: item.name,
                skillId: item.value,
            })))
        },
        [],
    )

    const renderSkillsSelect = useCallback(
        (params: RenderSkillsSelectParams): JSX.Element => {
            const field = params.field
            const fieldState = params.fieldState
            const selectedOptions = asSkillOptions(field.value)

            function onSelectChange(selected: unknown): void {
                handleSelectChange(field.onChange, selected)
            }

            return (
                <FormFieldWrapper
                    error={fieldState.error?.message}
                    label='Skills'
                    name={fieldName}
                    required
                >
                    <Select
                        className={styles.select}
                        classNamePrefix='challenge-select'
                        id={fieldName}
                        isLoading={isLoading}
                        isMulti
                        menuPortalTarget={menuPortalTarget}
                        onBlur={field.onBlur}
                        onChange={onSelectChange}
                        onInputChange={handleInputChange}
                        options={options}
                        placeholder='Start typing a skill then select from the list'
                        value={selectedOptions}
                    />
                </FormFieldWrapper>
            )
        },
        [
            fieldName,
            handleInputChange,
            handleSelectChange,
            isLoading,
            menuPortalTarget,
            options,
        ],
    )

    return (
        <Controller
            control={control}
            name={fieldName}
            render={renderSkillsSelect}
        />
    )
}

export default TaasSkillsField
