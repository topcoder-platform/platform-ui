import type { ApplicationFormData } from './application-form.types'
import { applicationFormSchema } from './application-form.schema'
import { buildAvailabilityText, buildReferralSourceText } from './application-form.constants'

const validValues: ApplicationFormData = {
    availableFullTime: 'no',
    availableWithinWeek: 'yes',
    cvFileUrl: 'https://cdn.filestackcontent.com/cv-handle',
    expectedPayRate: '$50/hour',
    mobileNumber: '+1 555 123 4567',
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

    it('requires an uploaded CV', async () => {
        await expect(applicationFormSchema.isValid({ ...validValues, cvFileUrl: undefined }))
            .resolves
            .toBe(false)
    })

    it('requires both availability answers', async () => {
        await expect(applicationFormSchema.isValid({ ...validValues, availableWithinWeek: undefined }))
            .resolves
            .toBe(false)
        await expect(applicationFormSchema.isValid({ ...validValues, availableFullTime: undefined }))
            .resolves
            .toBe(false)
    })

    it('only accepts referral sources from the list', async () => {
        await expect(applicationFormSchema.isValid({ ...validValues, referralSource: 'LinkedIn' }))
            .resolves
            .toBe(true)
        await expect(applicationFormSchema.isValid({ ...validValues, referralSource: 'Somewhere else' }))
            .resolves
            .toBe(false)
    })

    it('requires the referrer handle for referrals', async () => {
        await expect(applicationFormSchema.isValid({ ...validValues, referralSource: 'Referred by' }))
            .resolves
            .toBe(false)
        await expect(applicationFormSchema.isValid({
            ...validValues,
            referralSource: 'Referred by',
            referrerHandle: 'jdoe',
        }))
            .resolves
            .toBe(true)
    })
})

describe('application form text builders', () => {
    it('builds the availability text from both answers', () => {
        expect(buildAvailabilityText('yes', 'no'))
            .toBe('Available to start within a week: Yes\nAvailable to work full-time (~8 hours/day): No')
        expect(buildAvailabilityText())
            .toBeUndefined()
    })

    it('appends the referrer handle only for referrals', () => {
        expect(buildReferralSourceText('Referred by', ' jdoe '))
            .toBe('Referred by jdoe')
        expect(buildReferralSourceText('LinkedIn', 'jdoe'))
            .toBe('LinkedIn')
        expect(buildReferralSourceText(''))
            .toBeUndefined()
    })
})
