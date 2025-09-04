import { ReviewResult } from '../lib/models'

export const MockSubmissionReviews: ReviewResult[] = [
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
]
