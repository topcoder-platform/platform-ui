/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrPostAsync } from '~/libs/core'

import {
    MAX_SUPPORT_ATTACHMENT_BYTES,
    SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES,
    SUPPORT_ATTACHMENT_MIME_TYPES_BY_EXTENSION,
    uploadSupportAttachment,
} from './support-attachment.service'
import { SUPPORT_API_BASE } from './support.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: { API: { V6: 'https://api.example.test/v6' } },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrPostAsync: jest.fn(),
}), { virtual: true })

const mockedPost = xhrPostAsync as jest.Mock

describe('Support attachment service', () => {
    beforeEach(() => {
        mockedPost.mockReset()
    })

    it('posts one file to the authenticated multipart endpoint and returns its metadata', async () => {
        const file = new File(['image'], 'screenshot.png', { type: 'image/png' })
        const result = {
            filename: 'screenshot.png',
            handle: 'hosted-handle',
            mimetype: 'image/png',
            size: file.size,
            url: 'https://cdn.filestackcontent.com/hosted-handle',
        }
        mockedPost.mockResolvedValue(result)

        await expect(uploadSupportAttachment(file)).resolves.toEqual(result)

        expect(mockedPost)
            .toHaveBeenCalledWith(
                `${SUPPORT_API_BASE}/attachments`,
                expect.any(FormData),
                expect.objectContaining({
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: expect.any(Function),
                }),
            )
        const formData = mockedPost.mock.calls[0][1] as FormData
        expect(formData.getAll('file'))
            .toEqual([file])
    })

    it('reports bounded, rounded upload progress', async () => {
        const onProgress = jest.fn()
        mockedPost.mockImplementationOnce((_url, _data, config) => {
            config.onUploadProgress({ loaded: 1, progress: 0.126, total: 8 })
            config.onUploadProgress({ loaded: 10, total: 8 })
            return Promise.resolve({
                filename: 'notes.txt',
                handle: 'notes-handle',
                url: 'https://cdn.filestackcontent.com/notes-handle',
            })
        })

        await uploadSupportAttachment(
            new File(['notes'], 'notes.txt', { type: 'text/plain' }),
            { onProgress },
        )

        expect(onProgress.mock.calls)
            .toEqual([[13], [100]])
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
        expect(mockedPost)
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
        expect(mockedPost)
            .not.toHaveBeenCalled()
    })
})
