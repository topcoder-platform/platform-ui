/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetAsync } from '~/libs/core'

import { fetchApplications } from './applications.service'

jest.mock('~/libs/core', () => ({
    xhrGetAsync: jest.fn(),
    xhrPatchAsync: jest.fn(),
}), {
    virtual: true,
})
jest.mock('../constants', () => ({
    APPLICATIONS_API_URL: 'https://example.com/applications',
    ENGAGEMENTS_ROOT_API_URL: 'https://example.com/engagements',
}))

describe('fetchApplications', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('maps application address values from the engagements API response', async () => {
        const mockedGet = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>

        mockedGet.mockResolvedValue([
            {
                address: 'Address121, Osaka',
                availability: 'Immediate availability',
                createdAt: '2026-03-31T15:39:00.000Z',
                email: 'topcodergh+testaws1@gmail.com',
                engagementId: 'engagement-1',
                handle: 'testaws1',
                id: 'application-1',
                name: 'Testaws test',
                status: 'SUBMITTED',
                userId: '12345',
                yearsOfExperience: 15,
            },
        ] as never)

        await expect(fetchApplications('engagement-1'))
            .resolves
            .toEqual([
                expect.objectContaining({
                    address: 'Address121, Osaka',
                    handle: 'testaws1',
                    id: 'application-1',
                }),
            ])
    })

    it('maps the uploaded CV file URL and the resume/profile link separately', async () => {
        const mockedGet = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>

        mockedGet.mockResolvedValue([
            {
                cvFileUrl: ' https://cdn.filestackcontent.com/cv-handle ',
                id: 'application-1',
                resumeUrl: 'https://www.linkedin.com/in/testaws1',
            },
            {
                cvFileUrl: '',
                id: 'application-2',
            },
        ] as never)

        await expect(fetchApplications('engagement-1'))
            .resolves
            .toEqual([
                expect.objectContaining({
                    cvFileUrl: 'https://cdn.filestackcontent.com/cv-handle',
                    id: 'application-1',
                    resumeUrl: 'https://www.linkedin.com/in/testaws1',
                }),
                expect.objectContaining({
                    cvFileUrl: undefined,
                    id: 'application-2',
                }),
            ])
    })
})
