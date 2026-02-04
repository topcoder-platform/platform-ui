/* eslint-disable complexity */
import {
    ChangeEvent,
    forwardRef,
    ForwardRefRenderFunction,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'
import { bind, trim } from 'lodash'

import { InputDatePicker, InputSelect, InputText } from '~/libs/ui'
import { UserTrait } from '~/libs/core'
import { FieldHtmlEditor, InputSkillSelector } from '~/libs/shared'
import { INDUSTRIES_OPTIONS } from '~/libs/shared/lib/constants'
import { getIndustryOptionsWithOthersLast } from '~/libs/shared/lib/utils/industry'
import { fetchSkillsByIds } from '~/libs/shared/lib/services/standard-skills'

import styles from './AddEditWorkExperienceForm.module.scss'

export interface AddEditWorkExperienceFormProps {
    initialWork?: UserTrait
    onSave: (work: UserTrait) => void
}

export interface AddEditWorkExperienceFormRef {
    submit: () => void
}

const industryOptions: any = getIndustryOptionsWithOthersLast(INDUSTRIES_OPTIONS)

const AddEditWorkExperienceFormInner
: ForwardRefRenderFunction<AddEditWorkExperienceFormRef, AddEditWorkExperienceFormProps> = (props, ref) => {
    const [formValues, setFormValues] = useState<{
        [key: string]: string | boolean | Date | any[] | undefined
    }>({})
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
    const formElRef = useRef<HTMLFormElement>(null)

    useImperativeHandle(ref, () => ({
        submit: () => doSubmit(),
    }))

    useEffect(() => {
        if (props.initialWork) {
            const work = props.initialWork
            const baseValues = {
                associatedSkills: [] as any[],
                city: (work.cityName || work.cityTown || work.city || '') as string,
                company: (work.company || work.companyName || '') as string,
                currentlyWorking: work.working || false,
                description: work.description || '',
                endDate: work.timePeriodTo
                    ? new Date(work.timePeriodTo)
                    : (work.endDate ? new Date(work.endDate) : undefined),
                industry: work.industry || '',
                otherIndustry: work.otherIndustry || '',
                position: (work.position || '') as string,
                startDate: work.timePeriodFrom
                    ? new Date(work.timePeriodFrom)
                    : (work.startDate ? new Date(work.startDate) : undefined),
            }
            setFormValues(baseValues)
            if (work.associatedSkills && Array.isArray(work.associatedSkills) && work.associatedSkills.length > 0) {
                fetchSkillsByIds(work.associatedSkills.filter((id): id is string => typeof id === 'string'))
                    .then(skills => {
                        const skillsMap = new Map(skills.map(s => [s.id, s.name]))
                        setFormValues(prev => ({
                            ...prev,
                            associatedSkills: work.associatedSkills!.map((skillId: string) => ({
                                id: skillId,
                                name: skillsMap.get(skillId) || '',
                            })),
                        }))
                    })
                    .catch(() => {
                        setFormValues(prev => ({
                            ...prev,
                            associatedSkills: work.associatedSkills!.map((skillId: string) => ({
                                id: skillId,
                                name: skillId,
                            })),
                        }))
                    })
            }
        } else {
            setFormValues({})
            setFormErrors({})
        }
    }, [props.initialWork])

    function handleFormValueChange(
        key: string,
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ): void {
        let value: string | boolean | Date | undefined
        const oldFormValues = { ...formValues }

        switch (key) {
            case 'currentlyWorking':
                value = (event.target as HTMLInputElement).checked
                if (value) {
                    oldFormValues.endDate = undefined
                }

                break
            case 'startDate':
            case 'endDate':
                value = event as unknown as Date
                break
            case 'industry':
                value = event.target.value
                if (value !== 'Other') {
                    oldFormValues.otherIndustry = undefined
                }

                break
            default:
                value = event.target.value
                break
        }

        setFormValues({
            ...oldFormValues,
            [key]: value,
        })
    }

    function handleDescriptionChange(value: string): void {
        setFormValues(prev => ({ ...prev, description: value }))
    }

    function handleSkillsChange(event: ChangeEvent<HTMLInputElement>): void {
        const selectedSkills = (event.target as any).value || []
        setFormValues(prev => ({
            ...prev,
            associatedSkills: selectedSkills.map((skill: any) => ({
                id: skill.value || skill.id,
                name: skill.label || skill.name,
            })),
        }))
    }

    function doSubmit(): void {
        setFormErrors({})

        if (!trim(formValues.company as string)) {
            setFormErrors(prev => ({ ...prev, company: 'Company is required' }))
            return
        }

        if (!trim(formValues.position as string)) {
            setFormErrors(prev => ({ ...prev, position: 'Position is required' }))
            return
        }

        if (formValues.endDate && formValues.startDate && formValues.endDate <= formValues.startDate) {
            setFormErrors(prev => ({ ...prev, endDate: 'End date must be greater than start date' }))
            return
        }

        if (formValues.endDate || formValues.startDate) {
            if (formValues.endDate && !formValues.startDate && !formValues.currentlyWorking) {
                setFormErrors(prev => ({ ...prev, startDate: 'Start date is required when end date is given' }))
                return
            }

            if (formValues.startDate && !formValues.endDate && !formValues.currentlyWorking) {
                setFormErrors(prev => ({ ...prev, endDate: 'End date is required when start date is given' }))
                return
            }
        }

        if (formValues.industry === 'Other' && !trim(formValues.otherIndustry as string)) {
            setFormErrors(prev => ({ ...prev, otherIndustry: 'Please specify your industry' }))
            return
        }

        const companyName: string | undefined = formValues.company as string | undefined
        const startDateIso: string | undefined = formValues.startDate
            ? (formValues.startDate as Date).toISOString()
            : undefined
        const endDateIso: string | undefined = formValues.endDate
            ? (formValues.endDate as Date).toISOString()
            : undefined

        const work: UserTrait = {
            associatedSkills: (formValues.associatedSkills as any[])?.map((s: any) => s.id || s) || [],
            cityName: (formValues.city as string) || undefined,
            company: companyName,
            companyName,
            description: (formValues.description as string) || undefined,
            endDate: endDateIso,
            industry: formValues.industry as string,
            otherIndustry: formValues.industry === 'Other' ? (formValues.otherIndustry as string) : undefined,
            position: formValues.position as string,
            startDate: startDateIso,
            timePeriodFrom: startDateIso,
            timePeriodTo: endDateIso,
            working: formValues.currentlyWorking as boolean,
        }

        props.onSave(work)
    }

    return (
        <form
            ref={formElRef}
            className={styles.formWrap}
            onSubmit={function (event: React.FormEvent<HTMLFormElement>): void {
                event.preventDefault()
                doSubmit()
            }}
        >
            <InputText
                name='company'
                label='Company *'
                error={formErrors.company}
                placeholder='Enter a company'
                dirty
                tabIndex={0}
                forceUpdateValue
                type='text'
                onChange={bind(handleFormValueChange, undefined, 'company')}
                value={formValues.company as string}
            />
            <InputText
                name='position'
                label='Position *'
                error={formErrors.position}
                placeholder='Enter a position'
                dirty
                tabIndex={0}
                type='text'
                forceUpdateValue
                onChange={bind(handleFormValueChange, undefined, 'position')}
                value={formValues.position as string}
            />
            <InputSelect
                tabIndex={0}
                options={industryOptions}
                value={formValues.industry as string}
                onChange={bind(handleFormValueChange, undefined, 'industry')}
                name='industry'
                label='Industry'
                placeholder='Select industry'
                dirty
                error={formErrors.industry}
            />
            {formValues.industry === 'Other' && (
                <InputText
                    name='otherIndustry'
                    label='Please specify your industry *'
                    error={formErrors.otherIndustry}
                    placeholder='Enter your industry'
                    dirty
                    tabIndex={0}
                    forceUpdateValue
                    type='text'
                    onChange={bind(handleFormValueChange, undefined, 'otherIndustry')}
                    value={formValues.otherIndustry as string}
                    maxLength={255}
                />
            )}
            <div className={styles.row}>
                <InputDatePicker
                    label='Start Date'
                    date={formValues.startDate as Date}
                    onChange={bind(handleFormValueChange, undefined, 'startDate')}
                    disabled={false}
                    error={formErrors.startDate}
                    dirty
                    maxDate={new Date()}
                />
                <InputDatePicker
                    label='End Date'
                    date={formValues.endDate as Date}
                    onChange={bind(handleFormValueChange, undefined, 'endDate')}
                    disabled={formValues.currentlyWorking as boolean}
                    error={formErrors.endDate}
                    dirty
                    maxDate={new Date()}
                />
            </div>
            <FieldHtmlEditor
                name='description'
                label='Description'
                placeholder='Describe your role and achievements at this company'
                dirty
                tabIndex={0}
                onChange={handleDescriptionChange}
                toolbar={`
                    undo redo 
                    | formatselect 
                    | bold italic underline strikethrough 
                    | link 
                    | alignleft aligncenter alignright alignjustify 
                    | numlist bullist outdent indent 
                    | table 
                    | removeformat
                `}
                value={formValues.description as string}
            />
            <InputSkillSelector
                label='Associated Skills'
                placeholder='Type to search and add skills...'
                value={formValues.associatedSkills as any[]}
                onChange={handleSkillsChange}
                loading={false}
            />
            <InputText
                name='currentlyWorking'
                label='I am currently working in this role'
                error={formErrors.currentlyWorking}
                dirty
                tabIndex={0}
                type='checkbox'
                onChange={bind(handleFormValueChange, undefined, 'currentlyWorking')}
                checked={formValues.currentlyWorking as boolean}
            />
        </form>
    )
}

const AddEditWorkExperienceForm = forwardRef<AddEditWorkExperienceFormRef, AddEditWorkExperienceFormProps>(
    AddEditWorkExperienceFormInner,
)

export default AddEditWorkExperienceForm
