import { FC, useContext, useState } from 'react'
import { SWRResponse } from 'swr'
import { bind, isEmpty } from 'lodash'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { profileContext, ProfileContextData } from '~/libs/core'
import { Button, IconSolid, InputDatePicker, InputMultiselectOption,
    InputRadio, InputSelect, InputText, InputTextarea } from '~/libs/ui'
import { InputSkillSelector } from '~/libs/shared'

import { saveCopilotRequest, useFetchProjects } from '../../services/projects'
import { ProjectTypes } from '../../constants'
import { Project } from '../../models/Project'

import styles from './styles.module.scss'

const CopilotRequestForm: FC<{}> = () => {
    const { profile }: ProfileContextData = useContext(profileContext)

    const [formValues, setFormValues] = useState<any>({})
    const [isFormChanged, setIsFormChanged] = useState(false)
    const [formErrors, setFormErrors] = useState<any>({})
    const { data: projectsData }: SWRResponse<Project[], any> = useFetchProjects()
    const [existingCopilot, setExistingCopilot] = useState<string>('')
    const [paymentType, setPaymentType] = useState<string>('')

    const projects = projectsData
        ? projectsData.map(project => ({
            label: project.name,
            value: project.id,
        }))
        : []

    const projectTypes = ProjectTypes ? ProjectTypes.map(project => ({
        label: project,
        value: project,
    }))
        : []

    function exisitingCopilotToggle(t: 'yes'|'no'): void {
        setExistingCopilot(t)
        setIsFormChanged(true)
    }

    function togglePaymentType(t: 'standard'|'other'): void {
        setFormValues((prevFormValues: any) => ({
            ...prevFormValues,
            paymentType: t,
        }))
        setFormErrors((prevFormErrors: any) => {
            const updatedErrors = { ...prevFormErrors }
            delete updatedErrors.paymentType
            return updatedErrors
        })
        setPaymentType(t)
    }

    function handleFormValueChange(
        key: string,
        event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
    ): void {
        const oldFormValues = { ...formValues }
        let value: string | boolean | Date | undefined
        switch (key) {
            case 'startDate':
                value = event as unknown as Date
                break
            case 'skills':
                oldFormValues[key] = Array.isArray(value) ? [...value] : []
                break
            default:
                value = event.target.value
                break
        }

        setFormValues({
            ...oldFormValues,
            [key]: value,
        })

        // Clear specific field error
        setFormErrors((prevFormErrors: any) => {
            const updatedErrors = { ...prevFormErrors }
            let errorKey: string
            switch (key) {
                case 'copilotUsername':
                    errorKey = 'existingCopilot'
                    break
                default:
                    errorKey = key
                    break
            }

            // Remove the error from the updatedErrors object
            delete updatedErrors[errorKey]
            return updatedErrors
        })
        setIsFormChanged(true)
    }

    function handleSkillsChange(ev: any): void {
        const options = (ev.target.value as unknown) as InputMultiselectOption[]
        const updatedSkills = options.map(v => ({
            id: v.value,
            name: v.label as string,
        }))
        setFormValues((prevFormValues: any) => ({
            ...prevFormValues,
            skills: updatedSkills,
        }))

        setFormErrors((prevFormErrors: any) => {
            const updatedErrors = { ...prevFormErrors }
            delete updatedErrors.skills
            return updatedErrors
        })
        setIsFormChanged(true)
    }

    function handleFormAction(): void {
        const updatedFormErrors: { [key: string]: string } = {}

        if (!formValues.projectId) {
            updatedFormErrors.projectId = 'Project is required'
        }

        if (!existingCopilot) {
            updatedFormErrors.existingCopilot = 'Selection is required'
        }

        if (!formValues.complexity) {
            updatedFormErrors.complexity = 'Selection is required'
        }

        if (!formValues.requiresCommunicatn) {
            updatedFormErrors.requiresCommunicatn = 'Selection is required'
        }

        if (!formValues.paymentType) {
            updatedFormErrors.paymentType = 'Selection is required'
        }

        if (!formValues.projectType) {
            updatedFormErrors.projectType = 'Selecting project type is required'
        }

        if (!formValues.overview) {
            updatedFormErrors.overview = 'Providing a project overview is required'
        }

        if (!formValues.skills) {
            updatedFormErrors.skills = 'Providing skills is required'
        }

        if (!formValues.startDate) {
            updatedFormErrors.startDate = 'Providing a start date for copilot is required'
        }

        if (!formValues.numWeeks) {
            updatedFormErrors.numWeeks = 'Providing number of weeks is required'
        }

        if (!formValues.tzRestrictions) {
            updatedFormErrors.tzRestrictions = 'Providing timezone restrictions is required. Type No if no restrictions'
        }

        if (!formValues.numHoursPerWeek) {
            updatedFormErrors.numHoursPerWeek = 'Providing commitment per week is required'
        }

        if (isEmpty(updatedFormErrors)) {
            saveCopilotRequest(formValues)
                .then(() => {
                    toast.success('Copilot request sent successfully')
                    // Reset form after successful submission
                    setFormValues({})
                    setIsFormChanged(false)
                    setFormErrors({})
                    setExistingCopilot('')
                    setPaymentType('')
                })
                .catch(() => {
                    toast.error('Error sending copilot request')
                })
        }

        setFormErrors(updatedFormErrors)
    }

    return (
        <div className={classNames('d-flex flex-column justify-content-center align-items-center', styles.container)}>
            <div className={styles.form}>
                <form>
                    <h1 className={styles.heading}> Copilot Request </h1>
                    <p className={styles.subheading}>
                        {' '}
                        Hi,
                        {profile?.firstName}
                        !
                        This form is to request a copilot for your project. Please fill in the details below.
                    </p>
                    <p className={styles.formRow}>Select the project you want the copilot for</p>
                    <InputSelect
                        tabIndex={0}
                        options={projects}
                        value={formValues.projectId}
                        onChange={bind(handleFormValueChange, this, 'projectId')}
                        name='project'
                        label='Project'
                        placeholder='Select the project you wish to request a copilot for'
                        dirty
                        error={formErrors.projectId}
                    />
                    <p className={styles.formRow}>
                        Are you already working with a copilot that you&apos;d love to work with on this project
                        as well?
                    </p>

                    <div className={styles.formRadioBtn}>
                        <InputRadio
                            label='Yes'
                            name='yes'
                            id='yes'
                            value='Yes'
                            checked={existingCopilot === 'yes'}
                            onChange={function t() { exisitingCopilotToggle('yes') }}
                        />
                        <InputRadio
                            label='No'
                            name='no'
                            id='no'
                            value='No'
                            checked={existingCopilot === 'no'}
                            onChange={function t() { exisitingCopilotToggle('no') }}
                        />
                    </div>
                    {
                        existingCopilot === 'yes'
                        && (
                            <div className={styles.formRow}>
                                <p className={styles.formRow}>
                                    Great! What is the username of the copilot you&apos;d like to work with again?
                                </p>

                                <InputText
                                    name='copilot name'
                                    label='Copilot username'
                                    placeholder='Type the copilot username here...'
                                    dirty
                                    tabIndex={0}
                                    type='text'
                                    onChange={bind(handleFormValueChange, this, 'copilotUsername')}
                                    value={formValues.copilotUserName}
                                />
                            </div>
                        )
                    }
                    {formErrors.existingCopilot && (
                        <p className={styles.error}>
                            <IconSolid.ExclamationIcon />
                            {formErrors.existingCopilot}
                        </p>
                    )}

                    <p className={styles.formRow}>What type of project are you working on?</p>
                    <InputSelect
                        tabIndex={0}
                        options={projectTypes}
                        value={formValues.projectType}
                        onChange={bind(handleFormValueChange, this, 'projectType')}
                        name='projectType'
                        label='Project type'
                        placeholder='Select the project track'
                        dirty
                        error={formErrors.projectType}
                    />

                    <p className={styles.formRow}>How would you rank the complexity of the project?</p>
                    <div className={styles.complexity}>
                        <Button
                            secondary
                            variant={formValues.complexity === 'low' ? 'tc-green' : 'warning'}
                            size='lg'
                            label='Low- Type of Technology and requirements fall in line with 80% of Challenges'
                            value='low'
                            onClick={bind(handleFormValueChange, this, 'complexity')}
                            fullWidth
                            customRadius
                            noCaps
                            leftAlignText
                        />
                        <Button
                            secondary
                            variant={formValues.complexity === 'medium' ? 'tc-green' : 'warning'}
                            size='lg'
                            label='Medium- Special skills required,
                             but the standard competition framework is still being used'
                            value='medium'
                            onClick={bind(handleFormValueChange, this, 'complexity')}
                            fullWidth
                            customRadius
                            noCaps
                            leftAlignText
                        />
                        <Button
                            secondary
                            variant={formValues.complexity === 'high' ? 'tc-green' : 'warning'}
                            size='lg'
                            label='High- Special or niche skills required,
                             type of delivery has never or rarely been done previously'
                            value='high'
                            onClick={bind(handleFormValueChange, this, 'complexity')}
                            fullWidth
                            customRadius
                            noCaps
                            leftAlignText
                        />
                        {formErrors.complexity && (
                            <p className={styles.error}>
                                <IconSolid.ExclamationIcon />
                                {formErrors.complexity}
                            </p>
                        )}
                    </div>
                    <p className={styles.formRow}>
                        Please provide an overview of the project the copilot will undertake
                    </p>
                    <InputTextarea
                        label='Project overview'
                        name='overview'
                        placeholder='A minimum of three sentences explaining the
                         type of work and project which is to be undertaken.'
                        value={formValues.overview}
                        onChange={bind(handleFormValueChange, this, 'overview')}
                        error={formErrors.overview}
                        dirty
                    />
                    <p className={styles.formRow}>Any specific skills or technology requirements that come to mind?</p>
                    <div className={formErrors.skills ? styles.skillsError : styles.skillsWrapper}>
                        <InputSkillSelector
                            placeholder='Enter skills you are searching for...'
                            useWrapper={false}
                            theme='tc-green'
                            value={formValues.skills}
                            onChange={handleSkillsChange}
                        />
                    </div>
                    {formErrors.skills && (
                        <p className={styles.error}>
                            <IconSolid.ExclamationIcon />
                            {formErrors.skills}
                        </p>
                    )}
                    <p className={styles.formRow}>What&apos;s the planned start date for the copilot?</p>
                    <InputDatePicker
                        label='Copilot Start Date'
                        date={formValues.startDate as Date}
                        onChange={bind(handleFormValueChange, this, 'startDate')}
                        disabled={false}
                        error={formErrors.startDate}
                        dirty
                        minDate={new Date()}
                    />
                    <p className={styles.formRow}>How many weeks will you need the copilot for?</p>
                    <InputText
                        dirty
                        type='number'
                        label='Weeks'
                        name='weeks'
                        placeholder='Type the number of weeks'
                        value={formValues.numWeeks as string}
                        onChange={bind(handleFormValueChange, this, 'numWeeks')}
                        error={formErrors.numWeeks}
                        tabIndex={0}
                    />
                    <p className={styles.formRow}>Are there any timezone requirements or restrictions?</p>
                    <InputText
                        dirty
                        type='text'
                        label='Timezone Requirements'
                        name='weeks'
                        placeholder='Type your response here'
                        value={formValues.tzRestrictions as string}
                        onChange={bind(handleFormValueChange, this, 'tzRestrictions')}
                        error={formErrors.tzRestrictions}
                        tabIndex={0}
                    />
                    <p className={styles.formRow}>What do you expect the commitment to be per week in hours?</p>
                    <InputText
                        dirty
                        type='number'
                        label='Hours'
                        name='weeks'
                        placeholder='Type the number of hours required per week'
                        value={formValues.numHoursPerWeek as string}
                        onChange={bind(handleFormValueChange, this, 'numHoursPerWeek')}
                        error={formErrors.numHoursPerWeek}
                        tabIndex={0}
                    />
                    <p className={styles.formRow}>
                        Will this project require direct spoken communication with the customer
                        (i.e. phone calls, WebEx, etc.)
                    </p>
                    <div className={styles.formRadioBtn}>
                        <InputRadio
                            label='Yes'
                            name='yes'
                            id='yes'
                            value='yes'
                            checked={formValues.requiresCommunicatn === 'yes'}
                            onChange={bind(handleFormValueChange, this, 'requiresCommunicatn')}
                        />
                        <InputRadio
                            label='No'
                            name='no'
                            id='no'
                            value='no'
                            checked={formValues.requiresCommunicatn === 'no'}
                            onChange={bind(handleFormValueChange, this, 'requiresCommunicatn')}
                        />
                    </div>
                    {formErrors.requiresCommunicatn && (
                        <p className={styles.error}>
                            <IconSolid.ExclamationIcon />
                            {formErrors.requiresCommunicatn}
                        </p>
                    )}
                    <p className={styles.formRow}>Will this role be standard payments or something else?</p>
                    <div className={styles.formRadioBtn}>
                        <InputRadio
                            label='Standard'
                            name='paymentType'
                            id='standard'
                            value='standard'
                            checked={formValues.paymentType === 'standard'}
                            onChange={bind(togglePaymentType, this, 'standard')}
                        />
                        <InputRadio
                            label='Other'
                            name='paymentType'
                            id='other'
                            value={formValues.paymentType}
                            checked={formValues.paymentType === 'other'}
                            onChange={bind(togglePaymentType, this, 'other')}
                        />
                        {paymentType === 'other'
                            && (
                                <InputText
                                    dirty
                                    type='text'
                                    label='Payment Type'
                                    name='weeks'
                                    placeholder='Type your answer'
                                    value={formValues.otherPaymentType as string}
                                    onChange={bind(handleFormValueChange, this, 'otherPaymentType')}
                                    error={formErrors.otherPaymentType}
                                    tabIndex={0}
                                />
                            )}
                    </div>
                    {formErrors.paymentType && (
                        <p className={styles.error}>
                            <IconSolid.ExclamationIcon />
                            {formErrors.paymentType}
                        </p>
                    )}
                    <Button
                        primary
                        size='lg'
                        label='Send Copilot Request'
                        onClick={handleFormAction}
                        className={styles.formRow}
                        fullWidth
                        customRadius
                        disabled={!isFormChanged}
                    />
                </form>
            </div>
        </div>
    )
}

export default CopilotRequestForm
