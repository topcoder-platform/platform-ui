/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import { OpportunityRoleSelect } from './OpportunityRoleSelect'

const roles = [
    { label: 'Designer', value: 'DESIGNER' },
    { label: 'Software Developer', value: 'SOFTWARE_DEVELOPER' },
    { label: 'Data Scientist', value: 'DATA_SCIENTIST' },
    { label: 'Data Engineer', value: 'DATA_ENGINEER' },
]

describe('OpportunityRoleSelect', () => {
    it('opens the authored four-row listbox and selects by pointer', () => {
        const onChange = jest.fn()
        render(
            <OpportunityRoleSelect
                describedBy='role-help'
                onChange={onChange}
                options={roles}
                value=''
            />,
        )

        const control = screen.getByRole('combobox', { name: 'Role' })
        expect(control)
            .toHaveAttribute('aria-expanded', 'false')
        fireEvent.click(control)
        expect(control)
            .toHaveAttribute('aria-expanded', 'true')
        expect(screen.getAllByRole('option'))
            .toHaveLength(4)
        fireEvent.click(screen.getByRole('option', { name: 'Data Scientist' }))
        expect(onChange)
            .toHaveBeenCalledWith('DATA_SCIENTIST')
        expect(screen.queryByRole('listbox'))
            .not.toBeInTheDocument()
    })

    it('supports arrow, Enter, and Escape keyboard interaction', () => {
        const onChange = jest.fn()
        render(
            <OpportunityRoleSelect
                describedBy='role-help'
                onChange={onChange}
                options={roles}
                value='DESIGNER'
            />,
        )

        const control = screen.getByRole('combobox', { name: 'Role' })
        fireEvent.keyDown(control, { key: 'ArrowDown' })
        fireEvent.keyDown(control, { key: 'Enter' })
        expect(onChange)
            .toHaveBeenCalledWith('SOFTWARE_DEVELOPER')
        fireEvent.click(control)
        fireEvent.keyDown(control, { key: 'Escape' })
        expect(screen.queryByRole('listbox'))
            .not.toBeInTheDocument()
    })
})
