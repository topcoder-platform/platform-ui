/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, sort-keys */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen } from '@testing-library/react'

import MemberExperienceList from './MemberExperienceList'

import type { MemberExperience } from '../../lib/models'

jest.mock('react-markdown', () => ({
    __esModule: true,
    default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

jest.mock('remark-breaks', () => ({
    __esModule: true,
    default: jest.fn(),
}))

jest.mock('remark-frontmatter', () => ({
    __esModule: true,
    default: jest.fn(),
}))

jest.mock('remark-gfm', () => ({
    __esModule: true,
    default: jest.fn(),
}))

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        className?: string
        disabled?: boolean
        label: string
        onClick?: () => void
    }) => (
        <button
            type='button'
            className={props.className}
            disabled={props.disabled}
            onClick={props.onClick}
        >
            {props.label}
        </button>
    ),
    IconOutline: {
        ChatAltIcon: () => <span />,
        ExclamationIcon: () => <span />,
    },
    LoadingSpinner: () => <span>Loading</span>,
}), { virtual: true })

describe('MemberExperienceList', () => {
    it('renders the newest experiences first', () => {
        const experiences: MemberExperience[] = [
            {
                createdAt: '2026-04-01T18:21:00.000Z',
                engagementAssignmentId: 'assignment-1',
                experienceText: 'This is my exp',
                id: 'exp-1',
                memberHandle: 'liuliquan',
                memberId: '22655076',
                updatedAt: '2026-04-01T18:21:00.000Z',
            },
            {
                createdAt: '2026-04-01T18:30:00.000Z',
                engagementAssignmentId: 'assignment-1',
                experienceText: 'this is my second exp',
                id: 'exp-2',
                memberHandle: 'liuliquan',
                memberId: '22655076',
                updatedAt: '2026-04-01T18:30:00.000Z',
            },
        ]

        render(<MemberExperienceList experiences={experiences} />)

        const newestExperience = screen.getByText('this is my second exp')
        const oldestExperience = screen.getByText('This is my exp')

        expect(
            newestExperience.compareDocumentPosition(oldestExperience),
        )
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    })
})
