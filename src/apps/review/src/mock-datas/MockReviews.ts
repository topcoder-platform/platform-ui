/**
 * Mock data for the review info
 */

import { ReviewInfo } from '../lib/models'

// eslint-disable-next-line max-len
const mockCommentMarkdown = `We need to figure out the **jobID problem**. That’s likely in the *project API*, but a job ID should be being added when a project is saved. Doesn’t affect the [score](https://google.com.vn/) since it’s external to the changes. Check the screenshot below:
<img style="margin-top: 11px;" src="https://picsum.photos/568/263" />
Also please note these issues too:
* Issue 1: this is very important to consider
* Issue 2: something nice to have
`

export const MockReviewFull: ReviewInfo = {
    appealResuls: [],
    createdAt: new Date()
        .toISOString(),
    finalScore: 96.17,
    id: '2',
    reviewItems: [
        {
            createdAt: new Date()
                .toISOString(),
            finalAnswer: 'No',
            id: '1',
            initialAnswer: 'Yes',
            reviewItemComments: [
                {
                    content: mockCommentMarkdown,
                    id: '1',
                    sortOrder: 1,
                    type: 'COMMENT',
                },
                {
                    content:
                        'Here comes another answer lorem ipsum dolor sit amet.',
                    id: '12',
                    sortOrder: 2,
                    type: 'REQUIRED',
                },
            ],
            scorecardQuestionId: '4',
        },
        {
            createdAt: new Date()
                .toISOString(),
            finalAnswer: '9',
            id: '2',
            initialAnswer: '9',
            reviewItemComments: [
                {
                    content:
                        'Here comes another answer lorem ipsum dolor sit amet.',
                    id: '2',
                    sortOrder: 1,
                    type: 'REQUIRED',
                },
            ],
            scorecardQuestionId: '5',
        },
        {
            createdAt: new Date()
                .toISOString(),
            finalAnswer: '9',
            id: '3',
            initialAnswer: '9',
            reviewItemComments: [
                {
                    content:
                        'Here comes another answer lorem ipsum dolor sit amet.',
                    id: '3',
                    sortOrder: 1,
                    type: 'RECOMMENDED',
                },
                {
                    content:
                        'Here comes another answer lorem ipsum dolor sit amet.',
                    id: '13',
                    sortOrder: 2,
                    type: 'RECOMMENDED',
                },
            ],
            scorecardQuestionId: '6',
        },
        {
            createdAt: new Date()
                .toISOString(),
            finalAnswer: '9',
            id: '4',
            initialAnswer: '9',
            reviewItemComments: [
                {
                    content:
                        'Here comes another answer lorem ipsum dolor sit amet.',
                    id: '4',
                    sortOrder: 1,
                    type: 'COMMENT',
                },
            ],
            scorecardQuestionId: '7',
        },
        {
            createdAt: new Date()
                .toISOString(),
            finalAnswer: '9',
            id: '5',
            initialAnswer: '9',
            reviewItemComments: [
                {
                    content:
                        'Here comes another answer lorem ipsum dolor sit amet.',
                    id: '5',
                    sortOrder: 1,
                    type: 'REQUIRED',
                },
            ],
            scorecardQuestionId: '9',
        },
        {
            createdAt: new Date()
                .toISOString(),
            finalAnswer: '9',
            id: '6',
            initialAnswer: '9',
            reviewItemComments: [
                {
                    content:
                        'Here comes another answer lorem ipsum dolor sit amet.',
                    id: '6',
                    sortOrder: 1,
                    type: 'RECOMMENDED',
                },
            ],
            scorecardQuestionId: '10',
        },
        {
            createdAt: new Date()
                .toISOString(),
            finalAnswer: '9',
            id: '7',
            initialAnswer: '9',
            reviewItemComments: [
                {
                    content:
                        'Here comes another answer lorem ipsum dolor sit amet.',
                    id: '7',
                    sortOrder: 1,
                    type: 'COMMENT',
                },
            ],
            scorecardQuestionId: '13',
        },
        {
            createdAt: new Date()
                .toISOString(),
            finalAnswer: '9',
            id: '8',
            initialAnswer: '9',
            reviewItemComments: [
                {
                    content:
                        'Here comes another answer lorem ipsum dolor sit amet.',
                    id: '8',
                    sortOrder: 1,
                    type: 'REQUIRED',
                },
            ],
            scorecardQuestionId: '14',
        },
        {
            createdAt: new Date()
                .toISOString(),
            finalAnswer: '9',
            id: '9',
            initialAnswer: '9',
            reviewItemComments: [
                {
                    content:
                        'Here comes another answer lorem ipsum dolor sit amet.',
                    id: '9',
                    sortOrder: 1,
                    type: 'RECOMMENDED',
                },
            ],
            scorecardQuestionId: '16',
        },
        {
            createdAt: new Date()
                .toISOString(),
            finalAnswer: '9',
            id: '10',
            initialAnswer: '9',
            reviewItemComments: [
                {
                    content:
                        'Here comes another answer lorem ipsum dolor sit amet.',
                    id: '10',
                    sortOrder: 1,
                    type: 'COMMENT',
                },
                {
                    content:
                        'Here comes another answer lorem ipsum dolor sit amet.',
                    id: '11',
                    sortOrder: 2,
                    type: 'RECOMMENDED',
                },
            ],
            scorecardQuestionId: '17',
        },
    ],
    scorecardId: '1',
    updatedAt: new Date()
        .toISOString(),
}

export const MockReviewEdit: ReviewInfo = {
    appealResuls: [],
    createdAt: new Date()
        .toISOString(),
    finalScore: 96.17,
    id: '2',
    reviewItems: [
        {
            createdAt: new Date()
                .toISOString(),
            finalAnswer: 'No',
            id: '1',
            initialAnswer: 'Yes',
            reviewItemComments: [
                {
                    content: mockCommentMarkdown,
                    id: '1',
                    sortOrder: 1,
                    type: 'COMMENT',
                },
            ],
            scorecardQuestionId: '4',
        },
        {
            createdAt: new Date()
                .toISOString(),
            id: '2',
            reviewItemComments: [
                {
                    content: '',
                    id: '2',
                    sortOrder: 1,
                    type: '',
                },
            ],
            scorecardQuestionId: '5',
        },
        {
            createdAt: new Date()
                .toISOString(),
            id: '3',
            reviewItemComments: [
                {
                    content: '',
                    id: '3',
                    sortOrder: 1,
                    type: '',
                },
            ],
            scorecardQuestionId: '6',
        },
        {
            createdAt: new Date()
                .toISOString(),
            id: '4',
            reviewItemComments: [
                {
                    content: '',
                    id: '4',
                    sortOrder: 1,
                    type: '',
                },
            ],
            scorecardQuestionId: '7',
        },
        {
            createdAt: new Date()
                .toISOString(),
            id: '5',
            reviewItemComments: [
                {
                    content: '',
                    id: '5',
                    sortOrder: 1,
                    type: '',
                },
            ],
            scorecardQuestionId: '9',
        },
        {
            createdAt: new Date()
                .toISOString(),
            id: '6',
            reviewItemComments: [
                {
                    content: '',
                    id: '6',
                    sortOrder: 1,
                    type: '',
                },
            ],
            scorecardQuestionId: '10',
        },
        {
            createdAt: new Date()
                .toISOString(),
            id: '7',
            reviewItemComments: [
                {
                    content: '',
                    id: '7',
                    sortOrder: 1,
                    type: '',
                },
            ],
            scorecardQuestionId: '13',
        },
        {
            createdAt: new Date()
                .toISOString(),
            id: '8',
            reviewItemComments: [
                {
                    content: '',
                    id: '8',
                    sortOrder: 1,
                    type: '',
                },
            ],
            scorecardQuestionId: '14',
        },
        {
            createdAt: new Date()
                .toISOString(),
            id: '9',
            reviewItemComments: [
                {
                    content: '',
                    id: '9',
                    sortOrder: 1,
                    type: '',
                },
            ],
            scorecardQuestionId: '16',
        },
        {
            createdAt: new Date()
                .toISOString(),
            id: '10',
            reviewItemComments: [
                {
                    content: '',
                    id: '10',
                    sortOrder: 1,
                    type: '',
                },
            ],
            scorecardQuestionId: '17',
        },
    ],
    scorecardId: '1',
    updatedAt: new Date()
        .toISOString(),
}
