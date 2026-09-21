/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import { ChallengeDetailContext, ReviewAppContext } from '../../contexts'

import { SubmissionArtifactsButton } from './SubmissionArtifactsButton'

jest.mock('../../contexts', () => {
    const React = jest.requireActual('react')
    return {
        ChallengeDetailContext: React.createContext({}),
        ReviewAppContext: React.createContext({}),
    }
})
jest.mock('../../utils/challenge', () => ({
    isMarathonMatchChallenge: (challenge: { type?: { name?: string } }) => (
        challenge?.type?.name === 'Marathon Match'
    ),
}))
jest.mock('~/libs/ui', () => ({
    IconOutline: { FolderDownloadIcon: () => <svg /> },
    LoadingSpinner: () => <span>Loading</span>,
}), { virtual: true })
jest.mock('~/apps/opportunities/src/components/SubmissionArtifactsModal', () => ({
    SubmissionArtifactsModal: (props: { allowInternalArtifacts?: boolean; submissionId?: string }) => (
        <div role='dialog'>
            {props.submissionId}
            :
            {' '}
            {props.allowInternalArtifacts ? 'all files' : 'regular files'}
        </div>
    ),
}), { virtual: true })

describe('SubmissionArtifactsButton', () => {
    it.each([
        ['ACTIVE', '123', ['Submitter'], true, false],
        ['ACTIVE', '456', ['Submitter'], false, false],
        ['COMPLETED', '123', ['Submitter'], true, true],
        ['COMPLETED', '456', ['Submitter'], true, true],
        ['CANCELLED_FAILED_REVIEW', '456', ['Submitter'], false, false],
        ['CANCELLED', '123', ['Submitter'], true, false],
        ['COMPLETED', '456', [], false, false],
        ['ACTIVE', '456', ['Copilot'], true, true],
    ])('gates %s submission by %s for %s', async (status, memberId, myRoles, allowed, internal) => {
        render(
            <ChallengeDetailContext.Provider value={{
                challengeInfo: { status, type: { name: 'Marathon Match' } },
                myRoles,
            } as any}
            >
                <ReviewAppContext.Provider value={{ loginUserInfo: { roles: [], userId: '123' } } as any}>
                    <SubmissionArtifactsButton memberId={memberId} submissionId='submission-1' />
                </ReviewAppContext.Provider>
            </ChallengeDetailContext.Provider>,
        )
        const action = screen.queryByRole('button', { name: 'Download submission artifacts submission-1' })
        if (!allowed) {
            expect(action).not.toBeInTheDocument()
            return
        }

        fireEvent.click(action as HTMLElement)
        expect(await screen.findByRole('dialog'))
            .toHaveTextContent(internal ? 'all files' : 'regular files')
    })
})
