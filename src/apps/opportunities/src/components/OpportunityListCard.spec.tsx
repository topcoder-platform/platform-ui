/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import {
    ChallengeOpportunity,
    CopilotOpportunity,
    EngagementOpportunity,
    ReviewOpportunity,
} from '../models'

import { OpportunityListCard } from './OpportunityListCard'

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        IconOutline: new Proxy({}, {
            get: () => Icon,
        }),
    }
}, { virtual: true })

/**
 * Creates a complete competition-card fixture with an open registration and submission phase.
 *
 * @param overrides Challenge API fields replaced for the current test.
 * @returns Challenge API item suitable for rendering a competition card.
 * @throws Does not throw.
 */
function competitionFixture(overrides: Partial<ChallengeOpportunity> = {}): ChallengeOpportunity {
    const currentPhase = {
        actualStartDate: '2026-08-14T00:00:00.000Z',
        isOpen: true,
        name: 'Submission',
        scheduledEndDate: '2026-08-14T01:00:00.000Z',
    }
    return {
        currentPhase,
        currentPhaseNames: ['Registration', 'Submission'],
        description: 'This description is intentionally absent from the Figma competition card.',
        id: 'challenge-id',
        name: 'Topcoder Opportunities Challenge',
        numOfRegistrants: 53,
        numOfSubmissions: 15,
        phases: [
            {
                isOpen: true,
                name: 'Registration',
                scheduledEndDate: '2026-08-14T01:00:00.000Z',
                scheduledStartDate: '2026-08-13T00:00:00.000Z',
            },
            currentPhase,
        ],
        prizeSets: [{
            prizes: [{ value: 1000 }, { value: 500 }, { value: 150 }, { value: 50 }],
            type: 'PLACEMENT',
        }],
        skills: [{ name: 'Figma' }, { name: 'User Experience Design' }],
        status: 'ACTIVE',
        track: { name: 'Design', track: 'DESIGN' },
        type: { name: 'First2Finish' },
        ...overrides,
    }
}

describe('OpportunityListCard competition presentation', () => {
    beforeEach(() => {
        jest.spyOn(Date, 'now')
            .mockReturnValue(Date.parse('2026-08-14T00:30:00.000Z'))
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('renders placement prizes, accurate registration state, and current phase progress', () => {
        render(
            <MemoryRouter>
                <OpportunityListCard item={competitionFixture()} kind='competitions' />
            </MemoryRouter>,
        )

        expect(screen.getByRole('link', { name: /Topcoder Opportunities Challenge/ }))
            .toHaveAttribute('href', '/opportunities/challenge/challenge-id')
        expect(screen.getByText('First 2 Finish')
            .querySelector('svg'))
            .toBeInTheDocument()
        expect(screen.getByText('Open for registration')
            .querySelector('svg'))
            .toBeInTheDocument()

        const prizes = screen.getByLabelText('Placement prizes')
        expect(within(prizes)
            .getByText('$1000'))
            .toBeInTheDocument()
        expect(within(prizes)
            .getByText('$500'))
            .toBeInTheDocument()
        expect(within(prizes)
            .getByText('$150'))
            .toBeInTheDocument()
        expect(within(prizes)
            .getByText('+1'))
            .toBeInTheDocument()
        const firstMedal = within(prizes)
            .getByText('$1000')
            .previousElementSibling
        expect(firstMedal)
            .toHaveClass('medalIcon')
        expect(firstMedal?.querySelector('svg'))
            .toBeInTheDocument()
        expect(screen.queryByText('Prize:'))
            .not.toBeInTheDocument()

        expect(screen.getByText('Submission'))
            .toBeInTheDocument()
        expect(screen.getByText('30m left'))
            .toBeInTheDocument()
        expect(screen.getByRole('progressbar', { name: 'Submission phase progress' }))
            .toHaveAttribute('aria-valuenow', '50')
        expect(screen.getByText('Submissions:'))
            .toBeInTheDocument()
        expect(screen.getByText('Registrants:'))
            .toBeInTheDocument()
        expect(screen.getByText('Posts:'))
            .toBeInTheDocument()
        expect(screen.getByText('—'))
            .toBeInTheDocument()
        expect(screen.getByText('Figma').className)
            .toContain('primarySkill')
        expect(screen.queryByText(/intentionally absent/))
            .not.toBeInTheDocument()
    })

    it('uses the compact Figma card structure in grid view', () => {
        render(
            <MemoryRouter>
                <OpportunityListCard
                    item={competitionFixture({
                        skills: [
                            { name: 'Figma' },
                            { name: 'UX' },
                            { name: 'UI' },
                            { name: 'Architecture' },
                        ],
                    })}
                    kind='competitions'
                    view='grid'
                />
            </MemoryRouter>,
        )

        const card = screen.getByRole('link', { name: /Topcoder Opportunities Challenge/ })
        expect(card.className)
            .toContain('gridCard')
        expect(screen.getAllByText('+1'))
            .toHaveLength(2)
        expect(screen.getByText('Submissions:'))
            .toBeInTheDocument()
    })

    it('shows Registered for the server-filtered My competitions result', () => {
        render(
            <MemoryRouter>
                <OpportunityListCard item={competitionFixture()} kind='competitions' registered />
            </MemoryRouter>,
        )

        const state = screen.getByText('Registered')
        expect(state.querySelector('svg'))
            .toBeInTheDocument()
        expect(state.className)
            .toContain('registrationRegistered')
        expect(screen.queryByText('Open for registration'))
            .not.toBeInTheDocument()
    })

    it('omits invented schedule progress when no phase is open', () => {
        render(
            <MemoryRouter>
                <OpportunityListCard
                    item={competitionFixture({
                        currentPhase: undefined,
                        currentPhaseNames: [],
                        phases: [{ isOpen: false, name: 'Registration' }],
                        status: 'COMPLETED',
                    })}
                    kind='competitions'
                />
            </MemoryRouter>,
        )

        expect(screen.queryByRole('progressbar'))
            .not.toBeInTheDocument()
        expect(screen.queryByText('Schedule'))
            .not.toBeInTheDocument()
    })

    it('preserves decimal currency and does not label point prizes as dollars', () => {
        render(
            <MemoryRouter>
                <OpportunityListCard
                    item={competitionFixture({
                        prizeSets: [{
                            prizes: [
                                { type: 'USD', value: 15.5 },
                                { type: 'POINT', value: 10 },
                            ],
                            type: 'PLACEMENT',
                        }],
                    })}
                    kind='competitions'
                />
            </MemoryRouter>,
        )

        const prizes = screen.getByLabelText('Placement prizes')
        expect(within(prizes)
            .getByText('$15.5'))
            .toBeInTheDocument()
        expect(within(prizes)
            .getByText('10 pts'))
            .toBeInTheDocument()
    })

    it('shows the Figma closed-registration treatment when registration is no longer open', () => {
        render(
            <MemoryRouter>
                <OpportunityListCard
                    item={competitionFixture({
                        currentPhaseNames: ['Review'],
                        phases: [
                            { isOpen: false, name: 'Registration' },
                            {
                                actualStartDate: '2026-08-14T00:00:00.000Z',
                                isOpen: true,
                                name: 'Review',
                                scheduledEndDate: '2026-08-14T01:00:00.000Z',
                            },
                        ],
                    })}
                    kind='competitions'
                />
            </MemoryRouter>,
        )

        const state = screen.getByText('Registration closed')
        expect(state.querySelector('svg'))
            .toBeInTheDocument()
        expect(state.className)
            .toContain('registrationClosed')
    })

    it.each([
        ['Design', 'DESIGN', 'Challenge', 'Design', 'designBadge'],
        ['Development', 'DEVELOPMENT', 'First2Finish', 'Development', 'developmentBadge'],
        ['Data Science', 'DATA_SCIENCE', 'Marathon Match', 'Data Science', 'dataScienceBadge'],
        ['Quality Assurance', 'QUALITY_ASSURANCE', 'Task', 'QA', 'qualityAssuranceBadge'],
        ['AI', 'AI', 'Challenge', 'AI', 'artificialIntelligenceBadge'],
    ])(
        'uses the Figma track palette and subtype icon for %s',
        (trackName, trackKey, typeName, expectedLabel, expectedClass) => {
            render(
                <MemoryRouter>
                    <OpportunityListCard
                        item={competitionFixture({
                            track: { name: trackName, track: trackKey },
                            type: { name: typeName },
                        })}
                        kind='competitions'
                    />
                </MemoryRouter>,
            )

            expect(screen.getByText(expectedLabel).className)
                .toContain(expectedClass)
            expect(screen.getByText(typeName === 'First2Finish' ? 'First 2 Finish' : typeName)
                .querySelector('svg'))
                .toBeInTheDocument()
        },
    )
})

describe('OpportunityListCard owner-specific grid presentation', () => {
    it('moves Engagement metrics below a three-line content card', () => {
        const item: EngagementOpportunity = {
            anticipatedStart: 'IMMEDIATE',
            compensationRange: 'Negotiable',
            description: 'Build a member-facing experience with the client team.',
            durationWeeks: 44,
            id: 'engagement-id',
            role: 'SOFTWARE_DEVELOPER',
            skills: [{ name: 'React' }, { name: 'Node.js' }],
            status: 'OPEN',
            title: 'Senior Front-end Developer',
        }
        render(
            <MemoryRouter>
                <OpportunityListCard item={item} kind='engagements' view='grid' />
            </MemoryRouter>,
        )

        expect(screen.getByRole('link').className)
            .toEqual(expect.stringContaining('gridCard'))
        expect(screen.getByText('Role:'))
            .toBeInTheDocument()
        expect(screen.getByText('Development'))
            .toBeInTheDocument()
        expect(screen.getByText('Payment:'))
            .toBeInTheDocument()
        expect(screen.getByText('Open for application')
            .querySelector('svg'))
            .toBeInTheDocument()
    })

    it('renders Copilot hours, duration, and start metrics in grid view', () => {
        const item: CopilotOpportunity = {
            id: 'copilot-id',
            numHoursPerWeek: 5,
            numWeeks: 2,
            opportunityTitle: 'Design Copilot',
            overview: 'Lead and coordinate the challenge delivery.',
            projectType: 'Design',
            skills: [{ name: 'Figma' }],
            status: 'active',
        }
        render(
            <MemoryRouter>
                <OpportunityListCard item={item} kind='copilots' view='grid' />
            </MemoryRouter>,
        )

        expect(screen.getByRole('link').className)
            .toEqual(expect.stringContaining('copilotCard'))
        expect(screen.getByText('Hours / week:'))
            .toBeInTheDocument()
        expect(screen.getByText('Challenge')
            .querySelector('svg'))
            .toBeInTheDocument()
        expect(screen.getByText('Duration:'))
            .toBeInTheDocument()
        expect(screen.getByText('Start:'))
            .toBeInTheDocument()
    })

    it('renders Review role, start, and application metrics without a description', () => {
        const item: ReviewOpportunity = {
            applicationCount: 3,
            canApply: true,
            challengeId: 'challenge-id',
            challengeName: 'Review this challenge',
            id: 'review-id',
            payments: [{ payment: 100, role: 'Reviewer', roleId: 1 }],
            startDate: '2026-06-22T00:00:00.000Z',
            status: 'OPEN',
        }
        render(
            <MemoryRouter>
                <OpportunityListCard item={item} kind='reviews' view='grid' />
            </MemoryRouter>,
        )

        expect(screen.getByRole('link').className)
            .toEqual(expect.stringContaining('reviewCard'))
        expect(screen.getByText('Role:'))
            .toBeInTheDocument()
        expect(screen.getByText('Applications:'))
            .toBeInTheDocument()
        expect(screen.getByText('3'))
            .toBeInTheDocument()
    })
})
