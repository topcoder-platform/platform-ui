/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'

import type { AppealInfo } from '../../../../../../models'

import ReviewAppeal from './ReviewAppeal'

jest.mock('../../../ScorecardViewer.context', () => ({
    useScorecardViewerContext: () => ({}),
}))

jest.mock('../../../../../../contexts', () => ({
    useChallengeDetailsContext: () => ({}),
}))

jest.mock('~/apps/review/src/lib/assets/icons', () => ({
    IconAppealResponse: () => <span />,
    IconEdit: () => <span />,
}), { virtual: true })

jest.mock('../../../../../../utils', () => ({
    getScoreResponseOptions: () => [],
}))

jest.mock('../../../../../FieldMarkdownEditor', () => ({
    FieldMarkdownEditor: () => <textarea />,
}))

jest.mock('../../../../../MarkdownReview', () => ({
    MarkdownReview: (props: { value: string }) => <div>{props.value}</div>,
}))

describe('ReviewAppeal outcome', () => {
    it.each([
        [false, 'Rejected', 'Accepted'],
        [true, 'Accepted', 'Rejected'],
    ])('renders success=%s as %s', (success, status, otherStatus) => {
        const appeal: AppealInfo = {
            appealResponse: {
                appealId: 'appeal-1',
                content: 'No change',
                createdAt: '',
                createdBy: '',
                id: 'response-1',
                resourceId: 'reviewer-1',
                success: success as boolean,
                updatedAt: '',
                updatedBy: '',
            },
            content: 'Please reconsider the score.',
            id: 'appeal-1',
            reviewItemCommentId: 'comment-1',
        }

        render(<ReviewAppeal appeal={appeal} canRespondToAppeal={false} />)

        expect(screen.getByText('Appeal Response'))
            .toBeTruthy()
        expect(screen.getByText('No change'))
            .toBeTruthy()
        expect(screen.getByText(status as string))
            .toBeTruthy()
        expect(screen.queryByText(otherStatus as string))
            .toBeNull()
    })
})
