/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-array-index-key */
import {
    Dispatch,
    FC,
    SetStateAction,
    useEffect,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'

import { BaseModal, IconOutline } from '~/libs/ui'

import styles from './ModalPhotoViewer.module.scss'

interface ModalPhotoViewerProps {
    onClose: () => void
    open: boolean
    photos: string[]
    selectedPhoto: number
}

/**
 * Displays timeline event photos in a full-size viewer.
 *
 * @param props Modal state and photo URLs.
 * @returns Photo viewer modal.
 */
const ModalPhotoViewer: FC<ModalPhotoViewerProps> = (
    props: ModalPhotoViewerProps,
) => {
    const [localSelectedPhoto, setLocalSelectedPhoto]: [
        number,
        Dispatch<SetStateAction<number>>
    ] = useState<number>(props.selectedPhoto)

    useEffect(() => {
        setLocalSelectedPhoto(props.selectedPhoto)
    }, [props.selectedPhoto])

    const selectedPhotoUrl = useMemo(
        () => props.photos[localSelectedPhoto],
        [localSelectedPhoto, props.photos],
    )

    if (!props.open || !props.photos.length) {
        return <></>
    }

    return (
        <BaseModal
            allowBodyScroll
            bodyClassName={styles.modalBody}
            onClose={props.onClose}
            open={props.open}
            size='lg'
        >
            <div className={styles.content}>
                {selectedPhotoUrl && (
                    <img
                        alt='Timeline media'
                        className={styles.mainMedia}
                        src={selectedPhotoUrl}
                    />
                )}

                {props.photos.length > 1 && (
                    <>
                        <button
                            className={classNames(styles.navButton, styles.leftButton)}
                            onClick={() => {
                                const nextIndex = localSelectedPhoto - 1 < 0
                                    ? props.photos.length - 1
                                    : localSelectedPhoto - 1
                                setLocalSelectedPhoto(nextIndex)
                            }}
                            type='button'
                        >
                            <IconOutline.ChevronLeftIcon width={24} />
                        </button>
                        <button
                            className={classNames(styles.navButton, styles.rightButton)}
                            onClick={() => {
                                const nextIndex = localSelectedPhoto + 1 >= props.photos.length
                                    ? 0
                                    : localSelectedPhoto + 1
                                setLocalSelectedPhoto(nextIndex)
                            }}
                            type='button'
                        >
                            <IconOutline.ChevronRightIcon width={24} />
                        </button>
                    </>
                )}
            </div>

            <div className={styles.bottom}>
                {props.photos.map((photo, index) => (
                    <button
                        className={classNames(
                            styles.thumbnail,
                            index === localSelectedPhoto && styles.selected,
                        )}
                        key={`${photo}-${index}`}
                        onClick={() => setLocalSelectedPhoto(index)}
                        type='button'
                    >
                        <img alt={`Timeline thumbnail ${index + 1}`} src={photo} />
                    </button>
                ))}
            </div>
        </BaseModal>
    )
}

export default ModalPhotoViewer
