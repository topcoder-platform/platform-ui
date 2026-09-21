import { showcasePostSchema } from './showcase-post.schema'

describe('Showcase metadata validation', () => {
    const valid = {
        categoryIds: ['1'],
        content: 'The solution',
        customer: 'Customer',
        dealCloseDate: '2024-02-29',
        industryIds: ['1'],
        smu: 'Europe',
        title: 'Title',
        type: 'Open Innovation',
    }

    it('requires showcase metadata and accepts a real leap day', async () => {
        await expect(showcasePostSchema.isValid(valid)).resolves.toBe(true)
        for (const field of ['customer', 'dealCloseDate', 'smu', 'type']) {
            // eslint-disable-next-line no-await-in-loop
            await expect(showcasePostSchema.isValid({ ...valid, [field]: '' })).resolves.toBe(false)
        }
    })

    it('requires the custom SMU only when Others is selected', async () => {
        await expect(showcasePostSchema.isValid({ ...valid, smu: 'Others' })).resolves.toBe(false)
        await expect(showcasePostSchema.isValid({ ...valid, smu: 'Others', smuOther: 'Custom' })).resolves.toBe(true)
    })

    it.each(['2026-02-29', '2026-04-31', 'not a date'])('rejects the invalid calendar date %s', async dealCloseDate => {
        await expect(showcasePostSchema.isValid({ ...valid, dealCloseDate })).resolves.toBe(false)
    })

})
