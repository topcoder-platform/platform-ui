/**
 * Mock data for the appeal info
 */

import { AppealInfo } from '../lib/models'

const mockMarkdown
// eslint-disable-next-line max-len
    = 'I disagree! My **biggest concern** for the *above situation* was to focus not only on lorem ipsum but also on lorem ipsa which is more important in this case.'

export const MockAppeals: AppealInfo[] = [
    {
        content: mockMarkdown,
        id: '1',
        reviewItemCommentId: '1',
    },
    {
        content: mockMarkdown,
        id: '2',
        reviewItemCommentId: '2',
    },
]
