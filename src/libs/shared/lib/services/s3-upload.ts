import type { AwsBody } from '@uppy/aws-s3'
import type { Uppy as UppyInstance, UppyFile } from '@uppy/core'
import { EnvironmentConfig } from '~/config'
import { xhrPostAsync } from '~/libs/core'
import { notifyUploadPicker } from '~/libs/ui/lib/components/modals/upload-picker-event'
import type DashboardPlugin from '@uppy/dashboard'

export type UploadPurpose = 'submission' | 'cv' | 'engagement' | 'review' | 'forum' | 'project' | 'showcase'

export interface UploadedFile {
    url: string
    key: string
    handle: string
    container: string
    filename: string
    originalFile?: Blob
    originalFilename: string
    mimetype: string
    size: number
}

interface UploadSession {
    token: string
    key: string
    bucket: string
    url: string
    partSize: number
}

type UploadMeta = Record<string, unknown> & { session?: UploadSession }

interface UploadOptions {
    purpose: UploadPurpose
    contextId?: string
    onProgress?: (percent: number) => void
    signal?: AbortSignal
    maxFiles?: number
    allowedFileTypes?: string[]
}

const PART_SIZE = 10 * 1024 * 1024
const apiUrl = (): string => EnvironmentConfig.UPLOADS_API_URL
const cancelled = (): DOMException => new DOMException('Upload cancelled.', 'AbortError')

function uploadedFile(file: UppyFile<UploadMeta, AwsBody>): UploadedFile {
    const session = file.meta.session
    if (!session || !file.progress.uploadComplete) throw new Error('File upload did not complete.')
    return {
        container: session.bucket,
        filename: file.name || 'file',
        handle: session.key,
        key: session.key,
        mimetype: file.type,
        originalFile: file.data instanceof Blob ? file.data : undefined,
        originalFilename: file.name || 'file',
        size: file.size || 0,
        url: session.url,
    }
}

/** Shared Uppy 6 transport. Credentials and destination decisions stay on the API. */
async function createUploader(options: UploadOptions): Promise<UppyInstance<UploadMeta, AwsBody>> {
    const [{ default: Uppy }, { default: AwsS3 }]: [
        typeof import('@uppy/core'), typeof import('@uppy/aws-s3'),
    ] = await Promise.all([
        import('@uppy/core'), import('@uppy/aws-s3'),
    ])
    const sessions = new Map<string, UploadSession>()
    const maxFileSize = options.purpose === 'cv' ? 8 * 1024 * 1024
        : options.purpose === 'forum' ? 25 * 1024 * 1024 : 500 * 1024 * 1024
    const allowedFileTypes = options.purpose === 'submission' ? ['.zip']
        : options.purpose === 'cv' ? ['.pdf', '.docx'] : options.allowedFileTypes
    const uppy = new Uppy<UploadMeta, AwsBody>({
        autoProceed: false,
        restrictions: { allowedFileTypes, maxFileSize, maxNumberOfFiles: options.maxFiles || 1, minFileSize: 1 },
    })
    uppy.addPreProcessor(async ids => {
        await Promise.all(ids.map(async id => {
            const file = uppy.getFile(id)
            if (!file || file.meta.session) return
            const session = await xhrPostAsync<{
                purpose: UploadPurpose; filename: string; contentType: string; size: number; contextId?: string
            }, UploadSession>(`${apiUrl()}/sessions`, {
                contentType: file.type || 'application/octet-stream',
                contextId: options.contextId,
                filename: file.name || 'file',
                purpose: options.purpose,
                size: file.size || 0,
            }, { signal: options.signal })
            if (!uppy.getFile(id) || options.signal?.aborted) throw cancelled()
            sessions.set(session.key, session)
            uppy.setFileMeta(id, { session })
        }))
    })
    uppy.use(AwsS3<UploadMeta, AwsBody>, {
        generateObjectKey: file => {
            if (!file.meta.session) throw new Error('Upload session is missing.')
            return file.meta.session.key
        },
        getChunkSize: () => PART_SIZE,
        signRequest: async request => {
            const session = sessions.get(request.key)
            if (!session) throw new Error('Upload session is missing.')
            // AbortMultipartUpload must still be signed after the UI is cancelled.
            return xhrPostAsync<object, { url: string }>(`${apiUrl()}/sign`, {
                ...request,
                token: session.token,
            })
        },
    })
    uppy.on('progress', progress => options.onProgress?.(Math.min(99, Math.round(progress))))
    return uppy
}

/** Upload one local file while retaining the calling form's simple native file input. */
export async function uploadFile(file: File, options: UploadOptions): Promise<UploadedFile> {
    if (options.signal?.aborted) throw cancelled()
    const uppy = await createUploader(options)
    let abort: (() => void) | undefined
    try {
        if (options.signal?.aborted) throw cancelled()
        const id = uppy.addFile({ data: file, name: file.name, type: file.type || 'application/octet-stream' })
        const aborted = new Promise<never>((resolve, reject) => {
            abort = () => { uppy.cancelAll(); reject(cancelled()) }
            options.signal?.addEventListener('abort', abort, { once: true })
        })
        const result = await Promise.race([uppy.upload(), aborted])
        if (!result || result.failed?.length) throw new Error(result?.failed?.[0]?.error || 'File upload failed.')
        const uploaded = uploadedFile(uppy.getFile(id))
        options.onProgress?.(100)
        return uploaded
    } finally {
        if (abort) options.signal?.removeEventListener('abort', abort)
        uppy.destroy()
    }
}

/** Dashboard for attachments: drag/drop, previews, progress, retry and cancellation. */
export async function pickFiles(options: UploadOptions): Promise<UploadedFile[]> {
    const uppy = await createUploader(options)
    const { default: Dashboard }: typeof import('@uppy/dashboard') = await import('@uppy/dashboard')
    await Promise.all([
        import('@uppy/core/css/style.min.css'),
        import('@uppy/dashboard/css/style.min.css'),
    ])
    return new Promise((resolve, reject) => {
        try {
            uppy.use(Dashboard, {
                closeAfterFinish: false,
                doneButtonHandler: () => uppy.getPlugin<DashboardPlugin<UploadMeta, AwsBody>>('Dashboard')
                    ?.closeModal(),
                hideProgressDetails: false,
                proudlyDisplayPoweredByUppy: false,
            })
            uppy.on('dashboard:modal-closed', () => {
                const files = uppy.getFiles()
                    .filter(file => file.progress.uploadComplete)
                    .map(uploadedFile)
                uppy.destroy()
                notifyUploadPicker(false)
                resolve(files)
            })
            notifyUploadPicker(true)
            uppy.getPlugin<DashboardPlugin<UploadMeta, AwsBody>>('Dashboard')
                ?.openModal()
        } catch (error) {
            uppy.destroy()
            notifyUploadPicker(false)
            reject(error)
        }
    })
}
