/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { fireEvent, render, screen } from '@testing-library/react'

import { ChallengeDetailContext } from '../../contexts/ChallengeDetailContext'
import type {
    ChallengeDetailContextModel,
    SubmissionDuplicatesMap,
    SubmissionInfo,
} from '../../models'

import { SubmissionHistoryModal } from './SubmissionHistoryModal'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        URLS: {
            CHALLENGES_PAGE: 'https://example.com/challenges',
        },
    },
}), { virtual: true })

jest.mock('../../../config/index.config', () => ({
    TABLE_DATE_FORMAT: 'MMM DD, HH:mm A',
}))

jest.mock('~/apps/admin/src/lib/models', () => ({}), { virtual: true })

jest.mock('~/libs/shared', () => ({
    copyTextToClipboard: jest.fn(),
}), { virtual: true })

jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
    },
}))

jest.mock('~/libs/ui', () => {
    const React = jest.requireActual('react')

    return {
        BaseModal: (props: { children: React.ReactNode, open: boolean }) => (
            props.open
                ? React.createElement('div', undefined, props.children)
                : undefined
        ),
        IconOutline: {
            ChevronDownIcon: () => React.createElement('svg'),
            DocumentDuplicateIcon: () => React.createElement('svg'),
            ExclamationIcon: () => React.createElement('svg'),
            ExternalLinkIcon: () => React.createElement('svg'),
            LightningBoltIcon: () => React.createElement('svg'),
        },
        Tooltip: (props: { children: React.ReactNode }) => (
            React.createElement(React.Fragment, undefined, props.children)
        ),
    }
}, { virtual: true })

jest.mock('../AiReviewsTable', () => ({
    AiReviewsTable: () => <div data-testid='ai-reviews-table' />,
    AiWorkflowRunStatus: () => <span />,
}))

jest.mock('./SubmissionHistoryModal.module.scss', () => new Proxy({}, {
    get: (_target, property) => String(property),
}))

const submissions = [
    {
        id: 'submission-1',
        isFileSubmission: true,
        submittedDateString: 'Jul 13, 09:35 AM',
        virusScan: true,
    },
    {
        id: 'submission-2',
        isFileSubmission: true,
        submittedDateString: 'Jul 10, 02:15 PM',
        virusScan: true,
    },
] as unknown as SubmissionInfo[]

const duplicate = {
    challenge: 'challenge-2',
    challengeTitle: 'Basketball Stats App',
    isCrossChallenge: true,
    submissionId: 'plkGwR_M_145',
    submittedAt: '2026-07-09T11:21:00.000Z',
    user: '2002',
    userHandle: 'sathya22in',
}

/**
 * Renders the history modal inside a context carrying duplicate matches.
 *
 * @param duplicatesBySubmissionId duplicate matches exposed through context
 * @returns The testing-library render result.
 */
function renderModal(
    duplicatesBySubmissionId: SubmissionDuplicatesMap,
): ReturnType<typeof render> {
    const contextValue = {
        aiReviewDecisionsBySubmissionId: {},
        duplicatesBySubmissionId,
    } as ChallengeDetailContextModel

    return render(
        <ChallengeDetailContext.Provider value={contextValue}>
            <SubmissionHistoryModal
                downloadSubmission={jest.fn()}
                isDownloading={{}}
                onClose={jest.fn()}
                open
                submissions={submissions}
            />
        </ChallengeDetailContext.Provider>,
    )
}

describe('SubmissionHistoryModal duplicates', () => {
    it('badges only the history rows that have duplicates', () => {
        renderModal({ 'submission-1': [duplicate], 'submission-2': [] })

        const badges = screen.getAllByRole('img', { name: /identical submission/ })

        expect(badges)
            .toHaveLength(1)
        expect(badges[0].getAttribute('aria-label'))
            .toBe('1 identical submission on other challenges')
    })

    it('renders no badge when duplicates were never fetched', () => {
        renderModal({})

        expect(screen.queryByRole('img', { name: /identical submission/ }))
            .toBeNull()
    })

    it('shows the duplicates panel above the AI reviewers table when expanded', () => {
        renderModal({ 'submission-1': [duplicate] })

        expect(screen.queryByTestId('ai-reviews-table'))
            .toBeNull()

        fireEvent.click(screen.getAllByText(/AI Reviewer/)[0])

        const panelTitle = screen.getAllByText(
            (_content, element) => element?.textContent === 'Duplicates (1)',
        )[0]
        const aiTable = screen.getByTestId('ai-reviews-table')

        expect(panelTitle)
            .toBeTruthy()
        expect(screen.getByText('sathya22in'))
            .toBeTruthy()

        // The panel must precede the AI reviewers table inside the expanded row.
        const expandedRow = aiTable.closest('td') as HTMLTableCellElement
        const orderedText = Array.from(expandedRow.querySelectorAll('*'))
            .filter(element => (
                element === aiTable || element.textContent === 'Duplicates (1)'
            ))

        expect(orderedText[0].textContent)
            .toBe('Duplicates (1)')
        expect(orderedText[orderedText.length - 1])
            .toBe(aiTable)
    })
})
