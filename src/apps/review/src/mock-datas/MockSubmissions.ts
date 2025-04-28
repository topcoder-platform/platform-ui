/**
 * Mock data for the submission info
 */
import { SubmissionInfo } from '../lib/models'

export const MockSubmissions: SubmissionInfo[] = [
    {
        handle: 'Gando19850304',
        handleColor: '#616BD5',
        id: '736590',
    },
    {
        handle: 'shubhangi18',
        handleColor: '#0A0A0A',
        id: '736592',
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
            initialScore: 96.17,
            reviewItems: [],
            scorecardId: '1',
            updatedAt: new Date()
                .toISOString(),
        },
    },
    {
        handle: 'Nikesh2003',
        handleColor: '#0A0A0A',
        id: '736592',
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
        handle: 'nursoltan-s',
        handleColor: '#0A0A0A',
        id: '726598',
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
        handle: 'stevenfrog',
        handleColor: '#2D7E2D',
        id: '736591',
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
        handle: 'whereishammer',
        handleColor: '#2D7E2D',
        id: '726545',
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
