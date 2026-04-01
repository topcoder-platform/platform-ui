/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { WorkAppContext } from '../../../../../lib/contexts/WorkAppContext'
import type { WorkAppContextModel } from '../../../../../lib/models/WorkAppContextModel.model'

import { GroupsField } from './GroupsField'

jest.mock('../../../../../config/routes.config', () => ({
    groupsRouteId: 'groups',
    rootRoute: '/work',
}))
jest.mock('../../../../../lib/components/form', () => ({
    FormGroupsSelect: () => <div data-testid='groups-select'>Groups select</div>,
}))

const defaultContextValue: WorkAppContextModel = {
    isAdmin: false,
    isAnonymous: false,
    isCopilot: false,
    isManager: false,
    isReadOnly: false,
    loginUserInfo: undefined,
    userRoles: [],
}

function renderGroupsField(
    contextOverrides?: Partial<WorkAppContextModel>,
): void {
    render(
        <WorkAppContext.Provider value={{
            ...defaultContextValue,
            ...contextOverrides,
        }}
        >
            <MemoryRouter>
                <GroupsField />
            </MemoryRouter>
        </WorkAppContext.Provider>,
    )
}

describe('GroupsField', () => {
    it('shows the create group link for users who can manage groups', () => {
        renderGroupsField({
            isManager: true,
        })

        expect(screen.getByTestId('groups-select'))
            .toBeInTheDocument()

        const createGroupLink = screen.getByRole('link', {
            name: 'Create Group',
        })

        expect(createGroupLink)
            .toHaveAttribute('href', '/work/groups')
        expect(createGroupLink)
            .toHaveAttribute('rel', 'noreferrer')
        expect(createGroupLink)
            .toHaveAttribute('target', '_blank')
    })

    it('hides the create group link for users who cannot manage groups', () => {
        renderGroupsField()

        expect(screen.queryByRole('link', {
            name: 'Create Group',
        })).not.toBeInTheDocument()
    })
})
