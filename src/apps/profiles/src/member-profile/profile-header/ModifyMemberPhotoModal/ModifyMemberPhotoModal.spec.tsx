/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { PropsWithChildren, ReactNode } from 'react'
import type { RenderResult } from '@testing-library/react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import ModifyMemberPhotoModal from './ModifyMemberPhotoModal'

jest.mock('~/libs/core', () => ({
    updateMemberPhotoAsync: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: PropsWithChildren<{ buttons: ReactNode }>): JSX.Element => (
        <div>
            {props.children}
            {props.buttons}
        </div>
    ),
    Button: (props: {
        disabled?: boolean
        label: string
        onClick: () => void
    }): JSX.Element => (
        <button disabled={props.disabled} type='button' onClick={props.onClick}>
            {props.label}
        </button>
    ),
}), { virtual: true })

const pngSignature: ReadonlyArray<number> = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
const originalCreateImageBitmap: PropertyDescriptor | undefined
    = Object.getOwnPropertyDescriptor(window, 'createImageBitmap')
const originalCreateObjectUrl: PropertyDescriptor | undefined
    = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
const originalRevokeObjectUrl: PropertyDescriptor | undefined
    = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')

const mockCreateImageBitmap = jest.fn()
const mockCreateObjectUrl = jest.fn()
const mockRevokeObjectUrl = jest.fn()
const mockDrawImage = jest.fn()
const mockCloseBitmap = jest.fn()

function restoreProperty(
    target: object,
    property: string,
    descriptor: PropertyDescriptor | undefined,
): void {
    if (descriptor) {
        Object.defineProperty(target, property, descriptor)
    } else {
        Reflect.deleteProperty(target, property)
    }
}

describe('ModifyMemberPhotoModal image preview', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        Object.defineProperty(window, 'createImageBitmap', {
            configurable: true,
            value: mockCreateImageBitmap,
        })
        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            value: mockCreateObjectUrl,
        })
        Object.defineProperty(URL, 'revokeObjectURL', {
            configurable: true,
            value: mockRevokeObjectUrl,
        })

        mockCreateImageBitmap.mockResolvedValue({
            close: mockCloseBitmap,
            height: 1_000,
            width: 4_000,
        } as unknown as ImageBitmap)
    })

    afterEach(() => {
        jest.restoreAllMocks()
        restoreProperty(window, 'createImageBitmap', originalCreateImageBitmap)
        restoreProperty(URL, 'createObjectURL', originalCreateObjectUrl)
        restoreProperty(URL, 'revokeObjectURL', originalRevokeObjectUrl)
    })

    it('renders a canvas-reencoded preview and revokes its URL on cleanup', async () => {
        const sanitizedPreview: Blob = new Blob(['sanitized'], { type: 'image/png' })
        jest.spyOn(HTMLCanvasElement.prototype, 'getContext')
            .mockReturnValue({ drawImage: mockDrawImage } as unknown as CanvasRenderingContext2D)
        jest.spyOn(HTMLCanvasElement.prototype, 'toBlob')
            .mockImplementation((callback: BlobCallback) => callback(sanitizedPreview))
        mockCreateObjectUrl.mockReturnValue('blob:sanitized-preview')

        const view: RenderResult = render(
            <ModifyMemberPhotoModal
                onClose={jest.fn()}
                onSave={jest.fn()}
                profile={{ handle: 'member' } as any}
            />,
        )
        const fileInput: HTMLInputElement
            = view.container.querySelector('input[type="file"]') as HTMLInputElement
        const selectedFile: File = new File(
            [new Uint8Array([...pngSignature, 0x00])],
            'profile.png',
            { type: 'image/png' },
        )

        fireEvent.change(fileInput, { target: { files: [selectedFile] } })

        expect(screen.getByRole('button', { name: 'Save profile picture' }))
            .toBeDisabled()

        await waitFor(() => expect(screen.getByRole('img', { name: 'preview' }))
            .toHaveAttribute('src', 'blob:sanitized-preview'))

        expect(mockCreateImageBitmap)
            .toHaveBeenCalledWith(selectedFile)
        expect(mockDrawImage)
            .toHaveBeenCalledWith(expect.anything(), 0, 0, 2_048, 512)
        expect(mockCreateObjectUrl)
            .toHaveBeenCalledWith(sanitizedPreview)
        expect(screen.getByRole('button', { name: 'Save profile picture' }))
            .toBeEnabled()
        expect(mockCloseBitmap)
            .toHaveBeenCalledTimes(1)

        view.unmount()

        expect(mockRevokeObjectUrl)
            .toHaveBeenCalledWith('blob:sanitized-preview')
    })

    it('rejects a file whose content does not match its image MIME type', async () => {
        const view: RenderResult = render(
            <ModifyMemberPhotoModal
                onClose={jest.fn()}
                onSave={jest.fn()}
                profile={{ handle: 'member' } as any}
            />,
        )
        const fileInput: HTMLInputElement
            = view.container.querySelector('input[type="file"]') as HTMLInputElement
        const disguisedHtml: File = new File(
            ['<script>alert(1)</script>'],
            'profile.png',
            { type: 'image/png' },
        )

        fireEvent.change(fileInput, { target: { files: [disguisedHtml] } })

        expect(await screen.findByText('Please select a valid PNG or JPG image.'))
            .toBeInTheDocument()
        expect(screen.queryByRole('img', { name: 'preview' }))
            .not
            .toBeInTheDocument()
        expect(mockCreateImageBitmap)
            .not
            .toHaveBeenCalled()
    })
})
