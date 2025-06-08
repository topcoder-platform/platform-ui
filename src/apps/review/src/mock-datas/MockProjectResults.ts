/**
 * Mock data for the project result
 */

import { ProjectResult } from '../lib/models'
import { roundWith2DecimalPlaces } from '../lib/utils'

export const MockProjectResults: ProjectResult[] = [
    {
        challengeId: '1',
        createdAt: new Date()
            .toISOString(),
        finalScore: roundWith2DecimalPlaces((90.67 + 94.0) / 2),
        handle: 'shubhangi18',
        handleColor: '#0A0A0A',
        initialScore: 96.45,
        placement: 1,
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
                reviewerHandleColor: '#C9AB0',
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
        submissionId: '736592',
    },
    {
        challengeId: '1',
        createdAt: new Date()
            .toISOString(),
        finalScore: roundWith2DecimalPlaces((98.0 + 94.33) / 2),
        handle: 'Gando19850304',
        handleColor: '#616BD5',
        initialScore: 96.17,
        placement: 2,
        reviews: [
            {
                appeals: [
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
                reviewerHandle: 'Ghostar',
                reviewerHandleColor: '#C9AB00',
                score: 98.0,
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
                score: 94.33,
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
                score: 94.5,
            },
        ],
        submissionId: '736590',
    },
    {
        challengeId: '1',
        createdAt: new Date()
            .toISOString(),
        finalScore: roundWith2DecimalPlaces((98.0 + 94.33) / 2),
        handle: 'Nikesh2003',
        handleColor: '#0A0A0A',
        initialScore: 96.17,
        placement: 3,
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
                reviewerHandleColor: '#C9AB0',
                score: 98.0,
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
                score: 94.33,
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
                score: 94.5,
            },
        ],
        submissionId: '736597',
    },
    {
        challengeId: '1',
        createdAt: new Date()
            .toISOString(),
        finalScore: roundWith2DecimalPlaces((90.67 + 94.5) / 2),
        handle: 'nursoltan-s',
        handleColor: '#0A0A0A',
        initialScore: 92.33,
        placement: 0,
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
                reviewerHandleColor: '#C9AB0',
                score: 90.67,
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
                score: 94.5,
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
                score: 94.5,
            },
        ],
        submissionId: '726598',
    },
    {
        challengeId: '1',
        createdAt: new Date()
            .toISOString(),
        finalScore: roundWith2DecimalPlaces((90.67 + 94.5) / 2),
        handle: 'stevenfrog',
        handleColor: '#2D7E2D',
        initialScore: 96.45,
        placement: 0,
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
                reviewerHandleColor: '#C9AB0',
                score: 90.67,
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
                score: 94.5,
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
                score: 94.5,
            },
        ],
        submissionId: '736591',
    },
    {
        challengeId: '1',
        createdAt: new Date()
            .toISOString(),
        finalScore: roundWith2DecimalPlaces((98.6 + 91.2) / 2),
        handle: 'whereishammer',
        handleColor: '#2D7E2D',
        initialScore: 96.45,
        placement: 0,
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
                reviewerHandleColor: '#C9AB0',
                score: 98.6,
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
                score: 91.2,
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
                score: 94.5,
            },
        ],
        submissionId: '726545',
    },
]
