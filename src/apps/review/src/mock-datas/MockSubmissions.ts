/**
 * Mock data for the submission info
 */
import { SubmissionInfo } from '../lib/models'

export const MockSubmissions: SubmissionInfo[] = [
    {
        id: '736590',
        memberId: '1234',
    },
    {
        id: '736592',
        memberId: '1234',
        review: {
            appealResuls: [
                {
                    id: '1',
                    success: true,
                },
                {
                    id: '6',
                    success: true,
                },
            ],
            createdAt: new Date()
                .toISOString(),
            id: '1',
            initialScore: 98.67,
            reviewItems: [],
            scorecardId: '1',
            updatedAt: new Date()
                .toISOString(),
        },
        reviews: [
            {
                appeals: [
                    {
                        id: '1',
                        success: true,
                    },
                ],
                createdAt: new Date()
                    .toISOString(),
                reviewerHandle: 'Ghostar',
                reviewerHandleColor: '#C9AB00',
                score: 100,
            },
            {
                appeals: [
                    {
                        id: '2',
                        success: true,
                    },
                ],
                createdAt: new Date()
                    .toISOString(),
                reviewerHandle: 'vasilica.olariu',
                reviewerHandleColor: '#EF3A3A',
                score: 98.0,
            },
            {
                appeals: [
                    {
                        id: '3',
                        success: true,
                    },
                ],
                createdAt: new Date()
                    .toISOString(),
                reviewerHandle: 'TheRichCode',
                reviewerHandleColor: '#0A0A0A',
                score: 98,
            },
        ],
    },
    {
        id: '736597',
        memberId: '1234',
        review: {
            appealResuls: [
                {
                    id: '1',
                    success: true,
                },
                {
                    id: '6',
                    success: true,
                },
            ],
            createdAt: new Date()
                .toISOString(),
            finalScore: 96.8,
            id: '2',
            initialScore: 96.17,
            reviewItems: [],
            scorecardId: '1',
            updatedAt: new Date()
                .toISOString(),
        },
    },
    {
        id: '726598',
        memberId: '1234',
        review: {
            appealResuls: [
                {
                    id: '1',
                    success: true,
                },
                {
                    id: '6',
                    success: true,
                },
            ],
            createdAt: new Date()
                .toISOString(),
            id: '2',
            reviewItems: [
                {
                    createdAt: new Date()
                        .toISOString(),
                    finalAnswer: 'No',
                    id: '1',
                    initialAnswer: 'Yes',
                    reviewItemComments: [],
                    scorecardQuestionId: '4',
                },
                {
                    createdAt: new Date()
                        .toISOString(),
                    id: '2',
                    reviewItemComments: [],
                    scorecardQuestionId: '5',
                },
            ],
            scorecardId: '1',
            updatedAt: new Date()
                .toISOString(),
        },
    },
    {
        id: '736591',
        memberId: '1234',
        review: {
            appealResuls: [
                {
                    id: '1',
                    success: true,
                },
                {
                    id: '6',
                    success: true,
                },
            ],
            createdAt: new Date()
                .toISOString(),
            id: '2',
            reviewItems: [
                {
                    createdAt: new Date()
                        .toISOString(),
                    finalAnswer: 'No',
                    id: '1',
                    initialAnswer: 'Yes',
                    reviewItemComments: [],
                    scorecardQuestionId: '4',
                },
                {
                    createdAt: new Date()
                        .toISOString(),
                    id: '2',
                    reviewItemComments: [],
                    scorecardQuestionId: '5',
                },
            ],
            scorecardId: '1',
            updatedAt: new Date()
                .toISOString(),
        },
    },
    {
        id: '726545',
        memberId: '1234',
        review: {
            appealResuls: [
                {
                    id: '1',
                    success: true,
                },
                {
                    id: '6',
                    success: true,
                },
            ],
            createdAt: new Date()
                .toISOString(),
            id: '2',
            reviewItems: [
                {
                    createdAt: new Date()
                        .toISOString(),
                    finalAnswer: 'No',
                    id: '1',
                    initialAnswer: 'Yes',
                    reviewItemComments: [],
                    scorecardQuestionId: '4',
                },
                {
                    createdAt: new Date()
                        .toISOString(),
                    id: '2',
                    reviewItemComments: [],
                    scorecardQuestionId: '5',
                },
            ],
            scorecardId: '1',
            updatedAt: new Date()
                .toISOString(),
        },
    },
]
