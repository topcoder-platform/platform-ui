import { init } from 'filestack-js'

import { uploadForumAttachment } from './forum-attachments.service'

jest.mock('filestack-js', () => ({ init: jest.fn() }))
jest.mock('~/config', () => ({ EnvironmentConfig: { FILESTACK: { API_KEY: 'test' } } }), { virtual: true })

describe('forum attachments', () => {
    it.each([
        ['document.xml', 'application/xml'],
        ['document.xml', 'text/xml'],
        ['DOCUMENT.XML', ''],
        ['document.xml', 'text/plain'],
        ['document', 'application/xml'],
    ])('uploads XML as a download while preserving the file: %s (%s)', async (name, type) => {
        const upload = jest.fn()
            .mockResolvedValue({ url: 'https://cdn.example/file' });
        (init as jest.Mock).mockReturnValue({ upload })
        const file = new File(['<?xml version="1.0"?><document>test</document>'], name, { type })

        await expect(uploadForumAttachment(file))
            .resolves.toBe(`[${name}](<https://cdn.example/file>)`)
        expect(upload)
            .toHaveBeenCalledWith(file, expect.any(Object), { mimetype: 'application/octet-stream' })
    })

    it('preserves a safe image URL and strips Markdown syntax from the filename', async () => {
        const upload = jest.fn()
            .mockResolvedValue({ url: 'https://cdn.example/image' });
        (init as jest.Mock).mockReturnValue({ upload })
        const file = new File(['image'], 'a[bad].png', { type: 'image/png' })
        await expect(uploadForumAttachment(file))
            .resolves.toBe('![abad.png](<https://cdn.example/image>)')
        expect(upload)
            .toHaveBeenCalledWith(file, expect.any(Object), undefined)
    })
    it('uses download links for active content and rejects invalid service URLs', async () => {
        const upload = jest.fn()
            .mockResolvedValue({ url: 'https://cdn.example/file' });
        (init as jest.Mock).mockReturnValue({ upload })
        await expect(uploadForumAttachment(new File(['<svg/>'], 'image.svg', { type: 'image/svg+xml' })))
            .resolves.toBe('[image.svg](<https://cdn.example/file>)')
        upload.mockResolvedValue({ url: 'http://insecure.example/file' })
        await expect(uploadForumAttachment(new File(['x'], 'file'))).rejects.toThrow('invalid attachment URL')
    })
    it('rejects empty files before uploading', async () => {
        await expect(uploadForumAttachment(new File([], 'empty.txt'))).rejects.toThrow('25 MB')
    })
})
