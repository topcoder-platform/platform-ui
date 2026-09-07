/* eslint-disable react/jsx-no-bind */
import { FC, FormEvent, ReactNode, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AsyncCreatableSelect from 'react-select/async-creatable'
import countries from 'i18n-iso-countries'
import english from 'i18n-iso-countries/langs/en.json'

import { EnvironmentConfig } from '~/config'
import { UserProfile } from '~/libs/core'
import { autoCompleteSkills } from '~/libs/shared'
import { Button } from '~/libs/ui'

import { applyToGig } from '../gigs.service'
import {
    applicationPayload,
    gigDuration,
    gigField,
    GIGS_PATH,
    validateApplication,
} from '../gigs.utils'
import { ApplicationErrors, ApplicationValues, Candidate, Gig } from '../models'

import { GigPolicy, GigState } from './GigShared'

countries.registerLocale(english)
const countryNames = Object.values(countries.getNames('en'))
    .sort()
const referralSources = [
    'Google',
    'LinkedIn',
    'Other Ad or Promotion',
    'Quora',
    'Referral',
    'Topcoder Newsletter',
    'Uprisor Podcast',
    'YouTube or Video Ad',
]

/** Labels one application control and connects its validation message to that control. */
const Field: FC<{ name: string; label: string; error?: string; children: ReactNode }> = props => (
    <div className='gigs-field'>
        <label htmlFor={`gig-${props.name}`}>{props.label}</label>
        {props.children}
        {props.error && (
            <p className='gigs-error' id={`gig-${props.name}-error`}>
                {props.error}
            </p>
        )}
    </div>
)

/** Prefills a member's application, validates the legacy Recruit contract, and posts the form once per submission. */
const GigApplicationForm: FC<{ job: Gig; slug: string; profile: UserProfile; candidate?: Candidate }> = props => {
    const [values, setValues] = useState<ApplicationValues>(() => ({
        city: props.candidate?.city || props.profile.addresses?.[0]?.city || '',
        country: props.candidate?.locality || countries.getName(props.profile.homeCountryCode, 'en') || '',
        duration: '',
        email: props.profile.email || '',
        firstName: props.profile.firstName || '',
        lastName: props.profile.lastName || '',
        pay: String(props.candidate?.salary_expectation ?? ''),
        phone: props.candidate?.contact_number || props.profile.phones?.[0]?.number || '',
        referral: '',
        skills: (props.candidate?.skill || '')
            .split(',')
            .map(skill => skill.trim())
            .filter(Boolean),
        terms: false,
        timezone: '',
    }))
    const [errors, setErrors] = useState<ApplicationErrors>({})
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [policy, setPolicy] = useState<'terms' | 'employment'>()
    const resumeInput = useRef<HTMLInputElement>(null)
    const submissionLock = useRef(false)
    const placed = props.candidate?.custom_fields?.some(
        field => field.field_id === 12 && field.value === 'Placed',
    )

    /** Updates one form value and clears its obsolete validation error, retaining other user input. */
    function update<K extends keyof ApplicationValues>(name: K, value: ApplicationValues[K]): void {
        setValues(previous => ({ ...previous, [name]: value }))
        setErrors(previous => ({ ...previous, [name]: undefined }))
    }

    /** Validates on submit, focuses the first invalid control, and waits for an explicit server success. */
    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault()
        if (submissionLock.current || placed) return
        const invalid = validateApplication(values, props.candidate)
        setErrors(invalid)
        if (Object.keys(invalid).length) {
            document.getElementById(`gig-${Object.keys(invalid)[0]}`)
                ?.focus()
            return
        }

        submissionLock.current = true
        setSubmitting(true)
        setSubmitError('')
        try {
            await applyToGig(props.slug, applicationPayload(props.job, values, props.profile.handle))
            setSubmitted(true)
            window.scrollTo({ top: 0 })
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : 'Unable to submit your application. Please try again.',
            )
        } finally {
            submissionLock.current = false
            setSubmitting(false)
        }
    }

    if (placed) {
        return (
            <GigState title='One gig limit'>
                <p>
                    You are already placed on a gig and cannot apply for another. If this is an error, contact
                    <a href='mailto:talent.taas@wipro.com'>talent.taas@wipro.com</a>
                    .
                </p>
                <Link to={`${GIGS_PATH}/${props.slug}`}>Back to gig details</Link>
            </GigState>
        )
    }

    if (submitted) {
        return (
            <GigState title='Application submitted'>
                <p>We will contact you via email if it seems like a fit!</p>
                <div className='gigs-actions'>
                    <Link className='gigs-button' to={GIGS_PATH}>Go to gigs list</Link>
                </div>
            </GigState>
        )
    }

    return (
        <form className='gigs-panel gigs-application' onSubmit={submit} noValidate>
            {props.candidate && (
                <div className='gigs-notice'>
                    Review your Gig Work profile and update anything that has changed.
                </div>
            )}
            <fieldset disabled={submitting}>
                <legend>Personal information</legend>
                <p>Welcome to Topcoder Gigs! We’d like to get to know you. Fields marked * are required.</p>
                <div className='gigs-form-grid'>
                    {(
                        [
                            ['firstName', 'First name *', 'text', 'given-name'],
                            ['lastName', 'Last name *', 'text', 'family-name'],
                            ['email', 'Email *', 'email', 'email'],
                            ['phone', 'Phone including country code *', 'tel', 'tel'],
                            ['city', 'City *', 'text', 'address-level2'],
                        ] as const
                    ).map(([name, label, type, autocomplete]) => (
                        <Field key={name} name={name} label={label} error={errors[name]}>
                            <input
                                id={`gig-${name}`}
                                type={type}
                                autoComplete={autocomplete}
                                value={values[name]}
                                required
                                readOnly={
                                    ['firstName', 'lastName', 'email'].includes(name)
                                    && !!props.profile[name as keyof UserProfile]
                                }
                                aria-invalid={!!errors[name]}
                                aria-describedby={errors[name] ? `gig-${name}-error` : undefined}
                                onChange={event => update(name, event.target.value)}
                            />
                        </Field>
                    ))}
                    <Field name='country' label='Country *' error={errors.country}>
                        <select
                            id='gig-country'
                            value={values.country}
                            required
                            autoComplete='country-name'
                            aria-invalid={!!errors.country}
                            aria-describedby={errors.country ? 'gig-country-error' : undefined}
                            onChange={event => update('country', event.target.value)}
                        >
                            <option value=''>Select your country</option>
                            {values.country && !countryNames.includes(values.country) && (
                                <option>{values.country}</option>
                            )}
                            {countryNames.map(country => (
                                <option key={country}>{country}</option>
                            ))}
                        </select>
                    </Field>
                </div>
                <p className='gigs-hint'>
                    To change your account name or email,
                    {' '}
                    <a href={EnvironmentConfig.URLS.ACCOUNT_SETTINGS} target='_blank' rel='noreferrer'>
                        update your account settings
                    </a>
                    {' '}
                    and reload this page.
                </p>
            </fieldset>
            {!props.candidate && (
                <fieldset disabled={submitting}>
                    <legend>Topcoder information</legend>
                    <p>
                        Applying as
                        {' '}
                        <strong>{props.profile.handle}</strong>
                    </p>
                    <a
                        href={`${EnvironmentConfig.USER_PROFILE_URL}/${encodeURIComponent(
                            props.profile.handle,
                        )}`}
                        target='_blank'
                        rel='noreferrer'
                    >
                        View your Topcoder profile
                    </a>
                </fieldset>
            )}
            <fieldset disabled={submitting}>
                <legend>Share your weekly pay expectations</legend>
                <Field name='pay' label='Weekly pay expectation (USD) *' error={errors.pay}>
                    <input
                        id='gig-pay'
                        inputMode='numeric'
                        placeholder='e.g. 500'
                        value={values.pay}
                        required
                        aria-invalid={!!errors.pay}
                        aria-describedby={errors.pay ? 'gig-pay-error' : undefined}
                        onChange={event => update('pay', event.target.value)}
                    />
                </Field>
            </fieldset>
            <fieldset disabled={submitting}>
                <legend>Resume &amp; skills</legend>
                <p>
                    Upload your resume or CV with all of your technical skills listed. Please omit contact
                    information from your resume.
                </p>
                {props.candidate?.resume && (
                    <p>
                        Current resume:
                        {' '}
                        <a
                            href={
                                /^https?:\/\//i.test(props.candidate.resume.file_link)
                                    ? props.candidate.resume.file_link
                                    : undefined
                            }
                            target='_blank'
                            rel='noreferrer'
                        >
                            {props.candidate.resume.filename}
                        </a>
                        . Upload a file to replace it.
                    </p>
                )}
                <Field
                    name='resume'
                    label={`Resume or CV${props.candidate?.resume ? '' : ' *'}`}
                    error={errors.resume}
                >
                    <div className='gigs-upload'>
                        <input
                            id='gig-resume'
                            ref={resumeInput}
                            type='file'
                            accept='.pdf,.docx'
                            required={!props.candidate?.resume}
                            aria-invalid={!!errors.resume}
                            aria-describedby={errors.resume ? 'gig-resume-error' : 'gig-resume-hint'}
                            onChange={event => update('resume', event.target.files?.[0])}
                        />
                        <p id='gig-resume-hint'>PDF or DOCX, up to 8 MB</p>
                        {values.resume && (
                            <Button
                                secondary
                                onClick={() => {
                                    update('resume', undefined)
                                    if (resumeInput.current) resumeInput.current.value = ''
                                }}
                            >
                                Remove file
                            </Button>
                        )}
                    </div>
                </Field>
                <Field name='skills' label='Technical skills *' error={errors.skills}>
                    <AsyncCreatableSelect
                        inputId='gig-skills'
                        classNamePrefix='gigs-select'
                        isMulti
                        isDisabled={submitting}
                        value={values.skills.map(skill => ({ label: skill, value: skill }))}
                        placeholder='Type to search or add a skill'
                        cacheOptions
                        loadOptions={async (term: string) => (await autoCompleteSkills(term)).map(skill => ({
                            label: skill.name,
                            value: skill.name,
                        }))}
                        onChange={selection => update(
                            'skills',
                            selection.map(skill => skill.value),
                        )}
                        aria-invalid={!!errors.skills}
                        aria-describedby={errors.skills ? 'gig-skills-error' : undefined}
                    />
                </Field>
            </fieldset>
            <fieldset disabled={submitting}>
                <legend>Final questions</legend>
                {!props.candidate && (
                    <Field
                        name='referral'
                        label='How did you find out about Topcoder Gig Work? *'
                        error={errors.referral}
                    >
                        <select
                            id='gig-referral'
                            value={values.referral}
                            required
                            aria-invalid={!!errors.referral}
                            aria-describedby={errors.referral ? 'gig-referral-error' : undefined}
                            onChange={event => update('referral', event.target.value)}
                        >
                            <option value=''>Select an option</option>
                            {referralSources.map(source => (
                                <option key={source}>{source}</option>
                            ))}
                        </select>
                    </Field>
                )}
                {(['timezone', 'duration'] as const).map(name => (
                    <fieldset
                        key={name}
                        className='gigs-confirmation'
                        id={`gig-${name}`}
                        tabIndex={-1}
                        aria-describedby={errors[name] ? `gig-${name}-error` : undefined}
                    >
                        <legend>
                            {name === 'timezone'
                                ? `Are you able to work during the specified timezone? (${gigField(
                                    props.job,
                                    'Timezone',
                                )}) *`
                                : `Are you available for the duration of the gig? (${gigDuration(
                                    props.job,
                                )}) *`}
                        </legend>
                        <div className='gigs-radios'>
                            {['Yes', 'No'].map(answer => (
                                <label key={answer}>
                                    <input
                                        type='radio'
                                        name={name}
                                        value={answer}
                                        required
                                        checked={values[name] === answer}
                                        onChange={() => update(name, answer)}
                                    />
                                    {answer}
                                </label>
                            ))}
                        </div>
                        {errors[name] && (
                            <p className='gigs-error' id={`gig-${name}-error`}>
                                {errors[name]}
                            </p>
                        )}
                    </fieldset>
                ))}
                <div className='gigs-terms'>
                    <label htmlFor='gig-terms'>
                        <input
                            id='gig-terms'
                            type='checkbox'
                            checked={values.terms}
                            required
                            aria-invalid={!!errors.terms}
                            aria-describedby={errors.terms ? 'gig-terms-error' : undefined}
                            onChange={event => update('terms', event.target.checked)}
                        />
                        I agree to the Candidate Terms *
                    </label>
                    <Button link onClick={() => setPolicy('terms')}>
                        Read Candidate Terms
                    </Button>
                    {errors.terms && (
                        <p className='gigs-error' id='gig-terms-error'>
                            {errors.terms}
                        </p>
                    )}
                    <Button link onClick={() => setPolicy('employment')}>
                        View our Equal Employment Opportunity Policy
                    </Button>
                </div>
            </fieldset>
            {submitError && (
                <div className='gigs-error' role='alert'>
                    <p>{submitError}</p>
                    <p>
                        If the problem persists, email
                        {' '}
                        <a href='mailto:talent.taas@wipro.com'>talent.taas@wipro.com</a>
                        {' '}
                        with the gig URL.
                    </p>
                </div>
            )}
            <Button primary type='submit' disabled={submitting}>
                {submitting ? 'Processing your application…' : 'Apply to this job'}
            </Button>
            {submitting && <p role='status'>Please wait while we submit your application.</p>}
            <GigPolicy
                id={
                    policy
                        ? policy === 'terms'
                            ? '2gkc8LtNkZw6p0AExwSIcA'
                            : 'VAeo0vZ5tQFjPZlIcdt0m'
                        : undefined
                }
                title={policy === 'terms' ? 'Candidate Terms' : 'Equal Employment Opportunity Policy'}
                close={() => setPolicy(undefined)}
            />
        </form>
    )
}

export default GigApplicationForm
