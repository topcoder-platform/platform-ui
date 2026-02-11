import { zip } from 'fflate'

const DEFAULT_TEXT_FILE_EXTENSIONS: ReadonlyArray<string> = [
    '.csv',
    '.txt',
]

const ALREADY_COMPRESSED_EXTENSIONS = new Set([
    'zip',
    'gz',
    'png',
    'jpg',
    'jpeg',
    'pdf',
    'doc',
    'docx',
    'ppt',
    'pptx',
    'xls',
    'xlsx',
    'heic',
    'heif',
    '7z',
    'bz2',
    'rar',
    'gif',
    'webp',
    'webm',
    'mp4',
    'mov',
    'mp3',
    'aifc',
])

export interface DownloadValidationResult {
    message?: string
    success: boolean
}

type ZipCompressionLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

function getFileExtension(fileName: string): string {
    const index = fileName.lastIndexOf('.')

    if (index < 0) {
        return ''
    }

    return fileName.slice(index + 1)
        .toLowerCase()
}

function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader()

        fileReader.onload = (): void => {
            if (typeof fileReader.result === 'string') {
                resolve(fileReader.result)
                return
            }

            reject(new Error('Unable to parse uploaded file'))
        }

        fileReader.onerror = (): void => {
            reject(new Error('Unable to read uploaded file'))
        }

        fileReader.readAsText(file)
    })
}

function readFileAsUint8Array(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader()

        fileReader.onload = (): void => {
            if (fileReader.result instanceof ArrayBuffer) {
                resolve(new Uint8Array(fileReader.result))
                return
            }

            reject(new Error('Unable to read uploaded file as binary data'))
        }

        fileReader.onerror = (): void => {
            reject(new Error('Unable to read uploaded file as binary data'))
        }

        fileReader.readAsArrayBuffer(file)
    })
}

function createFileBlob(
    data: Blob | BlobPart | BlobPart[],
    mimeType?: string,
): Blob {
    if (data instanceof Blob) {
        return data
    }

    if (Array.isArray(data)) {
        return new Blob(data, mimeType ? {
            type: mimeType,
        } : undefined)
    }

    return new Blob([data], mimeType ? {
        type: mimeType,
    } : undefined)
}

export function isSupportedFile(
    file: File,
    allowedExtensions: ReadonlyArray<string> = DEFAULT_TEXT_FILE_EXTENSIONS,
): boolean {
    const lowerCaseFileName = file.name
        .toLowerCase()

    return allowedExtensions.some(extension => lowerCaseFileName.endsWith(extension.toLowerCase()))
}

export function isAllowedFileType(file: File, allowedExtensions: ReadonlyArray<string>): boolean {
    const extension = getFileExtension(file.name)

    if (!extension) {
        return false
    }

    return allowedExtensions.some(allowedExtension => {
        const normalizedAllowedExtension = allowedExtension
            .toLowerCase()
            .replace(/^\./, '')

        return extension === normalizedAllowedExtension
    })
}

export function validateFileTypes(
    files: File[],
    allowedExtensions: ReadonlyArray<string>,
): File[] {
    return files.filter(file => isAllowedFileType(file, allowedExtensions))
}

export function isWithinSizeLimit(file: File, maxSizeInBytes: number): boolean {
    return file.size <= maxSizeInBytes
}

export function formatFileSize(sizeInBytes: number): string {
    if (!Number.isFinite(sizeInBytes) || sizeInBytes < 0) {
        return '0 B'
    }

    if (sizeInBytes < 1024) {
        return `${sizeInBytes} B`
    }

    const units = ['KB', 'MB', 'GB', 'TB']
    let value = sizeInBytes / 1024
    let unitIndex = 0

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024
        unitIndex += 1
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`
}

export function downloadFile(
    data: Blob | BlobPart | BlobPart[],
    fileName: string,
    mimeType?: string,
): void {
    const blob = createFileBlob(data, mimeType)
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.download = fileName
    link.href = objectUrl
    link.click()
    URL.revokeObjectURL(objectUrl)
}

export async function compressFiles(files: File[], fileName?: string): Promise<void> {
    if (!files.length) {
        return
    }

    const zipEntries = await Promise.all(files
        .map(async file => {
            const fileContent = await readFileAsUint8Array(file)
            const extension = getFileExtension(file.name)
            const compressionLevel: ZipCompressionLevel = ALREADY_COMPRESSED_EXTENSIONS.has(extension)
                ? 0
                : 6

            return {
                compressionLevel,
                content: fileContent,
                name: file.name,
            }
        }))

    const zipPayload: Record<string, [Uint8Array, {
        level: ZipCompressionLevel
    }]> = {}

    zipEntries.forEach(entry => {
        zipPayload[entry.name] = [
            entry.content,
            {
                level: entry.compressionLevel,
            },
        ]
    })

    const archive = await new Promise<Uint8Array>((resolve, reject) => {
        zip(zipPayload, {}, (error, output) => {
            if (error || !output) {
                reject(error || new Error('Unable to compress files'))
                return
            }

            resolve(output)
        })
    })

    downloadFile(
        new Blob([archive], {
            type: 'application/zip',
        }),
        fileName || `compressed-file-${Date.now()}.zip`,
    )
}

export async function parseCSVFile(file: File): Promise<string[]> {
    if (!isSupportedFile(file)) {
        throw new Error('Only CSV and TXT files are supported')
    }

    const fileContent = await readFileAsText(file)

    return fileContent
        .split(/\r?\n/g)
        .map(line => line.trim())
        .filter(Boolean)
}

export async function isValidDownloadFile(blobFile: Blob | null | undefined): Promise<DownloadValidationResult> {
    if (!blobFile) {
        return {
            success: false,
        }
    }

    if ((blobFile.type || '').includes('json')) {
        const response = JSON.parse(await blobFile.text()) as {
            message?: string
        }

        return {
            message: response.message || '',
            success: false,
        }
    }

    return {
        success: true,
    }
}
