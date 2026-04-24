import { Challenge } from '../models'

import { resolveManualUploadSubmissionType } from './challenge'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        ADMIN: {},
    },
}), { virtual: true })

describe('challenge utils', () => {
    describe('resolveManualUploadSubmissionType', () => {
        it('returns checkpoint submission when checkpoint screening is open', () => {
            const challenge = {
                phases: [
                    {
                        isOpen: true,
                        name: 'Checkpoint Screening',
                        scheduledEndDate: '2026-04-15T00:00:00.000Z',
                    },
                ],
            } as Challenge

            expect(resolveManualUploadSubmissionType(challenge))
                .toBe('CHECKPOINT_SUBMISSION')
        })

        it('returns checkpoint submission when checkpoint review is open', () => {
            const challenge = {
                phases: [
                    {
                        isOpen: true,
                        name: 'Checkpoint Review',
                        scheduledEndDate: '2026-04-15T00:00:00.000Z',
                    },
                ],
            } as Challenge

            expect(resolveManualUploadSubmissionType(challenge))
                .toBe('CHECKPOINT_SUBMISSION')
        })

        it('returns contest submission when checkpoint phases are closed', () => {
            const challenge = {
                phases: [
                    {
                        isOpen: false,
                        name: 'Checkpoint Screening',
                        scheduledEndDate: '2026-04-15T00:00:00.000Z',
                    },
                    {
                        isOpen: true,
                        name: 'Screening',
                        scheduledEndDate: '2026-04-15T00:00:00.000Z',
                    },
                ],
            } as Challenge

            expect(resolveManualUploadSubmissionType(challenge))
                .toBe('CONTEST_SUBMISSION')
        })
    })
})
