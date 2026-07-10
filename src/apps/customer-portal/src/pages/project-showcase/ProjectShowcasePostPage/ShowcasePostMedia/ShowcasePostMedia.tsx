import { FC, useMemo } from 'react'

import { IconFile } from '~/apps/customer-portal/src/lib/assets'
import styles from './ShowcasePostMedia.module.scss'
import { ProjectShowcasePostMedia } from '~/apps/work/src/lib'
import { IconOutline } from '~/libs/ui'

interface ShowcasePostMediaProps {
    assets: ProjectShowcasePostMedia[] | undefined
}

const IMAGE_EXTENSIONS_ARRAY = ['.bmp', '.gif', '.jpg', '.jpeg', '.png'];
const IMAGE_EXTENSIONS = new Set(IMAGE_EXTENSIONS_ARRAY)
const VIDEO_EXTENSIONS_ARRAY = ['.webm', '.mp4', '.mov', '.avi']
const VIDEO_EXTENSIONS = new Set(VIDEO_EXTENSIONS_ARRAY)
const PDF_EXTENSIONS_ARRAY = ['.pdf']
const PDF_EXTENSIONS = new Set(PDF_EXTENSIONS_ARRAY)
const ALLOWED_EXTENSIONS = new Set([
    ...IMAGE_EXTENSIONS_ARRAY,
    ...VIDEO_EXTENSIONS_ARRAY,
    ...PDF_EXTENSIONS_ARRAY,
])

const MIME_EXTENSION_MAP: Record<string, string> = {
    'image/bmp': '.bmp',
    'image/gif': '.gif',
    'image/jpeg': '.jpeg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'application/pdf': '.pdf',
    'video/webm': '.webm',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
}

function getFileExtension(value: string | undefined): string | undefined {
    if (!value) {
        return undefined
    }

    const normalized = value.trim().toLowerCase()
    if (!normalized) {
        return undefined
    }

    const mimeMapped = MIME_EXTENSION_MAP[normalized]
    if (mimeMapped) {
        return mimeMapped
    }

    const extensionMatch = /\.(bmp|gif|jpe?g|png|pdf|webm|mp4|mov|avi)(?:[?#].*)?$/.exec(normalized)
    if (!extensionMatch) {
        return undefined
    }

    const extension = `.${extensionMatch[1]}`
    return ALLOWED_EXTENSIONS.has(extension) ? extension : undefined
}

function isImageAsset(extension: string): boolean {
    return IMAGE_EXTENSIONS.has(extension)
}

function getAssetExtension(asset: ProjectShowcasePostMedia): string {
    return getFileExtension(asset.type) || getFileExtension(asset.url) || ''
}

function getPlaceholderLabel(extension: string, asset: ProjectShowcasePostMedia): string {
    if (PDF_EXTENSIONS.has(extension)) {
        return 'PDF'
    }

    if (VIDEO_EXTENSIONS.has(extension)) {
        return 'Video'
    }

    if (extension) {
        return extension.replace('.', '').toUpperCase()
    }

    return asset.type || 'File'
}

function getMediaAlt(asset: ProjectShowcasePostMedia): string {
    const extension = getAssetExtension(asset)

    if (isImageAsset(extension)) {
        return `Project showcase image (${extension.replace('.', '')})`
    }

    return `Project showcase attachment (${getPlaceholderLabel(extension, asset)})`
}

const ShowcasePostMedia: FC<ShowcasePostMediaProps> = props => {
    const visibleAssets = useMemo(() => props.assets?.slice(0, 4) || [], [props.assets])

    if (!props.assets) {
        return null
    }

    return (
        <div className={styles.wrap}>
            <ul className={styles.mediaList}>
                {visibleAssets.map(mediaAsset => {
                    const extension = getAssetExtension(mediaAsset)
                    const isImage = isImageAsset(extension)

                    return (
                        <li key={mediaAsset.id} className={styles.mediaItem}>
                            {isImage && (
                                <img
                                    className={styles.mediaImage}
                                    src={mediaAsset.url}
                                    alt={getMediaAlt(mediaAsset)}
                                />
                            )}
                            {!isImage && (
                                <div
                                    className={styles.placeholder}
                                    aria-label={getMediaAlt(mediaAsset)}
                                    title={mediaAsset.url}
                                >
                                    <IconFile className={styles.placeholderIcon} />
                                    <span className={styles.placeholderLabel}>
                                        {getPlaceholderLabel(extension, mediaAsset)}
                                    </span>
                                </div>
                            )}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

export default ShowcasePostMedia
