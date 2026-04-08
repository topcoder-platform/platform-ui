/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PROJECT_ROLES } from '../../constants/project-roles.constants'
import type { ProjectMember } from '../../models'
import { updateMemberRole } from '../../services'

import { UserCard } from './UserCard'

jest.mock('~/libs/ui', () => ({
    Button: (
        props: {
            disabled?: boolean
            label: string
            onClick: () => void
        },
    ): JSX.Element => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
}), { virtual: true })

jest.mock('../../services', () => ({
    updateMemberRole: jest.fn(),
}))

jest.mock('../LoadingSpinner', () => ({
    LoadingSpinner: (): JSX.Element => <div>Loading...</div>,
}))

describe('UserCard', () => {
    const mockUpdateMemberRole = updateMemberRole as jest.MockedFunction<typeof updateMemberRole>
    const baseMember: ProjectMember = {
        createdAt: '2026-03-27T00:00:00.000Z',
        email: 'member@example.com',
        handle: 'member1',
        id: 'member-1',
        projectId: 'project-1',
        role: PROJECT_ROLES.READ,
        updatedAt: '2026-03-27T00:00:00.000Z',
        userId: 1,
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('shows a single OK button in the role update success dialog', async () => {
        const user = userEvent.setup()
        const onRoleUpdate = jest.fn()
            .mockResolvedValue(undefined)

        mockUpdateMemberRole.mockResolvedValue({
            ...baseMember,
            role: PROJECT_ROLES.WRITE,
        })

        render(
            <UserCard
                isEditable
                onRemove={jest.fn()}
                onRoleUpdate={onRoleUpdate}
                user={baseMember}
            />,
        )

        await user.click(screen.getByRole('radio', { name: 'Write' }))

        await waitFor(() => {
            expect(mockUpdateMemberRole)
                .toHaveBeenCalledWith('project-1', 'member-1', PROJECT_ROLES.WRITE, undefined)
        })
        await waitFor(() => {
            expect(onRoleUpdate)
                .toHaveBeenCalledTimes(1)
        })

        expect(await screen.findByRole('dialog')).not.toBeNull()
        expect(screen.getByRole('button', { name: 'OK' })).not.toBeNull()
        expect(screen.queryAllByRole('button', { name: 'OK' }))
            .toHaveLength(1)
    })

    it('shows a single Close button in the role update error dialog', async () => {
        const user = userEvent.setup()

        mockUpdateMemberRole.mockRejectedValue(new Error('You do not have permission to update this project member.'))

        render(
            <UserCard
                isEditable
                onRemove={jest.fn()}
                onRoleUpdate={jest.fn()}
                user={baseMember}
            />,
        )

        await user.click(screen.getByRole('radio', { name: 'Write' }))

        await waitFor(() => {
            expect(mockUpdateMemberRole)
                .toHaveBeenCalledWith('project-1', 'member-1', PROJECT_ROLES.WRITE, undefined)
        })

        expect(await screen.findByRole('dialog')).not.toBeNull()
        expect(screen.getByText('You do not have permission to update this project member.')).not.toBeNull()
        expect(screen.queryAllByRole('button', { name: 'Close' }))
            .toHaveLength(1)
    })
})
