/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { uploadFile } from '~/libs/shared/lib/services/s3-upload'

import {
    MAX_SUPPORT_ATTACHMENT_BYTES,
    SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES,
    SUPPORT_ATTACHMENT_MIME_TYPES_BY_EXTENSION,
    uploadSupportAttachment,
} from './support-attachment.service'

jest.mock('~/libs/shared/lib/services/s3-upload', () => ({
    uploadFile: jest.fn(),
}), { virtual: true })

const mockedUpload = uploadFile as jest.Mock

describe('Support attachment service', () => {
    beforeEach(() => {
        mockedUpload.mockReset()
    })

    it('uses the support purpose and returns durable Files API metadata for Markdown', async () => {
        const file = new File(['image'], 'screenshot.png', { type: 'image/png' })
        const result = {
            filename: 'screenshot.png',
            handle: 'uppy/support/test/screenshot.png',
            key: 'uppy/support/test/screenshot.png',
            mimetype: 'image/png',
            size: file.size,
            url: 'https://api.example.test/v6/uploads/files/read-capability',
        }
        mockedUpload.mockResolvedValue(result)

        await expect(uploadSupportAttachment(file)).resolves.toEqual(result)
        expect(mockedUpload)
            .toHaveBeenCalledWith(file, {
                allowedFileTypes: SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES,
                onProgress: undefined,
                purpose: 'support',
            })
    })

    it('forwards shared uploader progress to the Markdown editor', async () => {
        const onProgress = jest.fn()
        mockedUpload.mockImplementationOnce((_file, options) => {
            options.onProgress(13)
            options.onProgress(100)
            return Promise.resolve({
                filename: 'notes.txt',
                handle: 'uppy/support/test/notes.txt',
                url: 'https://api.example.test/v6/uploads/files/read-capability',
            })
        })
        await uploadSupportAttachment(
            new File(['notes'], 'notes.txt', { type: 'text/plain' }),
            { onProgress },
        )
        expect(onProgress.mock.calls)
            .toEqual([[13], [100]])
    })

    it('accepts the inclusive two-MiB boundary', async () => {
        const file = new File([new Uint8Array(MAX_SUPPORT_ATTACHMENT_BYTES)], 'boundary.txt', { type: 'text/plain' })
        mockedUpload.mockResolvedValue({ url: 'https://api.example.test/v6/uploads/files/read-capability' })
        await uploadSupportAttachment(file)
        expect(mockedUpload)
            .toHaveBeenCalledTimes(1)
    })

    it.each([502, 503, 504])('normalizes HTTP %s, including HTML gateway responses', async status => {
        mockedUpload.mockRejectedValue({
            isAxiosError: true,
            message: 'Request failed',
            response: { data: '<html><h1>Bad Gateway</h1></html>', status },
        })

        await expect(uploadSupportAttachment(new File(['notes'], 'notes.txt', { type: 'text/plain' })))
            .rejects.toThrow('Attachment uploads are temporarily unavailable. Please try again.')
        expect(mockedUpload)
            .toHaveBeenCalledTimes(1)
    })

    it.each(['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'])('normalizes %s failures', async code => {
        mockedUpload.mockRejectedValue({ code, isAxiosError: true })

        await expect(uploadSupportAttachment(new File(['notes'], 'notes.txt', { type: 'text/plain' })))
            .rejects.toThrow('Attachment uploads are temporarily unavailable. Please try again.')
    })

    it('preserves API validation failures', async () => {
        const error = Object.assign(new Error('The file name is invalid.'), {
            isAxiosError: true,
            response: { status: 400 },
        })
        mockedUpload.mockRejectedValue(error)

        await expect(uploadSupportAttachment(new File(['notes'], 'notes.txt', { type: 'text/plain' })))
            .rejects.toBe(error)
    })

    it('exports the API extension and MIME allowlist for upload controls', () => {
        expect(Object.keys(SUPPORT_ATTACHMENT_MIME_TYPES_BY_EXTENSION))
            .toEqual([
                '.7z', '.bmp', '.csv', '.doc', '.docx', '.gif', '.gz', '.jpeg', '.jpg',
                '.json', '.log', '.pdf', '.png', '.ppt', '.pptx', '.rar', '.tar', '.tgz',
                '.tif', '.tiff', '.txt', '.webp', '.xls', '.xlsx', '.xml', '.zip',
            ])
        expect(SUPPORT_ATTACHMENT_MIME_TYPES_BY_EXTENSION['.gz'])
            .toEqual(['application/gzip', 'application/x-gzip'])
        expect(SUPPORT_ATTACHMENT_MIME_TYPES_BY_EXTENSION['.xml'])
            .toEqual(['application/xml', 'text/xml'])
        expect(SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES)
            .toEqual(expect.arrayContaining([
                '.png',
                '.tgz',
                'application/gzip',
                'image/png',
            ]))
        expect(SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES)
            .not.toContain('.html')
        expect(SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES)
            .not.toContain('.svg')
        expect(SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES)
            .not.toContain('image/svg+xml')
        expect(SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES)
            .not.toContain('text/html')
    })

    it('rejects unsupported extensions and extension/MIME mismatches before upload', async () => {
        const svg = new File(['svg'], 'diagram.svg', { type: 'image/svg+xml' })
        const mismatch = new File(['text'], 'notes.txt', { type: 'application/json' })

        await expect(uploadSupportAttachment(svg))
            .rejects.toThrow('This file type is not allowed for support attachments.')
        await expect(uploadSupportAttachment(mismatch))
            .rejects.toThrow('This file type is not allowed for support attachments.')
        expect(mockedUpload)
            .not.toHaveBeenCalled()
    })

    it('rejects empty and oversized files before making a request', async () => {
        const empty = new File([], 'empty.txt', { type: 'text/plain' })
        const oversized = new File(['x'], 'large.zip', { type: 'application/zip' })
        Object.defineProperty(oversized, 'size', {
            value: MAX_SUPPORT_ATTACHMENT_BYTES + 1,
        })

        await expect(uploadSupportAttachment(empty))
            .rejects.toThrow('The selected attachment is empty.')
        await expect(uploadSupportAttachment(oversized))
            .rejects.toThrow('larger than the 2 MB attachment limit')
        expect(mockedUpload)
            .not.toHaveBeenCalled()
    })
})
