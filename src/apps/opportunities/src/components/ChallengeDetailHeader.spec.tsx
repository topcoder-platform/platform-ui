/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, RenderResult, screen, within } from '@testing-library/react'
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

        const register = screen.getByRole('button', { name: 'Register' })
        expect(register)
            .toBeEnabled()
        expect(register.className)
            .toContain('secondary')
        expect(screen.getByText(/phase closes in/))
            .toHaveClass('phaseQualifier')
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
        const renderResult: RenderResult = render(
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
        expect(screen.getByRole('group', { name: 'Additional placement prizes' }))
            .toContainElement(screen.getByAltText('4 place'))
        const rings: HTMLDivElement | null = renderResult.container.querySelector('.rings')
        expect(rings?.children)
            .toHaveLength(3)
        expect(rings?.querySelector('.ringOuter'))
            .toBeInTheDocument()
        expect(rings?.querySelector('.ringMiddle'))
            .toBeInTheDocument()
        expect(rings?.querySelector('.ringInner'))
            .toBeInTheDocument()
    })

    it('keeps the fourth and fifth placement prizes visible without collapsing them into overflow UI', () => {
        render(
            <MemoryRouter>
                <ChallengeDetailHeader
                    busy={false}
                    challenge={challengeFixture({
                        prizeSets: [{
                            prizes: Array.from({ length: 5 }, (_value, index) => ({
                                type: 'USD',
                                value: 1000 - (index * 100),
                            })),
                            type: 'PLACEMENT',
                        }],
                    })}
                    isRegistered
                    onRegister={jest.fn()}
                    onSubmit={jest.fn()}
                    onUnregister={jest.fn()}
                />
            </MemoryRouter>,
        )

        const additionalPrizes = screen.getByRole('group', { name: 'Additional placement prizes' })
        expect(within(additionalPrizes)
            .getByAltText('4 place'))
            .toBeInTheDocument()
        expect(within(additionalPrizes)
            .getByAltText('5 place'))
            .toBeInTheDocument()
        expect(within(additionalPrizes)
            .getAllByRole('img'))
            .toHaveLength(2)
    })

    it('replaces detail prizes with the leaderboard label for fun challenges', () => {
        render(
            <MemoryRouter>
                <ChallengeDetailHeader
                    busy={false}
                    challenge={challengeFixture({ funChallenge: true })}
                    isRegistered={false}
                    onRegister={jest.fn()}
                    onSubmit={jest.fn()}
                    onUnregister={jest.fn()}
                />
            </MemoryRouter>,
        )

        expect(screen.getByText('No individual prize - leaderboard scoring'))
            .toBeInTheDocument()
        expect(screen.queryByAltText('1 place'))
            .not.toBeInTheDocument()
        expect(screen.queryByText('Prize details coming soon'))
            .not.toBeInTheDocument()
    })

    it('uses the compact featured prize layout for long point labels', () => {
        render(
            <MemoryRouter>
                <ChallengeDetailHeader
                    busy={false}
                    challenge={challengeFixture({
                        prizeSets: [{
                            prizes: [
                                { type: 'POINT', value: 1200 },
                                { type: 'POINT', value: 600 },
                                { type: 'POINT', value: 400 },
                            ],
                            type: 'PLACEMENT',
                        }],
                    })}
                    isRegistered={false}
                    onRegister={jest.fn()}
                    onSubmit={jest.fn()}
                    onUnregister={jest.fn()}
                />
            </MemoryRouter>,
        )

        expect(screen.getByText('1,200 pts').className)
            .toContain('compactPrize')
        expect(screen.getByText('1,200 pts')
            .parentElement?.className)
            .toContain('compactFeaturedPrizes')
    })

    it('renders the Figma phase rail with date rows and challenge-end Winners milestone', () => {
        const challengeEnd = '2999-08-20T12:30:00.000Z'
        render(
            <MemoryRouter>
                <ChallengeDetailHeader
                    busy={false}
                    challenge={challengeFixture({
                        endDate: challengeEnd,
                        phases: [
                            {
                                actualEndDate: '2026-08-15T00:00:00.000Z',
                                actualStartDate: '2026-08-10T00:00:00.000Z',
                                id: 'registration',
                                isOpen: true,
                                name: 'Registration',
                            },
                            {
                                id: 'submission',
                                isOpen: true,
                                name: 'Submission',
                                scheduledEndDate: '2026-08-15T00:00:00.000Z',
                                scheduledStartDate: '2026-08-10T00:00:00.000Z',
                            },
                        ],
                        startDate: '2026-08-10T00:00:00.000Z',
                    })}
                    isRegistered
                    onRegister={jest.fn()}
                    onSubmit={jest.fn()}
                    onUnregister={jest.fn()}
                />
            </MemoryRouter>,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Show full timeline' }))
        const timeline = screen.getByRole('region', { name: 'Challenge timeline' })
        const items = within(timeline)
            .getAllByRole('listitem')
        expect(items)
            .toHaveLength(4)
        expect(within(timeline)
            .getByText('Launch'))
            .toBeInTheDocument()

        const registration = within(timeline)
            .getByText('Registration')
            .closest('li') as HTMLLIElement
        expect(registration)
            .toHaveAttribute('data-state', 'current')
        expect(registration.querySelectorAll('time'))
            .toHaveLength(2)

        const winners = within(timeline)
            .getByText('Winners')
            .closest('li') as HTMLLIElement
        expect(winners)
            .toHaveAttribute('data-state', 'upcoming')
        expect(winners.querySelector('time'))
            .toHaveAttribute('datetime', challengeEnd)
        expect(timeline.querySelectorAll('img'))
            .toHaveLength(4)
        expect(timeline.querySelectorAll('[data-state="current"]'))
            .toHaveLength(6)
        expect(within(timeline)
            .getByText(/^Time zone:/))
            .toBeInTheDocument()
    })

    it('sorts expanded timeline phases chronologically and uses the short hide label', () => {
        render(
            <MemoryRouter>
                <ChallengeDetailHeader
                    busy={false}
                    challenge={challengeFixture({
                        endDate: '2026-08-20T12:30:00.000Z',
                        phases: [
                            {
                                actualEndDate: '2026-08-10T00:29:00.000Z',
                                actualStartDate: '2026-08-10T00:12:00.000Z',
                                id: 'checkpoint-submission',
                                name: 'Checkpoint Submission',
                            },
                            {
                                actualEndDate: '2026-08-10T00:40:00.000Z',
                                actualStartDate: '2026-08-10T00:00:00.000Z',
                                id: 'registration',
                                name: 'Registration',
                            },
                            {
                                actualEndDate: '2026-08-10T00:35:00.000Z',
                                actualStartDate: '2026-08-10T00:30:00.000Z',
                                id: 'submission',
                                name: 'Submission',
                            },
                        ],
                        startDate: '2026-08-10T00:00:00.000Z',
                    })}
                    isRegistered
                    onRegister={jest.fn()}
                    onSubmit={jest.fn()}
                    onUnregister={jest.fn()}
                />
            </MemoryRouter>,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Show full timeline' }))
        expect(screen.getByRole('button', { name: 'Hide timeline' }))
            .toBeInTheDocument()

        const itemLabels = within(screen.getByRole('region', { name: 'Challenge timeline' }))
            .getAllByRole('listitem')
            .map(item => item.querySelector('strong')?.textContent)
        expect(itemLabels)
            .toEqual(['Launch', 'Registration', 'Checkpoint Submission', 'Submission', 'Winners'])
    })
})
