import { ChangeEvent, FC } from 'react'

import { InputMultiselect, InputMultiselectOption, InputSelect, InputText } from '~/libs/ui'

import styles from './ModifyOpenToWorkModal.module.scss'

export type AvailabilityType = 'FULL_TIME' | 'PART_TIME'

export interface OpenToWorkData {
    availableForGigs: boolean
    availability?: AvailabilityType
    preferredRoles?: string[]
}

interface OpenToWorkFormProps {
    value: OpenToWorkData
    onChange: (value: OpenToWorkData) => void
    disabled?: boolean
}

const availabilityOptions = [
    { label: 'Full-time', value: 'FULL_TIME' },
    { label: 'Part-time', value: 'PART_TIME' },
]

const preferredRoleOptions: InputMultiselectOption[] = [
    { label: 'AI / ML Engineer', value: 'AI_ML_ENGINEER' },
    { label: 'Data Scientist / Data Engineer', value: 'DATA_SCIENTIST_ENGINEER' },
    { label: 'Cybersecurity Analyst / Security Engineer', value: 'CYBERSECURITY_ENGINEER' },
    { label: 'Cloud Engineer / Solutions Architect', value: 'CLOUD_ENGINEER' },
    { label: 'DevOps Engineer / SRE', value: 'DEVOPS_SRE' },
    { label: 'Full-Stack Developer', value: 'FULL_STACK_DEVELOPER' },
    { label: 'QA Lead / Automation Engineer', value: 'QA_AUTOMATION_ENGINEER' },
    { label: 'UX Designer', value: 'UX_DESIGNER' },
    { label: 'Technical Project Manager', value: 'TECHNICAL_PM' },
    { label: 'Database Administrator', value: 'DB_ADMIN' },
    { label: 'AI Prompt Engineer', value: 'AI_PROMPT_ENGINEER' },
    { label: 'Enterprise Architect', value: 'ENTERPRISE_ARCHITECT' },
]

const OpenToWorkForm: FC<OpenToWorkFormProps> = (props: OpenToWorkFormProps) => {
    function toggleOpenForWork(): void {
        props.onChange({
            ...props.value,
            availableForGigs: !props.value.availableForGigs,
        })
    }

    function handleAvailabilityChange(e: ChangeEvent<HTMLInputElement>): void {
        props.onChange({
            ...props.value,
            availability: e.target.value as AvailabilityType,
        })
    }

    function handleRolesChange(e: ChangeEvent<HTMLInputElement>): void {
        const options = (e.target as unknown as { value: InputMultiselectOption[] }).value

        props.onChange({
            ...props.value,
            preferredRoles: options.map(o => o.value),
        })
    }

    function fetchPreferredRoles(): Promise<InputMultiselectOption[]> {
        return Promise.resolve(preferredRoleOptions)
    }

    return (
        <div className={styles.container}>
            <InputText
                name='openForWork'
                type='checkbox'
                label='Yes, I’m open to work'
                checked={props.value.availableForGigs}
                onChange={toggleOpenForWork}
                disabled={props.disabled}
            />

            {props.value.availableForGigs && (
                <>
                    <InputSelect
                        name='availability'
                        label='Availability'
                        placeholder='Select availability'
                        options={availabilityOptions}
                        value={props.value.availability}
                        onChange={handleAvailabilityChange}
                        disabled={props.disabled}
                        dirty
                    />

                    <InputMultiselect
                        name='preferredRoles'
                        label='Preferred Roles'
                        placeholder='Select preferred roles'
                        additionalPlaceholder='Add more roles...'
                        onFetchOptions={fetchPreferredRoles}
                        options={preferredRoleOptions}
                        value={preferredRoleOptions.filter(
                            option => props.value.preferredRoles?.includes(option.value),
                        )}
                        onChange={handleRolesChange}
                        disabled={props.disabled}
                    />
                </>
            )}
        </div>
    )
}

export default OpenToWorkForm
