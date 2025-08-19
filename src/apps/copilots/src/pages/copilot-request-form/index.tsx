import { FC, useContext, useEffect, useMemo, useState } from 'react'
import { bind, debounce, isEmpty } from 'lodash'
import { toast } from 'react-toastify'
import { Params, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import classNames from 'classnames'

import { profileContext, ProfileContextData } from '~/libs/core'
import { Button, IconSolid, InputDatePicker, InputMultiselectOption,
    InputRadio, InputSelect, InputSelectReact, InputText, InputTextarea } from '~/libs/ui'
import { InputSkillSelector } from '~/libs/shared'

import { getProject, getProjects, ProjectsResponse, useProjects } from '../../services/projects'
import { ProjectTypes, ProjectTypeValues } from '../../constants'
import { CopilotRequestResponse, saveCopilotRequest, useCopilotRequest } from '../../services/copilot-requests'
import { Project } from '../../models/Project'

import styles from './styles.module.scss'

const editableFields = [
    'projectId',
    'opportunityTitle',
    'copilotUsername',
    'complexity',
    'requiresCommunication',
    'paymentType',
    'otherPaymentType',
    'projectType',
    'overview',
    'skills',
    'startDate',
    'numWeeks',
    'tzRestrictions',
    'numHoursPerWeek',
]

// eslint-disable-next-line
const CopilotRequestForm: FC<{}> = () => {
    const { profile }: ProfileContextData = useContext(profileContext)
    const navigate = useNavigate()
    const routeParams: Params<string> = useParams()
    const [params] = useSearchParams()

    const [formValues, setFormValues] = useState<any>({})
    const [isFormChanged, setIsFormChanged] = useState(false)
    const [formErrors, setFormErrors] = useState<any>({})
    const [paymentType, setPaymentType] = useState<string>('')
    const [projectFromQuery, setProjectFromQuery] = useState<Project>()
    const activeProjectStatuses = ['active', 'approved', 'draft', 'new']

    const { data: copilotRequestData }: CopilotRequestResponse = useCopilotRequest(routeParams.requestId)

    useEffect(() => {
        if (copilotRequestData) {
            setFormValues(copilotRequestData)
        }
    }, [copilotRequestData])

    const fetchProject = async (): Promise<void> => {
        const projectId = params.get('projectId')

        if (!projectId) {
            return
        }

        const project = await getProject(projectId as string)

        setFormValues((prevValues: any) => ({
            ...prevValues,
            projectId: project.id,
        }))
        setIsFormChanged(true)
        setProjectFromQuery(project)
    }

    useEffect(() => {
        fetchProject()
    }, [params])

    const { data: projects = [] }: ProjectsResponse = useProjects(undefined, {
        filter: { id: copilotRequestData?.projectId },
        isPaused: () => !copilotRequestData?.projectId,
    })

    const projectOptions = useMemo(() => {
        const projectsFromResponse = projects.map(p => ({
            label: p.name,
            value: p.id,
        }))

        return projectFromQuery
            ? [...projectsFromResponse, { label: projectFromQuery.name, value: projectFromQuery.id }]
            : projectsFromResponse
    }, [projects, projectFromQuery])

    const projectTypes = ProjectTypes ? ProjectTypes.map(project => ({
        label: project,
        value: ProjectTypeValues[project],
    }))
        : []

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

    async function handleProjectSearch(inputValue: string): Promise<Array<{
        label: string;
        value: string;
    }>> {
        const response = await getProjects(inputValue, {
            filter: {
                status: {
                    $in: [activeProjectStatuses],
                },
            },
        })
        return response.map(project => ({ label: project.name, value: project.id }))
    }

    function handleProjectSelect(option: React.ChangeEvent<HTMLInputElement>): void {
        setFormValues((prevValues: any) => ({
            ...prevValues,
            projectId: option.target.value,
        }))

        setFormErrors((prevErrors: any) => {
            const updatedErrors = { ...prevErrors }
            delete updatedErrors.projectId

            return updatedErrors
        })

        setIsFormChanged(true)
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
                if (event.type === 'blur') {
                    value = event.target.value?.trim()
                } else {
                    value = event.target.value
                }

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
                    errorKey = 'copilotUsername'
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

        const fieldValidations: { condition: boolean; key: string; message: string }[] = [
            {
                condition: (formValues.opportunityTitle?.trim().length ?? 0) < 7,
                key: 'opportunityTitle',
                message: 'The title for the opportunity must be at least 7 characters',
            },
            { condition: !formValues.projectId, key: 'projectId', message: 'Project is required' },
            { condition: !formValues.complexity, key: 'complexity', message: 'Selection is required' },
            {
                condition: !formValues.requiresCommunication,
                key: 'requiresCommunication',
                message: 'Selection is required',
            },
            { condition: !formValues.paymentType, key: 'paymentType', message: 'Selection is required' },
            { condition: !formValues.projectType, key: 'projectType', message: 'Selecting project type is required' },
            {
                condition: !formValues.overview || formValues.overview.trim().length < 10,
                key: 'overview',
                message: 'Project overview must be at least 10 characters',
            },
            {
                condition: formValues.paymentType === 'other' && !formValues.otherPaymentType,
                key: 'otherPaymentType',
                message: 'Cannot leave the field empty',
            },
            {
                condition: !formValues.skills || formValues.skills.length === 0,
                key: 'skills',
                message: 'Providing skills is required',
            },
            {
                condition: !formValues.startDate,
                key: 'startDate',
                message: 'Providing a start date for copilot is required',
            },
            {
                condition: !formValues.numWeeks,
                key: 'numWeeks',
                message: 'Providing number of weeks is required',
            },
            {
                condition: formValues.numWeeks <= 0,
                key: 'numWeeks',
                message: 'Number of weeks should be a positive number',
            },
            {
                condition: !formValues.tzRestrictions || formValues.tzRestrictions.trim().length === 0,
                key: 'tzRestrictions',
                message: 'Providing timezone restrictions is required. Type No if no restrictions',
            },
            {
                condition: !formValues.numHoursPerWeek,
                key: 'numHoursPerWeek',
                message: 'Providing commitment per week is required',
            },
            {
                condition: formValues.numHoursPerWeek <= 0,
                key: 'numHoursPerWeek',
                message: 'Number of hours per week should be a positive number',
            },
            {
                condition: formValues.otherPaymentType && formValues.otherPaymentType.trim().length === 0,
                key: 'otherPaymentType',
                message: 'Field cannot be left empty',
            },
            {
                condition: formValues.otherPaymentType && formValues.otherPaymentType.trim().length > 8,
                key: 'otherPaymentType',
                message: 'Field only allows 8 characters',
            },
        ]

        fieldValidations.forEach(
            ({ condition, key, message }: { condition: boolean; key: string; message: string }) => {
                if (condition) {
                    updatedFormErrors[key] = message
                }
            },
        )

        if (isEmpty(updatedFormErrors)) {
            const cleanedFormValues: any = Object.fromEntries(
                Object.entries(formValues)
                    // Excludes null and undefined
                    .filter(([field, value]) => editableFields.includes(field) && value !== ''),
            )
            saveCopilotRequest({ ...cleanedFormValues, id: copilotRequestData?.id })
                .then(() => {
                    toast.success(
                        copilotRequestData ? 'Copilot request updated successfully'
                            : 'Copilot request sent successfully',
                    )
                    setFormValues({
                        complexity: '',
                        numHoursPerWeek: '',
                        numWeeks: '',
                        otherPaymentType: '',
                        overview: '',
                        paymentType: '',
                        projectType: '',
                        requiresCommunication: '',
                        skills: [],
                        startDate: undefined,
                        tzRestrictions: '',
                    })
                    setIsFormChanged(false)
                    setFormErrors({})
                    setPaymentType('')
                    // Added a small timeout for the toast to be visible properly to the users
                    setTimeout(() => {
                        navigate('/requests')
                    }, 1000)
                })
                .catch(e => {
                    toast.error(e.message)
                    const details = e.response?.data?.details
                    if (details) {
                        toast.error(details)
                    }
                })
        } else {
            window.scrollTo({ behavior: 'smooth', top: 0 })
        }

        setFormErrors(updatedFormErrors)
    }

    const debouncedProjectSearch = useMemo(() => debounce((inputValue: string, callback: (options: any[]) => void) => {
        handleProjectSearch(inputValue)
            .then(callback)
    }, 300), [])

    return (
        <div className={classNames('d-flex flex-column justify-content-center align-items-center', styles.container)}>
            <div className={styles.form}>
                <form>
                    <h1 className={styles.heading}> Copilot Request </h1>

                    <p className={styles.subheading}>
                        Hi,
                        {' '}
                        {profile?.firstName}
                        !
                        {' '}
                        {
                            copilotRequestData?.id
                                ? 'Use this form to update the copilot request for your project.'
                                : 'This form is to request a copilot for your project.'
                                    + ' Please fill in the details below.'
                        }
                    </p>
                    { !isEmpty(formErrors)
                        && (
                            <p className={styles.error}>
                                <IconSolid.ExclamationIcon />
                                Resolve the errors on the form before submitting
                            </p>
                        )}

                    <p className={styles.formRow}>Copilot Opportunity Title</p>
                    <InputText
                        dirty
                        type='text'
                        label='Title'
                        name='opportunityTitle'
                        placeholder='Enter a title for the opportunity'
                        value={formValues.opportunityTitle?.toString()}
                        onChange={bind(handleFormValueChange, this, 'opportunityTitle')}
                        onBlur={bind(handleFormValueChange, this, 'opportunityTitle')}
                        error={formErrors.opportunityTitle}
                        tabIndex={0}
                        forceUpdateValue
                    />

                    <p className={styles.formRow}>Select the project you want the copilot for</p>
                    <InputSelectReact
                        tabIndex={0}
                        value={formValues.projectId || ''}
                        onChange={handleProjectSelect}
                        loadOptions={debouncedProjectSearch}
                        async
                        name='project'
                        label='Project'
                        placeholder='Start typing the name of the project'
                        dirty
                        isClearable
                        error={formErrors.projectId}
                        options={projectOptions}
                    />

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
                            textWrap
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
                            textWrap
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
                            textWrap
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
                        maxDate={new Date(new Date()
                            .setFullYear(new Date()
                                .getFullYear() + 2))}
                        minYear={new Date()}
                        className={styles.datepicker}
                    />
                    <p className={styles.formRow}>How many weeks will you need the copilot for?</p>
                    <InputText
                        dirty
                        type='number'
                        label='Weeks'
                        name='weeks'
                        placeholder='Type the number of weeks'
                        value={formValues.numWeeks?.toString()}
                        onChange={bind(handleFormValueChange, this, 'numWeeks')}
                        error={formErrors.numWeeks}
                        tabIndex={0}
                        forceUpdateValue
                    />
                    <p className={styles.formRow}>Are there any timezone requirements or restrictions?</p>
                    <InputText
                        dirty
                        type='text'
                        label='Timezone Requirements'
                        name='tzRequirements'
                        placeholder='Type your response here'
                        value={formValues.tzRestrictions as string}
                        onChange={bind(handleFormValueChange, this, 'tzRestrictions')}
                        error={formErrors.tzRestrictions}
                        tabIndex={0}
                        forceUpdateValue
                    />
                    <p className={styles.formRow}>What do you expect the commitment to be per week in hours?</p>
                    <InputText
                        dirty
                        type='number'
                        label='Hours'
                        name='hours'
                        placeholder='Type the number of hours required per week'
                        value={formValues.numHoursPerWeek?.toString()}
                        onChange={bind(handleFormValueChange, this, 'numHoursPerWeek')}
                        error={formErrors.numHoursPerWeek}
                        tabIndex={0}
                        forceUpdateValue
                    />
                    <p className={styles.formRow}>
                        Will this project require direct spoken communication with the customer
                        (i.e. phone calls, WebEx, etc.)
                    </p>
                    <div className={styles.formRadioBtn}>
                        <InputRadio
                            label='Yes'
                            name='requiresCommunication'
                            id='yes'
                            value='yes'
                            checked={formValues.requiresCommunication === 'yes'}
                            onChange={bind(handleFormValueChange, this, 'requiresCommunication')}
                        />
                        <InputRadio
                            label='No'
                            name='requiresCommunication'
                            id='no'
                            value='no'
                            checked={formValues.requiresCommunication === 'no'}
                            onChange={bind(handleFormValueChange, this, 'requiresCommunication')}
                        />
                    </div>
                    {formErrors.requiresCommunication && (
                        <p className={styles.error}>
                            <IconSolid.ExclamationIcon />
                            {formErrors.requiresCommunication}
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
                                    maxLength={8}
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
                        label={copilotRequestData ? 'Save Copilot Request' : 'Send Copilot Request'}
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
