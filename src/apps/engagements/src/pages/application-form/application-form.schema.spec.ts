import type { ApplicationFormData } from './application-form.types'
import { applicationFormSchema } from './application-form.schema'

const validValues: ApplicationFormData = {
    coverLetter: 'I am excited to apply.',
    expectedPayRate: '$50/hour',
    mobileNumber: '+1 555 123 4567',
    portfolioUrls: [{ value: 'https://portfolio.example.com' }],
}

describe('applicationFormSchema', () => {
    it('accepts a valid application without a referral source', async () => {
        await expect(applicationFormSchema.isValid(validValues))
            .resolves
            .toBe(true)
    })

    it('requires an expected pay rate', async () => {
        await expect(applicationFormSchema.isValid({ ...validValues, expectedPayRate: '   ' }))
            .resolves
            .toBe(false)
    })

    it('requires at least one non-empty portfolio URL', async () => {
        await expect(applicationFormSchema.isValid({ ...validValues, portfolioUrls: [] }))
            .resolves
            .toBe(false)
        await expect(applicationFormSchema.isValid({ ...validValues, portfolioUrls: [{ value: undefined }] }))
            .resolves
            .toBe(false)
    })
})
