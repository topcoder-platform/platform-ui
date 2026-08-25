/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'

import { ChallengeDetailContext } from '../../contexts/ChallengeDetailContext'
import type { ChallengeDetailContextModel, SubmissionDuplicatesMap } from '../../models'

import { SubmissionDuplicatesBadge } from './SubmissionDuplicatesBadge'
import { SubmissionDuplicatesPanel } from './SubmissionDuplicatesPanel'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        URLS: {
            CHALLENGES_PAGE: 'https://example.com/challenges',
        },
    },
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const React = jest.requireActual('react')

    return {
        IconOutline: {
            ExclamationIcon: () => React.createElement('svg'),
            ExternalLinkIcon: () => React.createElement('svg'),
            LightningBoltIcon: () => React.createElement('svg'),
        },
        Tooltip: (props: { children: React.ReactNode }) => (
            React.createElement(React.Fragment, undefined, props.children)
        ),
    }
}, { virtual: true })

const sameChallengeDuplicate = {
    challenge: 'challenge-1',
    challengeTitle: 'This Challenge',
    isCrossChallenge: false,
    submissionId: '12I.RbObnTFCVt',
    submittedAt: '2026-07-13T09:35:00.000Z',
    user: '2001',
    userHandle: 'testmfa1',
}

const crossChallengeDuplicate = {
    challenge: 'challenge-2',
    challengeTitle: 'Basketball Stats App',
    isCrossChallenge: true,
    submissionId: 'plkGwR_M_145',
    submittedAt: '2026-07-09T11:21:00.000Z',
    user: '2002',
    userHandle: 'sathya22in',
}

/**
 * Renders a component inside a challenge detail context carrying duplicates.
 *
 * @param element component under test
 * @param duplicatesBySubmissionId duplicate matches exposed through context
 * @returns The testing-library render result.
 */
function renderWithDuplicates(
    element: JSX.Element,
    duplicatesBySubmissionId: SubmissionDuplicatesMap,
): ReturnType<typeof render> {
    const contextValue = {
        duplicatesBySubmissionId,
    } as ChallengeDetailContextModel

    return render(
        <ChallengeDetailContext.Provider value={contextValue}>
            {element}
        </ChallengeDetailContext.Provider>,
    )
}

describe('SubmissionDuplicatesBadge', () => {
    it('renders nothing when the submission has no duplicates', () => {
        renderWithDuplicates(
            <SubmissionDuplicatesBadge submissionId='submission-1' />,
            { 'submission-1': [] },
        )

        expect(screen.queryByRole('img'))
            .toBeNull()
    })

    it('renders nothing when no submission id is supplied', () => {
        renderWithDuplicates(
            <SubmissionDuplicatesBadge />,
            { 'submission-1': [sameChallengeDuplicate] },
        )

        expect(screen.queryByRole('img'))
            .toBeNull()
    })

    it('summarizes same-challenge duplicates', () => {
        renderWithDuplicates(
            <SubmissionDuplicatesBadge submissionId='submission-1' />,
            { 'submission-1': [sameChallengeDuplicate] },
        )

        expect(screen.getByRole('img', { name: '1 identical submission on this challenge' }))
            .toBeTruthy()
    })

    it('calls out cross-challenge duplicates', () => {
        renderWithDuplicates(
            <SubmissionDuplicatesBadge submissionId='submission-1' />,
            { 'submission-1': [sameChallengeDuplicate, crossChallengeDuplicate] },
        )

        expect(screen.getByRole('img', {
            name: '2 identical submissions, 1 on other challenges',
        }))
            .toBeTruthy()
    })
})

describe('SubmissionDuplicatesPanel', () => {
    it('renders nothing when the submission has no duplicates', () => {
        renderWithDuplicates(
            <SubmissionDuplicatesPanel submissionId='submission-1' />,
            {},
        )

        expect(screen.queryByText(/Duplicates/))
            .toBeNull()
    })

    it('lists every duplicate with handle, id and date', () => {
        renderWithDuplicates(
            <SubmissionDuplicatesPanel submissionId='submission-1' />,
            { 'submission-1': [sameChallengeDuplicate, crossChallengeDuplicate] },
        )

        expect(screen.getAllByText(
            (_content, element) => element?.textContent === 'Duplicates (2)',
        ).length)
            .toBeGreaterThan(0)
        expect(screen.getByText('testmfa1'))
            .toBeTruthy()
        expect(screen.getByText('(12I.RbObnTFCVt)'))
            .toBeTruthy()
        expect(screen.getByText('sathya22in'))
            .toBeTruthy()
    })

    it('links only cross-challenge duplicates to their originating challenge', () => {
        renderWithDuplicates(
            <SubmissionDuplicatesPanel submissionId='submission-1' />,
            { 'submission-1': [sameChallengeDuplicate, crossChallengeDuplicate] },
        )

        const links = screen.getAllByRole('link')

        expect(links)
            .toHaveLength(1)
        expect(links[0].getAttribute('href'))
            .toBe('https://example.com/challenges/challenge-2')
        expect(links[0].textContent)
            .toContain('Basketball Stats App')
    })

    it('falls back to the member id when no handle resolved', () => {
        renderWithDuplicates(
            <SubmissionDuplicatesPanel submissionId='submission-1' />,
            {
                'submission-1': [
                    {
                        ...sameChallengeDuplicate,
                        userHandle: undefined,
                    },
                ],
            },
        )

        expect(screen.getByText('2001'))
            .toBeTruthy()
    })

    it('renders a placeholder date when the timestamp is unusable', () => {
        renderWithDuplicates(
            <SubmissionDuplicatesPanel submissionId='submission-1' />,
            {
                'submission-1': [
                    {
                        ...sameChallengeDuplicate,
                        submittedAt: undefined,
                    },
                ],
            },
        )

        expect(screen.getByText('- --'))
            .toBeTruthy()
    })
})
