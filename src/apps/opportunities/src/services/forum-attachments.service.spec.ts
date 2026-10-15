import { init } from 'filestack-js'

import { uploadForumAttachment } from './forum-attachments.service'

jest.mock('filestack-js', () => ({ init: jest.fn() }))
jest.mock('~/config', () => ({ EnvironmentConfig: { FILESTACK: { API_KEY: 'test' } } }), { virtual: true })

describe('forum attachments', () => {
    it('preserves a safe image URL and strips Markdown syntax from the filename', async () => {
        const upload = jest.fn()
            .mockResolvedValue({ url: 'https://cdn.example/image' });
        (init as jest.Mock).mockReturnValue({ upload })
        await expect(uploadForumAttachment(new File(['image'], 'a[bad].png', { type: 'image/png' })))
            .resolves.toBe('![abad.png](<https://cdn.example/image>)')
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
