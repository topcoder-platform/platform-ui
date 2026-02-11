export interface Attachment {
    id?: string
    fileSize?: number
    name: string
    url: string
}

export interface AttachmentPayload {
    fileSize: number
    name: string
    url: string
}

export interface ProjectAttachment {
    allowedUsers?: string[]
    category?: string
    createdAt?: string
    description?: string
    id?: string
    name?: string
    path?: string
    projectId?: string
    s3Bucket?: string
    tags?: string[]
    title?: string
    type?: string
    updatedAt?: string
    url?: string
    [key: string]: unknown
}

export interface ProjectAttachmentPayload {
    allowedUsers?: string[]
    category?: string
    description?: string
    name?: string
    path?: string
    s3Bucket?: string
    tags?: string[]
    title?: string
    type?: string
    url?: string
    [key: string]: unknown
}
