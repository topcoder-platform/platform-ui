import { FC, useCallback, useEffect, useRef, useState } from 'react'

import { IconFile } from '~/apps/customer-portal/src/lib/assets'
import { Button, IconOutline } from '~/libs/ui'
import { ProjectShowcasePostMedia } from '~/apps/work/src/lib'

import styles from './ShowcasePostMediaGallery.module.scss'
import classNames from 'classnames'

interface ShowcasePostMediaGalleryProps {
    assets: ProjectShowcasePostMedia[]
    startingIndex: number
    onClose: () => void
}

export function getFileExtension(value: string | undefined): string | undefined {
    if (!value) {
        return undefined
    }

    const normalized = value.trim().toLowerCase()
    if (!normalized) {
        return undefined
    }

    const mimeMapped: Record<string, string> = {
        'application/pdf': '.pdf',
        'image/bmp': '.bmp',
        'image/gif': '.gif',
        'image/jpeg': '.jpeg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'video/mp4': '.mp4',
        'video/quicktime': '.mov',
        'video/webm': '.webm',
        'video/x-msvideo': '.avi',
    }

    const mimeExtension = mimeMapped[normalized]
    if (mimeExtension) {
        return mimeExtension
    }

    const extensionMatch = /\.(bmp|gif|jpe?g|png|pdf|webm|mp4|mov|avi)(?:[?#].*)?$/.exec(normalized)
    if (!extensionMatch) {
        return undefined
    }

    return `.${extensionMatch[1]}`
}

const IMAGE_EXTENSIONS = new Set(['.bmp', '.gif', '.jpg', '.jpeg', '.png'])
const VIDEO_EXTENSIONS = new Set(['.webm', '.mp4', '.mov', '.avi'])
const PDF_EXTENSIONS = new Set(['.pdf'])

export function getAssetExtension(asset: ProjectShowcasePostMedia): string {
    return getFileExtension(asset.type) || getFileExtension(asset.url) || ''
}

export function isImageAsset(extension: string): boolean {
    return IMAGE_EXTENSIONS.has(extension)
}

export function getPlaceholderLabel(extension: string, asset: ProjectShowcasePostMedia): string {
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

export function getMediaAlt(asset: ProjectShowcasePostMedia): string {
    const extension = getAssetExtension(asset)

    if (isImageAsset(extension)) {
        return `Project showcase image (${extension.replace('.', '')})`
    }

    return `Project showcase attachment (${getPlaceholderLabel(extension, asset)})`
}

const ShowcasePostMediaGallery: FC<ShowcasePostMediaGalleryProps> = (props) => {
    const thumbsContainerRef = useRef<HTMLUListElement>(null)
    const [currentIndex, setCurrentIndex] = useState(props.startingIndex)
    const mediaAsset = props.assets[currentIndex]

    useEffect(() => {
        setCurrentIndex(props.startingIndex)
    }, [props.startingIndex])

    const handlePrevious = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex + props.assets.length - 1) % props.assets.length)
    }, [props.assets.length])

    const handleNext = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % props.assets.length)
    }, [props.assets.length])
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                props.onClose()
            }

            if (event.key === 'ArrowLeft') {
                handlePrevious()
            }

            if (event.key === 'ArrowRight') {
                handleNext()
            }
        }

        const originalDocumentOverflow = document.documentElement.style.overflow
        const originalBodyOverflow = document.body.style.overflow

        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            document.documentElement.style.overflow = originalDocumentOverflow
            document.body.style.overflow = originalBodyOverflow
        }
    }, [handleNext, handlePrevious, props.onClose])

    useEffect(() => {
      if (!thumbsContainerRef.current) {
        return
      }

      thumbsContainerRef.current.children[currentIndex].scrollIntoView();
    }, [currentIndex]);

    if (!mediaAsset) {
        return null
    }

    return (
        <div
            className={styles.overlay}
            role='dialog'
            aria-modal='true'
            onClick={props.onClose}
        >
            <div className={styles.mainFrame} onClick={event => event.stopPropagation()}>
                <div className={styles.mainContent}>
                    <button
                        type='button'
                        className={styles.close}
                        onClick={props.onClose}
                        aria-label='Close gallery'
                    >
                        <IconOutline.XIcon width={24} height={24} />
                    </button>

                    <div className={styles.galleryMedia}>
                        {isImageAsset(getAssetExtension(mediaAsset)) ? (
                            <img
                                src={mediaAsset.url}
                                alt={getMediaAlt(mediaAsset)}
                                className={styles.galleryImage}
                            />
                        ) : (
                            <div className={styles.galleryPlaceholder}>
                                <IconFile className={styles.galleryPlaceholderIcon} />
                                <span className={styles.galleryPlaceholderLabel}>
                                    {getPlaceholderLabel(getAssetExtension(mediaAsset), mediaAsset)}
                                </span>
                                <a
                                    href={mediaAsset.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className={styles.galleryPlaceholderLink}
                                >
                                    Open file
                                </a>
                            </div>
                        )}
                    </div>

                    <div className={styles.galleryControls}>
                        <Button
                            label=''
                            onClick={handlePrevious}
                            icon={IconOutline.ChevronLeftIcon}
                            iconToLeft
                            size='xl'
                            className={styles.navControl}
                        />
                        <Button
                            label=''
                            onClick={handleNext}
                            icon={IconOutline.ChevronRightIcon}
                            iconToRight
                            size='xl'
                            className={styles.navControl}
                        />
                    </div>

                    <ul className={styles.galleryThumbnails} ref={thumbsContainerRef}>
                        {props.assets.map((mediaAsset, index) => {
                            const extension = getAssetExtension(mediaAsset)
                            const isImage = isImageAsset(extension)

                            return (
                                <li
                                    key={mediaAsset.id}
                                    className={classNames(styles.mediaItem, currentIndex === index && styles.active)}
                                    onClick={function setCurrent() { setCurrentIndex(index) }}
                                >
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
            </div>
        </div>
    )
}

export default ShowcasePostMediaGallery
