/* eslint-disable import/no-extraneous-dependencies -- Testing Library is a test-only dependency. */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'

import { isMachineAccessEnabled } from './config'
import { machineRequest } from './machine-access.api'
import MachineAccessPage, { groupScopes } from './MachineAccessPage'

jest.mock('~/config', () => ({ EnvironmentConfig: { ENV: 'dev' } }), { virtual: true })
jest.mock('./machine-access.api', () => ({ machineRequest: jest.fn() }))
// The platform modal renders in a portal; a minimal dialog keeps these specs independent of the UI library.
jest.mock('~/libs/ui', () => {
    const { createElement }: typeof import('react') = jest.requireActual('react')
    return {
        BaseModal: (props: { children?: import('react').ReactNode; open: boolean; title?: string }) => (
            props.open && createElement('div', { 'aria-label': props.title, role: 'dialog' }, props.children)
        ),
    }
}, { virtual: true })

const request = machineRequest as jest.Mock
const writeText: jest.Mock = jest.fn()
type ScopeFixture = { description: string; name: string; owner: string; revision: number; state: string }

/** Build a ready catalog scope fixture for the given permission name. */
function readyScope(name: string): ScopeFixture {
    return { description: `Grant ${name}`, name, owner: 'platform', revision: 1, state: 'ready' }
}

const client = {
    allowedScopes: ['read:groups'],
    appliedRevision: 1,
    clientId: 'm2m-reader',
    defaultScopes: ['read:groups'],
    description: 'Reader',
    enabled: true,
    name: 'Reader',
    owner: 'platform',
    revision: 1,
    state: 'ready',
}

describe('DEV Machine Access', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'crypto', {
            configurable: true,
            value: { randomUUID: () => 'operation-ui-test-001' },
        })
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
        writeText.mockReset()
        writeText.mockResolvedValue(undefined)
        request.mockReset()
        request.mockImplementation(async (path: string, method?: string) => {
            if (path === 'clients/m2m-reader/secret') {
                return { clientId: 'm2m-reader', secret: 'current-test-secret' }
            }

            if (method === 'POST' && path === 'scopes') return { operation: { state: 'completed' } }
            if (method === 'POST') {
                return {
                    clientId: 'm2m-new-reader',
                    operation: { state: 'completed' },
                    secret: 'one-time-test-secret',
                }
            }

            if (path === 'clients') return { items: [client], next: undefined }
            if (path === 'scopes') {
                return {
                    items: ['write:groups', 'read:groups', 'read:members', 'read:challenges'].map(readyScope),
                    next: undefined,
                }
            }

            return { items: [], next: undefined }
        })
    })

    it('accepts existing case-sensitive and bare permission names', async () => {
        render(<MachineAccessPage />)
        await screen.findByText('Reader', { selector: 'strong' })
        fireEvent.click(screen.getByRole('tab', { name: 'Scope catalog' }))
        expect(screen.queryByRole('button', { name: 'Refresh' }))
            .toBeNull()
        await waitFor(() => expect(screen.getByRole('button', { name: 'Add scope' }))
            .toBeEnabled())
        fireEvent.click(screen.getByRole('button', { name: 'Add scope' }))
        const input = within(screen.getByRole('dialog', { name: 'Add scope' }))
            .getByLabelText('Permission name') as HTMLInputElement
        for (const name of ['auth0', 'challengesRAG:admin', 'read:usersRole']) {
            fireEvent.change(input, { target: { value: name } })
            expect(input.checkValidity())
                .toBe(true)
            expect(input.value)
                .toBe(name)
        }

        fireEvent.change(input, { target: { value: 'read:*' } })
        expect(input.checkValidity())
            .toBe(false)
    })

    it('enables only explicit DEV environments and hosts', () => {
        expect(isMachineAccessEnabled('dev', 'admin.topcoder-dev.com'))
            .toBe(true)
        expect(isMachineAccessEnabled('prod', 'admin.topcoder-dev.com'))
            .toBe(false)
        expect(isMachineAccessEnabled('dev', 'admin.topcoder.com'))
            .toBe(false)
        expect(isMachineAccessEnabled('dev', 'topcoder-dev.com.attacker.example'))
            .toBe(false)
    })

    it('keeps defaults within allowed scopes and dismisses the one-time secret', async () => {
        render(<MachineAccessPage />)
        await screen.findByText('Reader', { selector: 'strong' })
        fireEvent.click(screen.getByRole('button', { name: 'Create client' }))
        expect(screen.getByLabelText('Default read:groups'))
            .toBeDisabled()
        fireEvent.change(screen.getByLabelText(/^Client ID/), { target: { value: 'm2m-new-reader' } })
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New reader' } })
        fireEvent.change(screen.getByLabelText('Owner'), { target: { value: 'platform' } })
        fireEvent.click(screen.getByLabelText('Allow read:groups'))
        fireEvent.click(screen.getByLabelText('Default read:groups'))
        fireEvent.change(screen.getByLabelText('Reason for change'), {
            target: { value: 'Onboard test reader' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Apply changes' }))
        await screen.findByDisplayValue('one-time-test-secret')
        fireEvent.click(screen.getByRole('button', { name: 'Copy client secret' }))
        await screen.findByText('Client secret copied to clipboard.')
        expect(writeText)
            .toHaveBeenCalledWith('one-time-test-secret')
        expect(request)
            .toHaveBeenCalledWith(
                'clients',
                'POST',
                expect.objectContaining({
                    allowedScopes: ['read:groups'],
                    defaultScopes: ['read:groups'],
                    reason: 'Onboard test reader',
                }),
                'operation-ui-test-001',
            )
        fireEvent.click(screen.getByRole('button', { name: 'I have stored the credential' }))
        expect(screen.queryByDisplayValue('one-time-test-secret')).not.toBeInTheDocument()
    })

    it('requires an audit reason and explicit confirmation before disabling a client', async () => {
        render(<MachineAccessPage />)
        await screen.findByText('Reader', { selector: 'strong' })
        fireEvent.click(screen.getByRole('button', { name: 'Manage' }))
        fireEvent.click(screen.getByRole('button', { name: 'Disable client' }))
        const confirm = screen.getByRole('button', { name: /Confirm.*disablement/ })
        expect(confirm)
            .toBeDisabled()
        expect(request.mock.calls.some(call => call[1] === 'POST'))
            .toBe(false)
        fireEvent.change(screen.getByLabelText('Reason for change'), {
            target: { value: 'Workload retired' },
        })
        fireEvent.click(confirm)
        await waitFor(() => expect(request)
            .toHaveBeenCalledWith(
                'clients/m2m-reader/disable',
                'POST',
                {
                    reason: 'Workload retired',
                    revision: 1,
                },
                'operation-ui-test-001',
            ))
    })

    it('adds scopes from a dialog and closes it after the change applies', async () => {
        render(<MachineAccessPage />)
        await screen.findByText('Reader', { selector: 'strong' })
        fireEvent.click(screen.getByRole('tab', { name: 'Scope catalog' }))
        expect(screen.queryByRole('dialog'))
            .toBeNull()
        await waitFor(() => expect(screen.getByRole('button', { name: 'Add scope' }))
            .toBeEnabled())
        fireEvent.click(screen.getByRole('button', { name: 'Add scope' }))
        const dialog = within(screen.getByRole('dialog', { name: 'Add scope' }))
        fireEvent.change(dialog.getByLabelText('Permission name'), { target: { value: 'read:reports' } })
        fireEvent.change(dialog.getByLabelText('Description'), { target: { value: 'Read reports' } })
        fireEvent.change(dialog.getByLabelText('Owning team'), { target: { value: 'platform' } })
        fireEvent.change(dialog.getByLabelText('Reason'), { target: { value: 'Reports API' } })
        fireEvent.click(dialog.getByRole('button', { name: 'Apply scope' }))
        await waitFor(() => expect(screen.queryByRole('dialog'))
            .toBeNull())
        expect(request)
            .toHaveBeenCalledWith(
                'scopes',
                'POST',
                {
                    description: 'Read reports',
                    name: 'read:reports',
                    owner: 'platform',
                    reason: 'Reports API',
                    revision: 0,
                },
                'operation-ui-test-001',
            )
    })

    it('lists the saved allowed scopes first and filters both groups by scope name', async () => {
        render(<MachineAccessPage />)
        await screen.findByText('Reader', { selector: 'strong' })
        fireEvent.click(screen.getByRole('button', { name: 'Manage' }))
        const allowed = screen.getByRole('region', { name: 'Allowed for this client' })
        const other = screen.getByRole('region', { name: 'Other scopes' })
        /** Read the allow-checkbox labels of one scope group in display order. */
        function names(group: HTMLElement): (string | null)[] {
            return within(group)
                .getAllByRole('checkbox', { name: /^Allow / })
                .map(box => box.getAttribute('aria-label'))
        }

        expect(names(allowed))
            .toEqual(['Allow read:groups'])
        expect(names(other))
            .toEqual(['Allow read:challenges', 'Allow read:members', 'Allow write:groups'])
        fireEvent.click(within(other)
            .getByLabelText('Allow write:groups'))
        expect(names(other))
            .toEqual(['Allow read:challenges', 'Allow read:members', 'Allow write:groups'])
        fireEvent.change(screen.getByLabelText('Search scopes'), { target: { value: 'MEM' } })
        expect(names(other))
            .toEqual(['Allow read:members'])
        expect(within(allowed)
            .getByText('No allowed scopes match the search.'))
            .toBeInTheDocument()
    })

    it('copies an existing secret unrendered, revealing it only when the clipboard is blocked', async () => {
        render(<MachineAccessPage />)
        await screen.findByText('Reader', { selector: 'strong' })
        fireEvent.click(screen.getByRole('button', { name: 'Manage' }))
        fireEvent.click(screen.getByRole('button', { name: 'Copy client secret' }))
        await screen.findByText('Client secret copied to clipboard.')
        expect(request)
            .toHaveBeenCalledWith('clients/m2m-reader/secret', 'POST')
        expect(writeText)
            .toHaveBeenCalledWith('current-test-secret')
        expect(screen.queryByDisplayValue('current-test-secret'))
            .toBeNull()
        writeText.mockRejectedValueOnce(new Error('denied'))
        fireEvent.click(screen.getByRole('button', { name: 'Copy client secret' }))
        expect((await screen.findByLabelText('Client secret') as HTMLInputElement).value)
            .toBe('current-test-secret')
        fireEvent.click(screen.getByRole('button', { name: 'Hide secret' }))
        expect(screen.queryByDisplayValue('current-test-secret'))
            .toBeNull()
    })

    it('groups ready scopes by saved grants and matches names case-insensitively', () => {
        const catalog: ScopeFixture[] = [
            readyScope('write:groups'),
            readyScope('read:groups'),
            { ...readyScope('read:pending'), state: 'pending' },
        ]
        expect(groupScopes(catalog, ['write:groups'], ' GROUP '))
            .toEqual({ allowed: [readyScope('write:groups')], other: [readyScope('read:groups')] })
        expect(groupScopes(catalog, [], 'none').other)
            .toEqual([])
    })
})
