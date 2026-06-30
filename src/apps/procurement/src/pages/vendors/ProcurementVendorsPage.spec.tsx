/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind, sort-keys */
import { PropsWithChildren } from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'

import {
    createVendor,
    deleteVendor,
    getVendors,
    updateVendor,
} from '../../lib/services'

import { ProcurementVendorsPage } from './ProcurementVendorsPage'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        PROCUREMENT_API: 'https://api.test/v6/procurement',
    },
}), {
    virtual: true,
})

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: PropsWithChildren<{
        open: boolean
        title?: string
    }>) => (
        props.open ? (
            <div aria-label={props.title} role='dialog'>
                {!!props.title && <h2>{props.title}</h2>}
                {props.children}
            </div>
        ) : <></>
    ),
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
        type?: 'button' | 'submit'
    }) => (
        <button
            disabled={props.disabled}
            onClick={props.onClick}
            type={props.type === 'submit' ? 'submit' : 'button'}
        >
            {props.label}
        </button>
    ),
    ConfirmModal: (props: PropsWithChildren<{
        action?: string
        onClose: () => void
        onConfirm: () => void
        open: boolean
        title: string
    }>) => (
        props.open ? (
            <div aria-label={props.title} role='dialog'>
                <h2>{props.title}</h2>
                {props.children}
                <button onClick={props.onConfirm} type='button'>{props.action || 'Confirm'}</button>
                <button onClick={props.onClose} type='button'>Cancel</button>
            </div>
        ) : <></>
    ),
}), {
    virtual: true,
})

jest.mock('../../lib/services', () => ({
    createVendor: jest.fn(),
    deleteVendor: jest.fn(),
    getVendors: jest.fn(),
    updateVendor: jest.fn(),
}))

const mockedCreateVendor = createVendor as jest.Mock
const mockedDeleteVendor = deleteVendor as jest.Mock
const mockedGetVendors = getVendors as jest.Mock
const mockedUpdateVendor = updateVendor as jest.Mock

const vendor = {
    category: 'Software',
    contactEmail: 'buyer@example.com',
    contactName: 'Buyer One',
    contactPhone: '+1 555 0100',
    createdAt: '2026-01-01T00:00:00.000Z',
    id: 'vendor-1',
    name: 'Acme Software',
    updatedAt: '2026-01-02T00:00:00.000Z',
}

describe('ProcurementVendorsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedCreateVendor.mockResolvedValue(vendor)
        mockedDeleteVendor.mockResolvedValue(vendor)
        mockedGetVendors.mockResolvedValue([vendor])
        mockedUpdateVendor.mockResolvedValue(vendor)
    })

    it('creates vendors through the modal form', async () => {
        render(<ProcurementVendorsPage />)

        expect(await screen.findByText('Acme Software'))
            .toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Add vendor' }))
        fireEvent.change(screen.getByLabelText('Vendor name'), {
            target: {
                value: 'New Vendor',
            },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Create vendor' }))

        await waitFor(() => expect(mockedCreateVendor)
            .toHaveBeenCalledWith(expect.objectContaining({
                name: 'New Vendor',
            })))
    })

    it('updates and deletes vendors through row actions', async () => {
        render(<ProcurementVendorsPage />)

        expect(await screen.findByText('Acme Software'))
            .toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
        fireEvent.change(screen.getByLabelText('Category'), {
            target: {
                value: 'Services',
            },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Save vendor' }))

        await waitFor(() => expect(mockedUpdateVendor)
            .toHaveBeenCalledWith('vendor-1', expect.objectContaining({
                category: 'Services',
            })))

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
        fireEvent.click(within(screen.getByRole('dialog', { name: 'Delete vendor' }))
            .getByRole('button', { name: 'Delete' }))

        await waitFor(() => expect(mockedDeleteVendor)
            .toHaveBeenCalledWith('vendor-1'))
    })
})
