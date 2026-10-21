/* eslint-disable import/no-extraneous-dependencies -- Testing Library is a test-only dependency. */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import { isMachineAccessEnabled } from './config'
import { machineRequest } from './machine-access.api'
import MachineAccessPage from './MachineAccessPage'

jest.mock('~/config', () => ({ EnvironmentConfig: { ENV: 'dev' } }), { virtual: true })
jest.mock('./machine-access.api', () => ({ machineRequest: jest.fn() }))

const request = machineRequest as jest.Mock
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
        request.mockReset()
        request.mockImplementation(async (path: string, method?: string) => {
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
                    items: [
                        {
                            description: 'Read groups',
                            name: 'read:groups',
                            owner: 'platform',
                            revision: 1,
                            state: 'ready',
                        },
                    ],
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
        const input = screen.getByLabelText('Permission name') as HTMLInputElement
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
})
