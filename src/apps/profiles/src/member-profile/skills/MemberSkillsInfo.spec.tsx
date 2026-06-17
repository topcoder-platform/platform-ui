/* eslint-disable import/first, import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { MemoryRouter } from 'react-router-dom'

type TestSkill = {
    category: {
        id: string
        name: string
    }
    displayMode: {
        id: string
        name: string
    }
    id: string
    levels: Array<unknown>
    name: string
}

jest.mock('~/libs/core', () => ({
    getMemberSkillDetails: jest.fn(),
    UserRole: {
        administrator: 'administrator',
        talentManager: 'talentManager',
    },
    UserSkillDisplayModes: {
        additional: 'additional',
        principal: 'principal',
    },
}), { virtual: true })

jest.mock('~/libs/shared', () => {
    const React = jest.requireActual('react')

    return {
        GroupedSkillsUI: (): JSX.Element => <div data-testid='grouped-skills' />,
        HowSkillsWorkModal: (): JSX.Element => <div data-testid='how-skills-work-modal' />,
        isSkillVerified: (): boolean => false,
        SkillPill: (props: { skill: Pick<TestSkill, 'name'> }): JSX.Element => (
            <span>{props.skill.name}</span>
        ),
        useLocalStorage: (_key: string, initialValue: unknown): [unknown, (value: unknown) => void] => (
            React.useState(initialValue)
        ),
    }
}, { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: (props: { label: string, onClick: () => void }): JSX.Element => (
        <button type='button' onClick={props.onClick}>{props.label}</button>
    ),
    IconSolid: {
        ChevronDownIcon: (): JSX.Element => <svg data-testid='chevron-down' />,
        ChevronUpIcon: (): JSX.Element => <svg data-testid='chevron-up' />,
    },
}), {
    virtual: true,
})

jest.mock('../../components', () => ({
    AddButton: (props: { label: string, onClick: () => void }): JSX.Element => (
        <button type='button' onClick={props.onClick}>{props.label}</button>
    ),
    EditMemberPropertyBtn: (props: { onClick: () => void }): JSX.Element => (
        <button type='button' onClick={props.onClick}>Edit</button>
    ),
    EmptySection: (props: PropsWithChildren<{ title: string }>): JSX.Element => (
        <section>
            <h4>{props.title}</h4>
            {props.children}
        </section>
    ),
}))

jest.mock('../MemberProfile.context', () => ({
    useMemberProfileContext: (): { isTalentSearch: boolean } => ({
        isTalentSearch: false,
    }),
}))

jest.mock('./ModifySkillsModal', () => ({
    ModifySkillsModal: (): JSX.Element => <div data-testid='modify-skills-modal' />,
}))

jest.mock('./PrincipalSkillsModal', () => ({
    PrincipalSkillsModal: (): JSX.Element => <div data-testid='principal-skills-modal' />,
}))

import MemberSkillsInfo from './MemberSkillsInfo'

/**
 * Creates a principal UserSkill test fixture with stable IDs and display mode.
 *
 * @param name Display name for the skill.
 * @param index Numeric suffix used to keep IDs deterministic.
 * @returns A UserSkill fixture that can be rendered by MemberSkillsInfo.
 * @throws This helper does not throw errors.
 */
function createPrincipalSkill(name: string, index: number): TestSkill {
    return {
        category: {
            id: 'category-design',
            name: 'Design',
        },
        displayMode: {
            id: 'display-principal',
            name: 'principal',
        },
        id: `skill-${index}`,
        levels: [],
        name,
    }
}

describe('MemberSkillsInfo', () => {
    it('shows five principal skills before expanding the remaining skills', () => {
        const profile = {
            handle: 'tester',
            skills: [
                'AI',
                'BDD',
                'BIOS',
                'CAL',
                'Documentation',
                'NLP',
                'Security Testing',
            ].map(createPrincipalSkill),
        }

        render(
            <MemoryRouter>
                <MemberSkillsInfo
                    authProfile={undefined}
                    profile={profile as any}
                    refreshProfile={jest.fn()}
                />
            </MemoryRouter>,
        )

        expect(screen.getByText('AI'))
            .toBeInTheDocument()
        expect(screen.getByText('Documentation'))
            .toBeInTheDocument()
        expect(screen.queryByText('NLP'))
            .not
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: '+ 2 more skills' }))
            .toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: '+ 2 more skills' }))

        expect(screen.getByText('NLP'))
            .toBeInTheDocument()
        expect(screen.getByText('Security Testing'))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'See less' }))
            .toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'See less' }))

        expect(screen.queryByText('NLP'))
            .not
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: '+ 2 more skills' }))
            .toBeInTheDocument()
    })
})
