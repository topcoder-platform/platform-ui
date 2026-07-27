import {
    FC,
    MouseEvent as ReactMouseEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'
import classNames from 'classnames'

import { IconFile } from '~/apps/customer-portal/src/lib/assets'
import { Button, IconOutline } from '~/libs/ui'
import { ProjectShowcasePostMedia } from '~/apps/work/src/lib'

import styles from './ShowcasePostMediaGallery.module.scss'

interface ShowcasePostMediaGalleryProps {
    assets: ProjectShowcasePostMedia[]
    startingIndex: number
    onClose: () => void
}

export function getFileExtension(value: string | undefined): string | undefined {
    if (!value) {
        return undefined
    }

    const normalized = value.trim()
        .toLowerCase()
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

const MIN_ZOOM = 1
const MAX_ZOOM = 8
const ZOOM_STEP = 0.25

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
        return extension.replace('.', '')
            .toUpperCase()
    }

    return asset.type || 'File'
}

export function getMediaAlt(asset: ProjectShowcasePostMedia): string {
    if (asset.alt) {
        return asset.alt
    }

    const extension = getAssetExtension(asset)

    if (isImageAsset(extension)) {
        return `Project showcase image (${extension.replace('.', '')})`
    }

    return `Project showcase attachment (${getPlaceholderLabel(extension, asset)})`
}

function clampZoom(value: number): number {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

const ShowcasePostMediaGallery: FC<ShowcasePostMediaGalleryProps> = props => {
    const thumbsContainerRef = useRef<HTMLUListElement>(null)
    const [currentIndex, setCurrentIndex] = useState(props.startingIndex)
    const [isZoomOverlayOpen, setIsZoomOverlayOpen] = useState(false)
    const [zoom, setZoom] = useState(MIN_ZOOM)
    const mediaAsset = props.assets[currentIndex]
    const isCurrentImage = mediaAsset ? isImageAsset(getAssetExtension(mediaAsset)) : false

    const resetZoom = useCallback(() => {
        setZoom(MIN_ZOOM)
    }, [])

    const closeZoomOverlay = useCallback(() => {
        setIsZoomOverlayOpen(false)
        resetZoom()
    }, [resetZoom])

    useEffect(() => {
        setCurrentIndex(props.startingIndex)
    }, [props.startingIndex])

    useEffect(() => {
        resetZoom()
    }, [currentIndex, resetZoom])

    const handlePrevious = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex + props.assets.length - 1) % props.assets.length)
    }, [props.assets.length])

    const handleNext = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % props.assets.length)
    }, [props.assets.length])

    const handleOpenZoomOverlay = useCallback(() => {
        setIsZoomOverlayOpen(true)
        resetZoom()
    }, [resetZoom])

    const handleZoomIn = useCallback(() => {
        setZoom(prev => clampZoom(prev + ZOOM_STEP))
    }, [])

    const handleZoomOut = useCallback(() => {
        setZoom(prev => clampZoom(prev - ZOOM_STEP))
    }, [])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                if (isZoomOverlayOpen) {
                    closeZoomOverlay()
                    return
                }

                props.onClose()
            }

            if (event.key === 'ArrowLeft' && !isZoomOverlayOpen) {
                handlePrevious()
            }

            if (event.key === 'ArrowRight' && !isZoomOverlayOpen) {
                handleNext()
            }

            if (isZoomOverlayOpen && (event.key === '+' || event.key === '=')) {
                handleZoomIn()
            }

            if (isZoomOverlayOpen && event.key === '-') {
                handleZoomOut()
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
    }, [
        closeZoomOverlay,
        handleNext,
        handlePrevious,
        handleZoomIn,
        handleZoomOut,
        isZoomOverlayOpen,
        props.onClose,
        props,
    ])

    useEffect(() => {
        if (!thumbsContainerRef.current || isZoomOverlayOpen) {
            return
        }

        thumbsContainerRef.current.children[currentIndex].scrollIntoView()
    }, [currentIndex, isZoomOverlayOpen])

    if (!mediaAsset) {
        return <></>
    }

    return (
        <div
            className={styles.overlay}
            role='dialog'
            aria-modal='true'
            onClick={isZoomOverlayOpen ? closeZoomOverlay : props.onClose}
        >
            {isZoomOverlayOpen && isCurrentImage ? (
                <div
                    className={styles.zoomFrame}
                    onClick={function stopPropagation(event: ReactMouseEvent<HTMLDivElement>) {
                        event.stopPropagation()
                    }}
                >
                    <div className={styles.zoomContent}>
                        <button
                            type='button'
                            className={styles.close}
                            onClick={closeZoomOverlay}
                            aria-label='Close zoom'
                        >
                            <IconOutline.XIcon width={24} height={24} />
                        </button>

                        <div className={styles.zoomToolbar}>
                            <button
                                type='button'
                                className={styles.zoomControl}
                                onClick={handleZoomOut}
                                disabled={zoom <= MIN_ZOOM}
                                aria-label='Zoom out'
                                title='Zoom out'
                            >
                                <IconOutline.MinusIcon width={20} height={20} />
                            </button>
                            <span className={styles.zoomLevel}>
                                {Math.round(zoom * 100)}
                                %
                            </span>
                            <button
                                type='button'
                                className={styles.zoomControl}
                                onClick={handleZoomIn}
                                disabled={zoom >= MAX_ZOOM}
                                aria-label='Zoom in'
                                title='Zoom in'
                            >
                                <IconOutline.PlusIcon width={20} height={20} />
                            </button>
                            <button
                                type='button'
                                className={styles.zoomControl}
                                onClick={resetZoom}
                                disabled={zoom === MIN_ZOOM}
                                aria-label='Reset zoom'
                                title='Reset zoom'
                            >
                                1:1
                            </button>
                        </div>

                        <div className={styles.zoomMedia}>
                            <img
                                src={mediaAsset.url}
                                alt={getMediaAlt(mediaAsset)}
                                className={styles.zoomImage}
                                style={{ width: `${zoom * 100}%` }}
                                draggable={false}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className={styles.mainFrame}
                    onClick={
                        function onClick(event: ReactMouseEvent<HTMLDivElement>) {
                            event.stopPropagation()
                        }
                    }
                >
                    <div className={styles.mainContent}>
                        <button
                            type='button'
                            className={styles.close}
                            onClick={props.onClose}
                            aria-label='Close gallery'
                        >
                            <IconOutline.XIcon width={24} height={24} />
                        </button>

                        {isCurrentImage && (
                            <button
                                type='button'
                                className={styles.zoomOpen}
                                onClick={handleOpenZoomOverlay}
                                aria-label='Open zoom view'
                                title='Zoom image'
                            >
                                <IconOutline.ArrowsExpandIcon width={22} height={22} />
                            </button>
                        )}

                        <div className={styles.galleryMedia}>
                            {isCurrentImage ? (
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
                            {props.assets.map((thumbAsset, index) => {
                                const extension = getAssetExtension(thumbAsset)
                                const isImage = isImageAsset(extension)

                                return (
                                    <li
                                        key={thumbAsset.id}
                                        className={classNames(
                                            styles.mediaItem,
                                            currentIndex === index && styles.active,
                                        )}
                                        onClick={function setCurrent() { setCurrentIndex(index) }}
                                        title={thumbAsset.alt}
                                    >
                                        {isImage && (
                                            <img
                                                className={styles.mediaImage}
                                                src={thumbAsset.url}
                                                alt={getMediaAlt(thumbAsset)}
                                            />
                                        )}
                                        {!isImage && (
                                            <div
                                                className={styles.placeholder}
                                                aria-label={getMediaAlt(thumbAsset)}
                                                title={thumbAsset.url}
                                            >
                                                <IconFile className={styles.placeholderIcon} />
                                                <span className={styles.placeholderLabel}>
                                                    {getPlaceholderLabel(extension, thumbAsset)}
                                                </span>
                                            </div>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ShowcasePostMediaGallery
