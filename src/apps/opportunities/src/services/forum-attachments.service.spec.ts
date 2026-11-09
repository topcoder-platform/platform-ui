import { pickFiles, uploadFile } from '~/libs/shared/lib/services/s3-upload'

import { pickForumAttachments, uploadForumAttachment } from './forum-attachments.service'

jest.mock('~/libs/shared/lib/services/s3-upload', () => ({
    pickFiles: jest.fn(), uploadFile: jest.fn(),
}), { virtual: true })

describe('forum attachments', () => {
    beforeEach(() => {
        (uploadFile as jest.Mock).mockImplementation(async file => ({
            filename: file.name, mimetype: file.type, url: 'https://files.example/file',
        }))
    })
    it('uploads XML as a downloadable attachment without modifying its bytes', async () => {
        const file = new File(['<document/>'], 'document.xml', { type: 'application/xml' })
        await expect(uploadForumAttachment(file)).resolves.toBe('[document.xml](<https://files.example/file>)')
        expect(uploadFile)
            .toHaveBeenCalledWith(file, { purpose: 'forum' })
    })
    it('embeds safe images and strips Markdown syntax from the filename', async () => {
        await expect(uploadForumAttachment(new File(['image'], 'a[bad].png', { type: 'image/png' })))
            .resolves.toBe('![abad.png](<https://files.example/file>)')
    })
    it('uses download links for active content and rejects insecure URLs', async () => {
        await expect(uploadForumAttachment(new File(['<svg/>'], 'image.svg', { type: 'image/svg+xml' })))
            .resolves.toBe('[image.svg](<https://files.example/file>)');
        (uploadFile as jest.Mock).mockResolvedValue({ url: 'http://insecure.example/file' })
        await expect(uploadForumAttachment(new File(['x'], 'file'))).rejects.toThrow('invalid attachment URL')
    })
    it('rejects empty files before uploading', async () => {
        await expect(uploadForumAttachment(new File([], 'empty.txt'))).rejects.toThrow('25 MB')
    })
    it('inserts dashboard uploads and handles closing without selecting a file', async () => {
        (pickFiles as jest.Mock).mockResolvedValueOnce([
            { filename: 'image.png', mimetype: 'image/png', url: 'https://files.example/image' },
            { filename: 'notes.txt', mimetype: 'text/plain', url: 'https://files.example/text' },
        ])
            .mockResolvedValueOnce([])
        await expect(pickForumAttachments()).resolves.toBe(
            '![image.png](<https://files.example/image>)\n[notes.txt](<https://files.example/text>)',
        )
        await expect(pickForumAttachments()).resolves.toBe('')
    })
})
