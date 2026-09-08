/* eslint-disable sort-keys */
import { applicationPayload, filterGigs, gigCompensation, validateApplication } from './gigs.utils'
import { ApplicationValues, Gig } from './models'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        TC_DOMAIN: 'topcoder-dev.com',
        USER_PROFILE_URL: 'https://profiles.topcoder-dev.com',
    },
}), { virtual: true })

const job: Gig = {
    slug: 'test-open-gig',
    name: 'Java engineer',
    country: 'Australia',
    job_status: { id: 1 },
    enable_job_application_form: 1,
    created_on: '2026-09-01',
    updated_on: '2026-09-02',
    custom_fields: [
        { field_id: 1, field_name: 'Duration', value: '12' },
        { field_id: 2, field_name: 'Technologies Required', value: 'Java,React' },
        { field_id: 4, field_name: 'Timezone', value: 'AEST' },
    ],
}
const valid: ApplicationValues = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '+61 400 000 000',
    city: 'Hobart',
    country: 'Australia',
    pay: '500',
    skills: ['Java'],
    referral: 'LinkedIn',
    timezone: 'Yes',
    duration: 'Yes',
    terms: true,
    resume: new File(['resume'], 'resume.pdf'),
}

describe('Gigs discovery and application contracts', () => {
    it('filters skills, countries and durations without mutating or exposing closed jobs', () => {
        const jobs = [job, { ...job, slug: 'closed', job_status: { id: 2 } }]
        expect(filterGigs(jobs, 'react', 'Australia', 'created_on'))
            .toEqual([job])
        expect(filterGigs(jobs, '12', '', 'created_on'))
            .toEqual([job])
        expect(filterGigs(jobs, '', 'Canada', 'created_on'))
            .toEqual([])
        expect(jobs)
            .toHaveLength(2)
    })
    it('keeps featured gigs first and sorts within each group by the selected timestamp', () => {
        const featured = {
            ...job,
            slug: 'featured',
            created_on: '2020-01-01',
            custom_fields: [{ field_id: 16, field_name: 'Featured', value: true }],
        }
        const newest = { ...job, slug: 'newest', created_on: '2026-09-05' }
        const updated = {
            ...job,
            slug: 'updated',
            updated_on: '2026-09-06',
            custom_fields: [{ field_id: 16, field_name: 'Featured', value: 'false' }],
        }
        expect(
            filterGigs([newest, updated, featured], '', '', 'updated_on')
                .map(gig => gig.slug),
        )
            .toEqual(['featured', 'updated', 'newest'])
    })
    it('handles missing salary metadata and preserves zero and fixed compensation', () => {
        expect(gigCompensation(job))
            .toBe('Not specified')
        expect(gigCompensation({ ...job, min_annual_salary: 0, max_annual_salary: 0 }))
            .toBe(
                '$0 (USD) / n/a',
            )
        expect(
            gigCompensation({
                ...job,
                min_annual_salary: 500,
                max_annual_salary: 500,
                salary_type: { id: 3 },
            }),
        )
            .toBe('$500 (USD) / week')
    })
    it('requires affirmative availability, consent and a valid resume before applying', () => {
        expect(validateApplication(valid))
            .toEqual({})
        expect(
            validateApplication({
                ...valid,
                timezone: 'No',
                duration: 'No',
                terms: false,
                resume: undefined,
            }),
        )
            .toEqual(
                expect.objectContaining({
                    timezone: expect.any(String),
                    duration: expect.any(String),
                    terms: expect.any(String),
                    resume: expect.any(String),
                }),
            )
        expect(
            validateApplication({
                ...valid,
                pay: '5.5',
                skills: ['a'.repeat(100)],
                resume: new File(['x'], 'cv.exe'),
            }),
        )
            .toEqual(
                expect.objectContaining({
                    pay: expect.any(String),
                    skills: expect.any(String),
                    resume: expect.any(String),
                }),
            )
        const oversized = new File(['x'], 'cv.pdf')
        Object.defineProperty(oversized, 'size', { value: 8000001 })
        expect(validateApplication({ ...valid, resume: oversized }).resume)
            .toBe(
                'The maximum file size is 8 MB.',
            )
    })
    it('reuses a saved resume but requires one if the existing candidate has no resume', () => {
        expect(
            validateApplication(
                { ...valid, referral: '', resume: undefined },
                { resume: { filename: 'cv.pdf', file_link: 'https://example.com/cv.pdf' } },
            ).resume,
        )
            .toBeUndefined()
        expect(validateApplication({ ...valid, resume: undefined }, {}).resume)
            .toBeDefined()
    })
    it('sends the original multipart field IDs and omits the resume when reusing the saved one', () => {
        const payload = applicationPayload(job, valid, 'member name')
        const form = JSON.parse(payload.get('form') as string)
        expect(payload.get('resume'))
            .toBe(valid.resume)
        expect(form)
            .toEqual(
                expect.objectContaining({
                    first_name: 'Jane',
                    last_name: 'Doe',
                    locality: 'Australia',
                    salary_expectation: '500',
                    skill: 'Java',
                }),
            )
        expect(form.custom_fields)
            .toEqual([
                { field_id: 1, value: 'https://profiles.topcoder-dev.com/member%20name' },
                { field_id: 2, value: 'member name' },
                {
                    field_id: 14,
                    value: 'Java engineer ->,Pay Expectation: 500,Able to work during timezone? AEST,'
                    + 'Am I ok to work the duration? 12',
                },
                { field_id: 13, value: 'LinkedIn' },
            ])
        expect(
            applicationPayload(job, { ...valid, resume: undefined }, 'member')
                .has('resume'),
        )
            .toBe(false)
    })
})
