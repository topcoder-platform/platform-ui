/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { uploadEngagementAttachment } from '../../../lib/services'

import CvUploadField, { CV_MAX_FILE_SIZE_BYTES } from './CvUploadField'

jest.mock('../../../lib/services', () => ({
    uploadEngagementAttachment: jest.fn(),
}))

const mockedUpload = uploadEngagementAttachment as jest.MockedFunction<typeof uploadEngagementAttachment>

const getFileInput = (container: HTMLElement): HTMLInputElement => (
    container.querySelector('input[type="file"]') as HTMLInputElement
)

const selectFile = (container: HTMLElement, file: File): void => {
    fireEvent.change(getFileInput(container), { target: { files: [file] } })
}

describe('CvUploadField', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('uploads the selected CV through Filestack and reports the stored file URL', async () => {
        mockedUpload.mockResolvedValue({
            filename: 'jane-cv.pdf',
            handle: 'cv-handle',
            url: 'https://cdn.filestackcontent.com/cv-handle',
        })
        const onChange = jest.fn()
        const onUploadingChange = jest.fn()
        const { container }: { container: HTMLElement } = render(
            <CvUploadField
                engagementId='engagement-1'
                onChange={onChange}
                onUploadingChange={onUploadingChange}
            />,
        )

        const file = new File(['cv'], 'jane-cv.pdf', { type: 'application/pdf' })
        selectFile(container, file)

        await waitFor(() => {
            expect(onChange)
                .toHaveBeenCalledWith('https://cdn.filestackcontent.com/cv-handle')
        })
        expect(mockedUpload)
            .toHaveBeenCalledWith(file, expect.objectContaining({
                category: 'application-cv',
                engagementId: 'engagement-1',
            }))
        expect(onUploadingChange.mock.calls)
            .toEqual([[true], [false]])
    })

    it('shows the uploaded CV and clears it on remove', () => {
        const onChange = jest.fn()
        render(
            <CvUploadField
                onChange={onChange}
                value='https://cdn.filestackcontent.com/cv-handle'
            />,
        )

        expect(screen.getByRole('link', { name: 'View uploaded CV' }))
            .toHaveAttribute('href', 'https://cdn.filestackcontent.com/cv-handle')
        expect(screen.queryByRole('button', { name: 'Upload CV' }))
            .not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

        expect(onChange)
            .toHaveBeenCalledWith(undefined)
    })

    it('rejects unsupported file types without uploading', () => {
        const onChange = jest.fn()
        const { container }: { container: HTMLElement } = render(<CvUploadField onChange={onChange} />)

        selectFile(container, new File(['cv'], 'cv.exe'))

        expect(screen.getByText('Only PDF, DOC and DOCX files are allowed.'))
            .toBeInTheDocument()
        expect(mockedUpload)
            .not.toHaveBeenCalled()
        expect(onChange)
            .not.toHaveBeenCalled()
    })

    it('rejects files larger than the size limit without uploading', () => {
        const { container }: { container: HTMLElement } = render(<CvUploadField onChange={jest.fn()} />)
        const oversized = new File(['cv'], 'cv.docx')
        Object.defineProperty(oversized, 'size', { value: CV_MAX_FILE_SIZE_BYTES + 1 })

        selectFile(container, oversized)

        expect(screen.getByText('CV must be 8 MB or smaller.'))
            .toBeInTheDocument()
        expect(mockedUpload)
            .not.toHaveBeenCalled()
    })

    it('shows the upload error when Filestack rejects the file', async () => {
        mockedUpload.mockRejectedValue(new Error('File uploads are not configured for this environment.'))
        const onChange = jest.fn()
        const { container }: { container: HTMLElement } = render(<CvUploadField onChange={onChange} />)

        selectFile(container, new File(['cv'], 'cv.pdf'))

        expect(await screen.findByText('File uploads are not configured for this environment.'))
            .toBeInTheDocument()
        expect(onChange)
            .not.toHaveBeenCalled()
        expect(screen.getByRole('button', { name: 'Upload CV' }))
            .toBeInTheDocument()
    })
})
