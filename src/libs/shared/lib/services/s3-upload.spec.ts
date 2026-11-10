/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { uploadFile } from './s3-upload'

jest.mock('~/config', () => ({ EnvironmentConfig: {} }), { virtual: true })
jest.mock('~/libs/core', () => ({ xhrPostAsync: jest.fn() }), { virtual: true })
jest.mock('~/libs/ui/lib/components/modals/upload-picker-event', () => ({
    notifyUploadPicker: jest.fn(),
}), { virtual: true })
jest.mock('@uppy/aws-s3', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@uppy/core', () => ({
    __esModule: true,
    default: class {
        file: unknown

        progress?: (percent: number) => void

        addPreProcessor(): this { return this }

        use(): this { return this }

        on(event: string, handler: (percent: number) => void): void {
            if (event === 'progress') this.progress = handler
        }

        addFile(input: { data: File; name: string; type: string }): string {
            this.file = {
                ...input,
                meta: {
                    session: {
                        bucket: 'attachments',
                        key: 'uppy/support/test/file.txt',
                        url: 'https://files.test/read',
                    },
                },
                progress: { uploadComplete: true },
                size: input.data.size,
            }
            return 'file'
        }

        getFile(): unknown { return this.file }

        async upload(): Promise<{ failed: never[] }> {
            this.progress?.(50)
            return { failed: [] }
        }

        destroy(): void {
            this.progress?.(0)
        }
    },
}))

describe('Shared single-file upload progress', () => {
    it('keeps completed uploads at 100 percent when Uppy cleanup emits zero progress', async () => {
        const onProgress = jest.fn()
        const file = new File(['notes'], 'file.txt', { type: 'text/plain' })
        const uploaded = await uploadFile(file, { onProgress, purpose: 'support' })
        expect(uploaded.url)
            .toBe('https://files.test/read')
        expect(onProgress.mock.calls)
            .toEqual([[50], [100]])
    })
})
