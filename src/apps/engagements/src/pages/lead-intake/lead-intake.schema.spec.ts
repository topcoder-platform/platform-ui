import { leadIntakeSchema, wiproDirectLeadIntakeSchema } from './lead-intake.schema'

const wiproDirectValues = {
    accountName: 'ABC Bank',
    engagementDuration: '6 months',
    jobDescription: 'Build the product.',
    preferredStartDate: '',
    remoteWorkAccepted: 'yes',
    requiredSkills: [{ id: '1', name: 'React' }],
    resourcesRequired: 1,
    smu: 'AMR1',
    timeZoneRequirement: 'IST',
    workEmail: 'jane.doe@customer.com',
    workingHoursPerDay: 8,
    workLocationRestrictions: '',
}

describe('wiproDirectLeadIntakeSchema', () => {
    it('accepts the Wipro Direct fields without a preferred start date', async () => {
        await expect(wiproDirectLeadIntakeSchema.isValid(wiproDirectValues))
            .resolves
            .toBe(true)
    })

    it('fails the same values under the consumption schema', async () => {
        await expect(leadIntakeSchema.isValid(wiproDirectValues))
            .resolves
            .toBe(false)
    })

    it('requires an SMU from the dropdown list', async () => {
        await expect(wiproDirectLeadIntakeSchema.isValid({ ...wiproDirectValues, smu: 'APMEA' }))
            .resolves
            .toBe(false)
    })

    it('requires the mandatory fields', async () => {
        await expect(wiproDirectLeadIntakeSchema.isValid({ ...wiproDirectValues, jobDescription: ' ' }))
            .resolves
            .toBe(false)
        await expect(wiproDirectLeadIntakeSchema.isValid({ ...wiproDirectValues, requiredSkills: [] }))
            .resolves
            .toBe(false)
    })
})

const consumptionValues = {
    ...wiproDirectValues,
    maximumCost: 'USD 100/hour',
    minYearsExperience: 3,
    preferredStartDate: '2026-12-01',
    requiredSkills: [{ id: 'Custom Framework', name: 'Custom Framework' }],
    roleTitle: 'QA Engineer',
}

describe('leadIntakeSchema', () => {
    it('accepts the consumption fields without an engagement model or bill rate', async () => {
        await expect(leadIntakeSchema.isValid(consumptionValues))
            .resolves
            .toBe(true)
    })

    it('requires the maximum cost', async () => {
        await expect(leadIntakeSchema.isValid({ ...consumptionValues, maximumCost: ' ' }))
            .resolves
            .toBe(false)
    })

    it('requires the remote work checkbox to be checked', async () => {
        await expect(leadIntakeSchema.isValid({ ...consumptionValues, remoteWorkAccepted: '' }))
            .resolves
            .toBe(false)
    })
})
