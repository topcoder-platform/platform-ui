import { EnvironmentConfig } from '~/config'

import { ApplicationErrors, ApplicationValues, Candidate, Gig } from './models'

export const GIGS_PER_PAGE = 10
export const MAX_RESUME_BYTES = 8000000
export const GIGS_PATH = '/gigs'

/** Reads a named Recruit field from a job; returns display text or the supplied fallback. Does not throw. */
export function gigField(job: Gig, name: string, fallback: string = 'n/a'): string {
    const value = job.custom_fields?.find(field => field.field_name === name)?.value
    return value === null || value === undefined || value === '' || value === false ? fallback : String(value)
}

/** Reads a checkbox field from a job without treating the string "false" as checked. Does not throw. */
export function gigFlag(job: Gig, name: string): boolean {
    return ['true', '1', 'yes'].includes(gigField(job, name, '')
        .toLowerCase())
}

/** Returns whether a job accepts applications, including status-only responses for fulfilled gigs. */
export function isOpenGig(job: Gig): boolean {
    return job.job_status?.id === 1 && job.enable_job_application_form === 1
}

/** Formats duration, preserving authored text and adding weeks to bare numbers. */
export function gigDuration(job: Gig): string {
    const duration = gigField(job, 'Duration')
    return /^\d+$/.test(duration) ? `${duration} Weeks` : duration
}

/** Returns trimmed technology names from the public job response for cards and details. */
export function gigSkills(job: Gig): string[] {
    return gigField(job, 'Technologies Required', '')
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean)
}

/** Formats Recruit's salary range and period; missing amounts remain unspecified, while zero is preserved. */
export function gigCompensation(job: Gig): string {
    const periods = ['n/a', 'monthly', 'annual', 'week', 'daily', 'hourly']
    const period
        = typeof job.salary_type === 'object' && job.salary_type ? periods[job.salary_type.id] || 'n/a' : 'n/a'
    const minimum = job.min_annual_salary
    const maximum = job.max_annual_salary
    if (minimum === null || minimum === undefined || maximum === null || maximum === undefined) return 'Not specified'
    const format = (value: number): string => value.toLocaleString('en-US')
    return `$${format(minimum)}${minimum === maximum ? '' : ` – $${format(maximum)}`} (USD) / ${period}`
}

/** Filters open jobs by search/location and sorts featured jobs first, returning a new array. */
export function filterGigs(jobs: Gig[], search: string, location: string, sort: string): Gig[] {
    const term = search.trim()
        .toLowerCase()
    return jobs
        .filter(isOpenGig)
        .filter(
            job => (!location || (job.country || '').trim()
                .toLowerCase() === location.toLowerCase())
                && (!term
                    || [
                        job.name,
                        job.country,
                        gigField(job, 'Technologies Required'),
                        gigField(job, 'Duration'),
                    ].some(value => (value || '').toLowerCase()
                        .includes(term))),
        )
        .sort((a, b) => {
            const featured = Number(gigFlag(b, 'Featured')) - Number(gigFlag(a, 'Featured'))
            const key = sort === 'updated_on' ? 'updated_on' : 'created_on'
            return featured || (Date.parse(b[key] || '') || 0) - (Date.parse(a[key] || '') || 0)
        })
}

/** Validates application values against the legacy contract and the server's 8,000,000-byte upload limit. */
export function validateApplication(values: ApplicationValues, candidate?: Candidate): ApplicationErrors {
    const errors: ApplicationErrors = {}
    const fields = ['firstName', 'lastName', 'email', 'city', 'phone'] as const
    fields.forEach(field => {
        const value = values[field].trim()
        const max = ['city', 'phone'].includes(field) ? 50 : 40
        if (value.length < 2) errors[field] = 'Enter at least 2 characters.'
        else if (value.length > max) errors[field] = `Enter no more than ${max} characters.`
    })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.'
    if (!values.country) errors.country = 'Select your country.'
    if (!/^\d+$/.test(values.pay.trim())) {
        errors.pay = 'Enter your weekly pay expectation as a whole dollar amount.'
    }

    if (!values.skills.length) errors.skills = 'Add at least one technical skill.'
    else if (values.skills.join(',').length >= 100) {
        errors.skills = 'Keep the combined skill names under 100 characters.'
    }

    if (!candidate && !values.referral) {
        errors.referral = 'Select how you heard about Gig Work.'
    }

    if (values.timezone !== 'Yes') errors.timezone = 'You must be able to work the specified hours.'
    if (values.duration !== 'Yes') errors.duration = 'You must be available for the full duration.'
    if (!values.terms) errors.terms = 'Accept the Candidate Terms to apply.'
    if (!values.resume && !candidate?.resume) errors.resume = 'Upload your resume or CV.'
    if (values.resume && !/\.(pdf|docx)$/i.test(values.resume.name)) {
        errors.resume = 'Only PDF and DOCX files are allowed.'
    }

    if (values.resume && values.resume.size > MAX_RESUME_BYTES) errors.resume = 'The maximum file size is 8 MB.'
    return errors
}

/** Maps a validated form and authenticated handle to Recruit CRM's multipart contract; returns FormData. */
export function applicationPayload(job: Gig, values: ApplicationValues, handle: string): FormData {
    const fields = [
        { field_id: 1, value: `${EnvironmentConfig.USER_PROFILE_URL}/${encodeURIComponent(handle)}` },
        { field_id: 2, value: handle },
        {
            field_id: 14,
            value: [
                `${job.name} ->`,
                `Pay Expectation: ${values.pay.trim()}`,
                `Able to work during timezone? ${gigField(job, 'Timezone')}`,
                `Am I ok to work the duration? ${gigField(job, 'Duration')}`,
            ].join(','),
        },
    ]
    if (values.referral) fields.push({ field_id: 13, value: values.referral })
    const data = new FormData()
    if (values.resume) data.append('resume', values.resume)
    data.append(
        'form',
        JSON.stringify({
            city: values.city.trim(),
            contact_number: values.phone.trim(),
            custom_fields: fields,
            email: values.email.trim(),
            first_name: values.firstName.trim(),
            last_name: values.lastName.trim(),
            locality: values.country,
            salary_expectation: values.pay.trim(),
            skill: values.skills.join(','),
        }),
    )
    return data
}
