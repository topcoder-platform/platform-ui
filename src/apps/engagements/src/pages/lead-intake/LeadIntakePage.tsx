import {
    ChangeEvent,
    FC,
    forwardRef,
    useCallback,
    useState,
} from 'react'
import {
    Control,
    Controller,
    ControllerRenderProps,
    FieldErrors,
    Resolver,
    useForm,
} from 'react-hook-form'
import { format, isValid as isValidDate, parseISO } from 'date-fns'
import DatePicker from 'react-datepicker'
import classNames from 'classnames'

import { SearchUserSkill } from '~/libs/core'
import { TOPCODER_URL } from '~/config/environments/default.env'
import { InputSkillSelector } from '~/libs/shared'
import { yupResolver } from '@hookform/resolvers/yup'
import {
    Button,
    ContentLayout,
    IconOutline,
    InputMultiselectOption,
    InputSelect,
    LoadingSpinner,
} from '~/libs/ui'

import type {
    CreateEngagementLeadIntakeRequest,
    CreateWiproDirectEngagementLeadIntakeRequest,
} from '../../lib/models'
import {
    submitEngagementLeadIntake,
    submitWiproDirectEngagementLeadIntake,
} from '../../lib/services/engagement-leads.service'

import { SMU_OPTIONS } from './lead-intake.constants'
import { leadIntakeSchema, wiproDirectLeadIntakeSchema } from './lead-intake.schema'
import type { LeadIntakeFormData, LeadIntakeVariant } from './lead-intake.types'
import styles from './LeadIntakePage.module.scss'

const MIN_PREFERRED_START_DATE = ((): Date => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return today
})()

const DEFAULT_VALUES: LeadIntakeFormData = {
    accountName: '',
    billRateAmount: '',
    billRateCurrency: '',
    engagementDuration: '',
    engagementModel: '',
    experienceLevel: '',
    jobDescription: '',
    minYearsExperience: 0,
    preferredStartDate: '',
    remoteWorkAccepted: 'yes',
    requiredSkills: [],
    resourcesRequired: 1,
    roleTitle: '',
    smu: '',
    timeZoneRequirement: '',
    workEmail: '',
    workingHoursPerDay: 8,
    workLocationRestrictions: '',
}

function buildIntakeRequest(values: LeadIntakeFormData): CreateEngagementLeadIntakeRequest {
    return {
        accountName: values.accountName.trim(),
        billRateAmount: values.billRateAmount.trim(),
        billRateCurrency: values.billRateCurrency.trim(),
        engagementDuration: values.engagementDuration.trim(),
        engagementModel: values.engagementModel,
        experienceLevel: values.experienceLevel,
        jobDescription: values.jobDescription.trim(),
        minYearsExperience: values.minYearsExperience ?? 0,
        preferredStartDate: new Date(values.preferredStartDate)
            .toISOString(),
        remoteWorkAccepted: values.remoteWorkAccepted === 'yes',
        requiredSkills: values.requiredSkills
            .map(skill => skill.name.trim())
            .filter(Boolean),
        resourcesRequired: values.resourcesRequired ?? 1,
        roleTitle: values.roleTitle.trim(),
        smu: values.smu,
        timeZoneRequirement: values.timeZoneRequirement.trim(),
        workEmail: values.workEmail.trim(),
        workingHoursPerDay: values.workingHoursPerDay ?? 8,
        workLocationRestrictions: values.workLocationRestrictions.trim() || undefined,
    }
}

function buildWiproDirectIntakeRequest(
    values: LeadIntakeFormData,
): CreateWiproDirectEngagementLeadIntakeRequest {
    return {
        accountName: values.accountName.trim(),
        engagementDuration: values.engagementDuration.trim(),
        jobDescription: values.jobDescription.trim(),
        preferredStartDate: values.preferredStartDate
            ? new Date(values.preferredStartDate)
                .toISOString()
            : undefined,
        remoteWorkAccepted: values.remoteWorkAccepted === 'yes',
        requiredSkills: values.requiredSkills
            .map(skill => skill.name.trim())
            .filter(Boolean),
        resourcesRequired: values.resourcesRequired ?? 1,
        smu: values.smu,
        timeZoneRequirement: values.timeZoneRequirement.trim(),
        workEmail: values.workEmail.trim(),
        workingHoursPerDay: values.workingHoursPerDay ?? 8,
        workLocationRestrictions: values.workLocationRestrictions.trim() || undefined,
    }
}

// The Wipro Direct form collects a subset of the consumption fields, so it shares the
// consumption form state and only validates the fields it renders.
const RESOLVERS: Record<LeadIntakeVariant, Resolver<LeadIntakeFormData>> = {
    wiproConsumption: yupResolver(leadIntakeSchema),
    wiproDirect: yupResolver(wiproDirectLeadIntakeSchema) as unknown as Resolver<LeadIntakeFormData>,
}

function submitLeadIntake(variant: LeadIntakeVariant, values: LeadIntakeFormData): Promise<unknown> {
    return variant === 'wiproDirect'
        ? submitWiproDirectEngagementLeadIntake(buildWiproDirectIntakeRequest(values))
        : submitEngagementLeadIntake(buildIntakeRequest(values))
}

interface FieldProps {
    hint: string
    label: string
    required?: boolean
}

interface BaseFieldComponentProps {
    control: Control<LeadIntakeFormData>
    disabled: boolean
    errors: FieldErrors<LeadIntakeFormData>
    fieldProps: FieldProps
}

const FieldLabel: FC<FieldProps> = props => (
    <div className={styles.fieldLabelBlock}>
        <label className={styles.fieldLabel}>
            {props.label}
            {props.required && <span className={styles.requiredIndicator}>*</span>}
        </label>
        {props.hint && <p className={styles.fieldHint}>{props.hint}</p>}
    </div>
)

interface TextFieldProps extends BaseFieldComponentProps {
    name: keyof LeadIntakeFormData
    type?: string
}

const LeadIntakeTextField: FC<TextFieldProps> = (props: TextFieldProps) => {
    const type: string = props.type ?? 'text'
    const name: keyof LeadIntakeFormData = props.name

    const handleChange = useCallback(
        (field: ControllerRenderProps<LeadIntakeFormData, typeof name>) => (
            (event: ChangeEvent<HTMLInputElement>): void => {
                field.onChange(event.target.value)
            }
        ),
        [],
    )

    const renderInput = useCallback(
        (renderProps: { field: ControllerRenderProps<LeadIntakeFormData, typeof name> }): JSX.Element => (
            <input
                {...renderProps.field}
                className={classNames(
                    styles.inputField,
                    props.errors[name] && styles.inputError,
                )}
                disabled={props.disabled}
                type={type}
                value={String(renderProps.field.value ?? '')}
                onChange={handleChange(renderProps.field)}
            />
        ),
        [handleChange, name, props.disabled, props.errors, type],
    )

    return (
        <div className={styles.fieldGroup}>
            <FieldLabel {...props.fieldProps} />
            <Controller
                control={props.control}
                name={name}
                render={renderInput}
            />
            {props.errors[name]?.message && (
                <p className={styles.fieldError}>{String(props.errors[name]?.message)}</p>
            )}
        </div>
    )
}

interface DatePickerInputProps {
    className?: string
    disabled?: boolean
    onClick?: () => void
    placeholder?: string
    value?: string
}

const DatePickerInput = forwardRef<HTMLInputElement, DatePickerInputProps>(
    (props: DatePickerInputProps, ref) => (
        <div className={styles.datePickerField}>
            <input
                ref={ref}
                className={classNames(styles.inputField, props.className)}
                disabled={props.disabled}
                placeholder={props.placeholder}
                readOnly
                type='text'
                value={props.value ?? ''}
                onClick={props.onClick}
            />
            <IconOutline.CalendarIcon className={styles.datePickerIcon} />
        </div>
    ),
)

DatePickerInput.displayName = 'DatePickerInput'

function parsePreferredStartDate(value: string): Date | undefined {
    if (!value) {
        return undefined
    }

    const parsed = parseISO(value)

    return isValidDate(parsed) ? parsed : undefined
}

interface NumberFieldProps extends BaseFieldComponentProps {
    name: 'minYearsExperience' | 'resourcesRequired' | 'workingHoursPerDay'
}

const LeadIntakeNumberField: FC<NumberFieldProps> = (props: NumberFieldProps) => {
    const name: NumberFieldProps['name'] = props.name

    const handleChange = useCallback(
        (field: ControllerRenderProps<LeadIntakeFormData, typeof name>) => (
            (event: ChangeEvent<HTMLInputElement>): void => {
                const nextValue = event.target.value
                field.onChange(nextValue === '' ? 0 : Number(nextValue))
            }
        ),
        [],
    )

    const renderInput = useCallback(
        (renderProps: { field: ControllerRenderProps<LeadIntakeFormData, typeof name> }): JSX.Element => (
            <input
                className={classNames(
                    styles.inputField,
                    props.errors[name] && styles.inputError,
                )}
                disabled={props.disabled}
                type='number'
                value={renderProps.field.value ?? ''}
                onChange={handleChange(renderProps.field)}
            />
        ),
        [handleChange, name, props.disabled, props.errors],
    )

    return (
        <div className={styles.fieldGroup}>
            <FieldLabel {...props.fieldProps} />
            <Controller
                control={props.control}
                name={name}
                render={renderInput}
            />
            {props.errors[name]?.message && (
                <p className={styles.fieldError}>{String(props.errors[name]?.message)}</p>
            )}
        </div>
    )
}

interface TextareaFieldProps extends BaseFieldComponentProps {
    name: 'jobDescription'
}

const LeadIntakeTextareaField: FC<TextareaFieldProps> = (props: TextareaFieldProps) => {
    const name: TextareaFieldProps['name'] = props.name

    const handleChange = useCallback(
        (field: ControllerRenderProps<LeadIntakeFormData, typeof name>) => (
            (event: ChangeEvent<HTMLTextAreaElement>): void => {
                field.onChange(event.target.value)
            }
        ),
        [],
    )

    const renderTextarea = useCallback(
        (renderProps: { field: ControllerRenderProps<LeadIntakeFormData, typeof name> }): JSX.Element => (
            <textarea
                {...renderProps.field}
                className={classNames(
                    styles.textareaField,
                    props.errors[name] && styles.inputError,
                )}
                disabled={props.disabled}
                value={String(renderProps.field.value ?? '')}
                onChange={handleChange(renderProps.field)}
            />
        ),
        [handleChange, name, props.disabled, props.errors],
    )

    return (
        <div className={styles.fieldGroupFull}>
            <FieldLabel {...props.fieldProps} />
            <Controller
                control={props.control}
                name={name}
                render={renderTextarea}
            />
            {props.errors[name]?.message && (
                <p className={styles.fieldError}>{String(props.errors[name]?.message)}</p>
            )}
        </div>
    )
}

interface SelectFieldProps extends BaseFieldComponentProps {
    name: keyof LeadIntakeFormData
    options: Array<{ label: string; value: string }>
    placeholder: string
}

const LeadIntakeSelectField: FC<SelectFieldProps> = (props: SelectFieldProps) => {
    const name: keyof LeadIntakeFormData = props.name

    const handleChange = useCallback(
        (field: ControllerRenderProps<LeadIntakeFormData, typeof name>) => (
            (event: ChangeEvent<HTMLInputElement>): void => {
                field.onChange(event.target.value)
            }
        ),
        [],
    )

    const renderSelect = useCallback(
        (renderProps: { field: ControllerRenderProps<LeadIntakeFormData, typeof name> }): JSX.Element => {
            const selectedValue = String(renderProps.field.value ?? '')

            return (
                <InputSelect
                    classNameWrapper={classNames(
                        styles.selectInputWrapper,
                        props.errors[name] && styles.selectInputError,
                        !selectedValue && styles.selectInputPlaceholder,
                    )}
                    disabled={props.disabled}
                    hideInlineErrors
                    label=''
                    name={String(name)}
                    options={props.options}
                    placeholder={props.placeholder}
                    value={selectedValue}
                    onChange={handleChange(renderProps.field)}
                />
            )
        },
        [handleChange, name, props.disabled, props.errors, props.options, props.placeholder],
    )

    return (
        <div className={styles.fieldGroup}>
            <FieldLabel {...props.fieldProps} />
            <Controller
                control={props.control}
                name={name}
                render={renderSelect}
            />
            {props.errors[name]?.message && (
                <p className={styles.fieldError}>{String(props.errors[name]?.message)}</p>
            )}
        </div>
    )
}

const LeadIntakeDateField: FC<BaseFieldComponentProps> = (props: BaseFieldComponentProps) => {
    const handleDateChange = useCallback(
        (field: ControllerRenderProps<LeadIntakeFormData, 'preferredStartDate'>) => (
            (date: Date | null): void => {
                field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
            }
        ),
        [],
    )

    const renderDatePicker = useCallback(
        (renderProps: {
            field: ControllerRenderProps<LeadIntakeFormData, 'preferredStartDate'>
        }): JSX.Element => (
            <DatePicker
                calendarClassName={styles.datePopover}
                customInput={(
                    <DatePickerInput
                        disabled={props.disabled}
                        className={props.errors.preferredStartDate ? styles.inputError : undefined}
                    />
                )}
                dateFormat='MMM d, yyyy'
                disabled={props.disabled}
                dropdownMode='select'
                minDate={MIN_PREFERRED_START_DATE}
                placeholderText='Select a date'
                popperClassName={styles.datePopper}
                selected={parsePreferredStartDate(String(renderProps.field.value ?? ''))}
                showMonthDropdown
                showYearDropdown
                onChange={handleDateChange(renderProps.field)}
            />
        ),
        [handleDateChange, props.disabled, props.errors.preferredStartDate],
    )

    return (
        <div className={styles.fieldGroup}>
            <FieldLabel {...props.fieldProps} />
            <Controller
                control={props.control}
                name='preferredStartDate'
                render={renderDatePicker}
            />
            {props.errors.preferredStartDate?.message && (
                <p className={styles.fieldError}>
                    {String(props.errors.preferredStartDate.message)}
                </p>
            )}
        </div>
    )
}

interface RadioGroupFieldProps extends BaseFieldComponentProps {
    name: 'remoteWorkAccepted'
    options: Array<{ label: string; value: string }>
}

const LeadIntakeRadioGroupField: FC<RadioGroupFieldProps> = (props: RadioGroupFieldProps) => {
    const name: RadioGroupFieldProps['name'] = props.name

    const handleOptionChange = useCallback(
        (field: ControllerRenderProps<LeadIntakeFormData, typeof name>, value: string) => (): void => {
            field.onChange(value)
        },
        [],
    )

    const renderRadioGroup = useCallback(
        (renderProps: { field: ControllerRenderProps<LeadIntakeFormData, typeof name> }): JSX.Element => (
            <div className={styles.radioGroup}>
                {props.options.map(option => (
                    <label key={option.value} className={styles.radioOption}>
                        <input
                            checked={renderProps.field.value === option.value}
                            disabled={props.disabled}
                            name={name}
                            type='radio'
                            value={option.value}
                            onChange={handleOptionChange(renderProps.field, option.value)}
                        />
                        {option.label}
                    </label>
                ))}
            </div>
        ),
        [handleOptionChange, name, props.disabled, props.options],
    )

    return (
        <div className={styles.fieldGroupFull}>
            <FieldLabel {...props.fieldProps} />
            <Controller
                control={props.control}
                name={name}
                render={renderRadioGroup}
            />
            {props.errors[name]?.message && (
                <p className={styles.fieldError}>{String(props.errors[name]?.message)}</p>
            )}
        </div>
    )
}

interface SkillsFieldProps extends BaseFieldComponentProps {
    onSkillsChange: (
        fieldOnChange: (value: SearchUserSkill[]) => void,
    ) => (event: ChangeEvent<HTMLInputElement>) => void
}

const LeadIntakeSkillsField: FC<SkillsFieldProps> = (props: SkillsFieldProps) => {
    const disabled: boolean = props.disabled
    const onSkillsChange: SkillsFieldProps['onSkillsChange'] = props.onSkillsChange

    const renderSkillsSelector = useCallback(
        (renderProps: { field: ControllerRenderProps<LeadIntakeFormData, 'requiredSkills'> }): JSX.Element => (
            <InputSkillSelector
                className={styles.skillsSelector}
                loading={disabled}
                plainRemoveIcon
                placeholder='Type to search and add skills'
                useWrapper={false}
                value={renderProps.field.value}
                onChange={onSkillsChange(renderProps.field.onChange)}
            />
        ),
        [disabled, onSkillsChange],
    )

    return (
        <div className={styles.fieldGroupFull}>
            <FieldLabel {...props.fieldProps} />
            <Controller
                control={props.control}
                name='requiredSkills'
                render={renderSkillsSelector}
            />
            {props.errors.requiredSkills?.message && (
                <p className={styles.fieldError}>
                    {String(props.errors.requiredSkills.message)}
                </p>
            )}
        </div>
    )
}

interface LeadIntakePageProps {
    variant?: LeadIntakeVariant
}

const LeadIntakePage: FC<LeadIntakePageProps> = (props: LeadIntakePageProps) => {
    const variant: LeadIntakeVariant = props.variant ?? 'wiproConsumption'
    const isWiproConsumption = variant === 'wiproConsumption'

    const [submitted, setSubmitted] = useState<boolean>(false)
    const [submitError, setSubmitError] = useState<string | undefined>(undefined)

    const form = useForm<LeadIntakeFormData>({
        defaultValues: DEFAULT_VALUES,
        mode: 'all',
        resolver: RESOLVERS[variant],
    })

    const control = form.control
    const errors = form.formState.errors
    const handleSubmit = form.handleSubmit
    const formIsValid = form.formState.isValid
    const hasSubmitted = form.formState.submitCount > 0
    const reset = form.reset

    const [submitting, setSubmitting] = useState<boolean>(false)

    const onSubmit = useCallback(async (values: LeadIntakeFormData): Promise<void> => {
        if (submitting) {
            return
        }

        setSubmitting(true)
        setSubmitError(undefined)

        try {
            await submitLeadIntake(variant, values)
            setSubmitted(true)
        } catch (err: any) {
            const message = err?.response?.data?.message
                || err?.message
                || 'Unable to submit your request. Please try again.'
            setSubmitError(message)
        } finally {
            setSubmitting(false)
        }
    }, [submitting, variant])

    const handleClear = useCallback((): void => {
        reset(DEFAULT_VALUES)
        setSubmitError(undefined)
    }, [reset])

    const handleSkillsChange = useCallback((
        fieldOnChange: (value: SearchUserSkill[]) => void,
    ) => (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const options = event.target.value as unknown as InputMultiselectOption[]
        const skills = options.map(option => ({
            id: String(option.value),
            name: String(option.label),
        }))
        fieldOnChange(skills)
    }, [])

    const handleBackToHomepage = useCallback((): void => {
        window.location.assign(TOPCODER_URL)
    }, [])

    return (
        <ContentLayout
            contentClass={styles.pageContent}
            isFluid
            innerClass={styles.pageInner}
            outerClass={styles.pageOuter}
        >
            <header className={styles.pageHeader}>
                <h2 className={styles.pageHeaderTitle}>Engagement Lead Intake</h2>
            </header>

            <div className={styles.pageBody}>
                <div className={styles.formContainer}>
                    {!submitted && (
                        <div className={styles.intro}>
                            <div className={styles.introTitle}>Submit an Engagement Requirement</div>
                            <p className={styles.introText}>
                                Use this form to share your Flexi-Talent resource requirement.
                                No sign-in is required. A Talent Manager will review your submission
                                and follow up using the work email provided.
                            </p>
                        </div>
                    )}

                    {submitted && (
                        <div className={styles.successCard}>
                            <div className={styles.successIconWrap}>
                                <IconOutline.CheckCircleIcon className={styles.successIcon} />
                            </div>
                            <h4 className={styles.successTitle}>Thank you for your submission!</h4>
                            <p className={styles.successText}>
                                Your engagement requirement has been received. A Talent Manager
                                will review it and contact you at the email address provided.
                            </p>
                            <Button
                                className={styles.primaryButton}
                                customRadius
                                label='Back to homepage'
                                noCaps
                                onClick={handleBackToHomepage}
                                primary
                                type='button'
                            />
                        </div>
                    )}

                    {submitError && (
                        <div className={`${styles.notice} ${styles.noticeError}`}>
                            <IconOutline.ExclamationIcon className={styles.noticeIcon} />
                            <div>
                                <p className={styles.noticeTitle}>Submission failed</p>
                                <p className={styles.noticeText}>{submitError}</p>
                            </div>
                        </div>
                    )}

                    {!submitted && (
                        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                            <section className={styles.section}>
                                <h5 className={styles.sectionTitle}>1. Contact & Account</h5>
                                <div className={styles.fieldGrid}>
                                    <LeadIntakeTextField
                                        control={control}
                                        disabled={submitting}
                                        errors={errors}
                                        fieldProps={{
                                            hint: 'Example: john.doe@wipro.com',
                                            label: 'Work Email Address',
                                            required: true,
                                        }}
                                        name='workEmail'
                                        type='email'
                                    />
                                    <LeadIntakeTextField
                                        control={control}
                                        disabled={submitting}
                                        errors={errors}
                                        fieldProps={{
                                            hint: 'Examples: ABC Bank, XYZ Telecom',
                                            label: 'Account / Customer Name',
                                            required: true,
                                        }}
                                        name='accountName'
                                    />
                                    <LeadIntakeSelectField
                                        control={control}
                                        disabled={submitting}
                                        errors={errors}
                                        fieldProps={{
                                            hint: '',
                                            label: 'Strategic Market Unit (SMU)',
                                            required: true,
                                        }}
                                        name='smu'
                                        options={SMU_OPTIONS}
                                        placeholder='Select SMU'
                                    />
                                </div>
                            </section>

                            <section className={styles.section}>
                                <h5 className={styles.sectionTitle}>2. Role Requirements</h5>
                                <div className={styles.fieldGrid}>
                                    {isWiproConsumption && (
                                        <>
                                            <LeadIntakeSelectField
                                                control={control}
                                                disabled={submitting}
                                                errors={errors}
                                                fieldProps={{
                                                    hint: 'Select the commercial model for this requirement.',
                                                    label: 'Engagement Model',
                                                    required: true,
                                                }}
                                                name='engagementModel'
                                                options={[
                                                    { label: 'Time & Material (T&M)', value: 'TIME_AND_MATERIAL' },
                                                    { label: 'Fixed Price Project (FPP)', value: 'FIXED_PRICE' },
                                                ]}
                                                placeholder='Select model'
                                            />
                                            <LeadIntakeTextField
                                                control={control}
                                                disabled={submitting}
                                                errors={errors}
                                                fieldProps={{
                                                    hint: [
                                                        'Examples: Full Stack Developer,',
                                                        'Product Manager, QA Engineer',
                                                    ].join(' '),
                                                    label: 'Role Title',
                                                    required: true,
                                                }}
                                                name='roleTitle'
                                            />
                                        </>
                                    )}
                                    <LeadIntakeTextareaField
                                        control={control}
                                        disabled={submitting}
                                        errors={errors}
                                        fieldProps={{
                                            hint: 'Describe key responsibilities, deliverables, and expected outcomes.',
                                            label: 'Detailed Job Description',
                                            required: true,
                                        }}
                                        name='jobDescription'
                                    />
                                    <LeadIntakeSkillsField
                                        control={control}
                                        disabled={submitting}
                                        errors={errors}
                                        fieldProps={{
                                            hint: 'Type to search and select the mandatory skills for this role.',
                                            label: 'Required Skills',
                                            required: true,
                                        }}
                                        onSkillsChange={handleSkillsChange}
                                    />
                                    {isWiproConsumption && (
                                        <>
                                            <LeadIntakeSelectField
                                                control={control}
                                                disabled={submitting}
                                                errors={errors}
                                                fieldProps={{
                                                    hint: 'Select the required level of experience.',
                                                    label: 'Experience Level Required',
                                                    required: true,
                                                }}
                                                name='experienceLevel'
                                                options={[
                                                    { label: 'Junior', value: 'JUNIOR' },
                                                    { label: 'Mid-Level', value: 'MID' },
                                                    { label: 'Senior', value: 'SENIOR' },
                                                    { label: 'Lead / Architect', value: 'LEAD_ARCHITECT' },
                                                ]}
                                                placeholder='Select level'
                                            />
                                            <LeadIntakeNumberField
                                                control={control}
                                                disabled={submitting}
                                                errors={errors}
                                                fieldProps={{
                                                    hint: 'Specify the minimum years of relevant experience required.',
                                                    label: 'Minimum Years of Experience',
                                                    required: true,
                                                }}
                                                name='minYearsExperience'
                                            />
                                        </>
                                    )}
                                </div>
                            </section>

                            <section className={styles.section}>
                                <h5 className={styles.sectionTitle}>3. Engagement Details</h5>
                                <div className={styles.fieldGrid}>
                                    <LeadIntakeNumberField
                                        control={control}
                                        disabled={submitting}
                                        errors={errors}
                                        fieldProps={{
                                            hint: 'Indicate the number of resources required for this role.',
                                            label: 'Number of Resources Required',
                                            required: true,
                                        }}
                                        name='resourcesRequired'
                                    />
                                    <LeadIntakeDateField
                                        control={control}
                                        disabled={submitting}
                                        errors={errors}
                                        fieldProps={{
                                            hint: 'Indicate the date on which the resource(s) are expected to begin.',
                                            label: 'Preferred Start Date',
                                            required: isWiproConsumption,
                                        }}
                                    />
                                    <LeadIntakeTextField
                                        control={control}
                                        disabled={submitting}
                                        errors={errors}
                                        fieldProps={{
                                            hint: 'Examples: 3 months, 6 months, 12 months, ongoing',
                                            label: 'Engagement Duration',
                                            required: true,
                                        }}
                                        name='engagementDuration'
                                    />
                                    <LeadIntakeNumberField
                                        control={control}
                                        disabled={submitting}
                                        errors={errors}
                                        fieldProps={{
                                            hint: 'Specify the expected daily working hours for the resource.',
                                            label: 'Expected Working Hours per Day',
                                            required: true,
                                        }}
                                        name='workingHoursPerDay'
                                    />
                                    <LeadIntakeTextField
                                        control={control}
                                        disabled={submitting}
                                        errors={errors}
                                        fieldProps={{
                                            hint: 'Examples: IST, GMT, CET, PST, EST or ANY',
                                            label: 'Time Zone Requirement',
                                            required: true,
                                        }}
                                        name='timeZoneRequirement'
                                    />
                                    <LeadIntakeRadioGroupField
                                        control={control}
                                        disabled={submitting}
                                        errors={errors}
                                        fieldProps={{
                                            hint: [
                                                'Topcoder Flexi-Talent resources operate remotely.',
                                                'Please confirm whether a fully remote engagement is acceptable',
                                            ].join(' '),
                                            label: 'Remote Work Acceptance',
                                            required: true,
                                        }}
                                        name='remoteWorkAccepted'
                                        options={[
                                            { label: 'Yes', value: 'yes' },
                                        ]}
                                    />
                                    <LeadIntakeTextField
                                        control={control}
                                        disabled={submitting}
                                        errors={errors}
                                        fieldProps={{
                                            hint: 'Optional. Examples: India-only, EU-preferred or ANY',
                                            label: 'Work Location Restrictions',
                                        }}
                                        name='workLocationRestrictions'
                                    />
                                </div>
                            </section>

                            {isWiproConsumption && (
                                <section className={styles.section}>
                                    <h5 className={styles.sectionTitle}>4. Commercial & Priority</h5>
                                    <div className={styles.fieldGrid}>
                                        <LeadIntakeSelectField
                                            control={control}
                                            disabled={submitting}
                                            errors={errors}
                                            fieldProps={{
                                                hint: 'Select the currency for the approved hourly bill rate.',
                                                label: 'Bill Rate Currency',
                                                required: true,
                                            }}
                                            name='billRateCurrency'
                                            options={[
                                                { label: 'USD', value: 'USD' },
                                                { label: 'GBP', value: 'GBP' },
                                                { label: 'EUR', value: 'EUR' },
                                                { label: 'INR', value: 'INR' },
                                                { label: 'Other', value: 'OTHER' },
                                            ]}
                                            placeholder='Select currency'
                                        />
                                        <LeadIntakeTextField
                                            control={control}
                                            disabled={submitting}
                                            errors={errors}
                                            fieldProps={{
                                                hint: 'Hourly amount, e.g. 100',
                                                label: 'Approved Client Bill Rate (Hourly)',
                                                required: true,
                                            }}
                                            name='billRateAmount'
                                        />
                                    </div>
                                </section>
                            )}

                            <div className={styles.submitSection}>
                                <Button
                                    className={styles.primaryButton}
                                    customRadius
                                    disabled={submitting || (hasSubmitted && !formIsValid)}
                                    label={(
                                        <span className={styles.submitLabel}>
                                            {submitting && (
                                                <LoadingSpinner className={styles.submitSpinner} inline />
                                            )}
                                            Submit Requirement
                                        </span>
                                    )}
                                    noCaps
                                    primary
                                    type='submit'
                                />
                                <Button
                                    className={styles.secondaryButton}
                                    customRadius
                                    disabled={submitting}
                                    label='Clear'
                                    noCaps
                                    onClick={handleClear}
                                    secondary
                                    type='button'
                                />
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </ContentLayout>
    )
}

export default LeadIntakePage
