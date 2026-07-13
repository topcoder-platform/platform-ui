import { FC, useCallback, useMemo, useState } from 'react'

import { IconFile } from '~/apps/customer-portal/src/lib/assets'
import { ProjectShowcasePostMedia } from '~/apps/work/src/lib'

import ShowcasePostMediaGallery, {
    getAssetExtension,
    getMediaAlt,
    getPlaceholderLabel,
    isImageAsset,
} from './ShowcasePostMediaGallery'
import styles from './ShowcasePostMedia.module.scss'

interface ShowcasePostMediaProps {
    assets: ProjectShowcasePostMedia[] | undefined
}

const ShowcasePostMedia: FC<ShowcasePostMediaProps> = props => {
    const [galleryIndex, setGalleryIndex] = useState<number | null>(null)

    const visibleAssets = useMemo(() => props.assets?.slice(0, 4) || [], [props.assets])
    const galleryAssets = useMemo(() => props.assets || [], [props.assets])
    const isGalleryOpen = galleryIndex !== null

    const handleOpenGallery = useCallback((index: number) => {
        setGalleryIndex(index)
    }, [])

    const handleCloseGallery = useCallback(() => {
        setGalleryIndex(null)
    }, [])

    if (!props.assets || props.assets.length === 0) {
        return <></>
    }

    return (
        <>
            <div className={styles.wrap}>
                <ul className={styles.mediaList}>
                    {visibleAssets.map((mediaAsset, index) => {
                        const extension = getAssetExtension(mediaAsset)
                        const isImage = isImageAsset(extension)

                        return (
                            <li key={mediaAsset.id} className={styles.mediaItem}>
                                <button
                                    type='button'
                                    className={styles.mediaButton}
                                    onClick={() => handleOpenGallery(index)}
                                    aria-label={`Open gallery item ${index + 1}`}
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
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </div>

            {isGalleryOpen && galleryIndex !== null && (
                <ShowcasePostMediaGallery
                    assets={galleryAssets}
                    startingIndex={galleryIndex}
                    onClose={handleCloseGallery}
                />
            )}
        </>
    )
}

export default ShowcasePostMedia
