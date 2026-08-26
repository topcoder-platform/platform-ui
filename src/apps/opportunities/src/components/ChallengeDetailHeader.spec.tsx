/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, RenderResult, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ChallengeOpportunity } from '../models'

import { ChallengeDetailHeader } from './ChallengeDetailHeader'

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        IconOutline: new Proxy({}, {
            get: () => Icon,
        }),
    }
}, { virtual: true })

/** Creates an active, overlapping registration/submission challenge fixture. */
function challengeFixture(overrides: Partial<ChallengeOpportunity> = {}): ChallengeOpportunity {
    return {
        currentPhase: {
            isOpen: true,
            name: 'Submission',
            scheduledEndDate: '2026-08-15T00:00:00.000Z',
        },
        currentPhaseNames: ['Registration', 'Submission'],
        id: 'challenge-id',
        name: 'Figma challenge',
        phases: [
            { isOpen: true, name: 'Registration' },
            { isOpen: true, name: 'Submission', scheduledEndDate: '2026-08-15T00:00:00.000Z' },
        ],
        prizeSets: [{
            prizes: Array.from({ length: 10 }, (_, index) => ({ type: 'USD', value: 1000 - (index * 50) })),
            type: 'PLACEMENT',
        }],
        skills: [{ name: 'Algorithms' }, { name: 'Probability' }],
        status: 'ACTIVE',
        track: { name: 'Data Science', track: 'DATA_SCIENCE' },
        type: { name: 'Marathon Match' },
        ...overrides,
    }
}

describe('ChallengeDetailHeader actions and presentation', () => {
    beforeEach(() => {
        jest.spyOn(Date, 'now')
            .mockReturnValue(Date.parse('2026-08-14T00:00:00.000Z'))
    })

    afterEach(() => jest.restoreAllMocks())

    it('shows only Register for an unregistered open challenge', () => {
        render(
            <MemoryRouter>
                <ChallengeDetailHeader
                    busy={false}
                    challenge={challengeFixture()}
                    isRegistered={false}
                    onRegister={jest.fn()}
                    onSubmit={jest.fn()}
                    onUnregister={jest.fn()}
                />
            </MemoryRouter>,
        )

        expect(screen.getByRole('button', { name: 'Register' }))
            .toBeEnabled()
        expect(screen.queryByText('Unregister'))
            .not.toBeInTheDocument()
        expect(screen.queryByText('Submit a solution'))
            .not.toBeInTheDocument()
    })

    it('shows enabled member actions only while their phases are open', () => {
        const onSubmit = jest.fn()
        const { rerender }: RenderResult = render(
            <MemoryRouter>
                <ChallengeDetailHeader
                    busy={false}
                    challenge={challengeFixture()}
                    isRegistered
                    onRegister={jest.fn()}
                    onSubmit={onSubmit}
                    onUnregister={jest.fn()}
                />
            </MemoryRouter>,
        )

        expect(screen.getByRole('button', { name: 'Unregister' }))
            .toBeEnabled()
        const submit = screen.getByRole('button', { name: 'Submit a solution' })
        expect(submit)
            .toBeEnabled()
        submit.click()
        expect(onSubmit)
            .toHaveBeenCalledTimes(1)

        rerender(
            <MemoryRouter>
                <ChallengeDetailHeader
                    busy={false}
                    challenge={challengeFixture({
                        currentPhaseNames: [],
                        phases: [{ isOpen: false, name: 'Registration' }],
                        status: 'COMPLETED',
                    })}
                    isRegistered
                    onRegister={jest.fn()}
                    onSubmit={jest.fn()}
                    onUnregister={jest.fn()}
                />
            </MemoryRouter>,
        )
        expect(screen.getByRole('button', { name: 'Unregister' }))
            .toBeDisabled()
        expect(screen.getByRole('button', { name: 'Submit a solution' }))
            .toBeDisabled()
    })

    it('avoids flashing Register while member registration is unresolved', () => {
        render(
            <MemoryRouter>
                <ChallengeDetailHeader
                    busy={false}
                    challenge={challengeFixture()}
                    isRegistered={false}
                    onRegister={jest.fn()}
                    onSubmit={jest.fn()}
                    onUnregister={jest.fn()}
                    registrationLoading
                />
            </MemoryRouter>,
        )

        expect(screen.getByRole('button', { name: 'Checking registration…' }))
            .toBeDisabled()
        expect(screen.queryByRole('button', { name: 'Register' }))
            .not.toBeInTheDocument()
    })

    it('uses the exact Data Science header color and all ten placement prizes', () => {
        render(
            <MemoryRouter>
                <ChallengeDetailHeader
                    busy={false}
                    challenge={challengeFixture()}
                    isRegistered
                    onRegister={jest.fn()}
                    onSubmit={jest.fn()}
                    onUnregister={jest.fn()}
                />
            </MemoryRouter>,
        )

        expect(screen.getByText('Data Science').className)
            .toContain('dataScienceTrack')
        expect(screen.getAllByAltText(/place$/))
            .toHaveLength(10)
        expect(screen.getByAltText('10 place'))
            .toBeInTheDocument()
    })
})
