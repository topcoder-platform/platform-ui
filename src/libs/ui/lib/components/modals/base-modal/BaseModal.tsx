import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import Modal, { ModalProps } from 'react-responsive-modal'
import classNames from 'classnames'

import { LoadingSpinner } from '../../loading-spinner'
import { IconOutline } from '../../svgs'
import { UPLOAD_PICKER_EVENT } from '../upload-picker-event'

import {
    ModalContentResponse,
    useFetchModalContent,
} from './use-fetch-modal-content'
import styles from './BaseModal.module.scss'

export interface BaseModalProps extends ModalProps {
    bodyClassName?: string
    contentClassName?: string
    contentUrl?: string
    theme?: 'danger' | 'clear'
    size?: 'body' | 'lg' | 'md' | 'sm'
    title?: string | ReactNode
    spacer?: boolean
    buttons?: ReactNode
    allowBodyScroll?: boolean
}

const BaseModal: FC<BaseModalProps> = (props: BaseModalProps) => {
    const [uploadPickerOpen, setUploadPickerOpen] = useState(false)
    const uploadPickerOpenRef = useRef(false)
    const onCloseRef = useRef(props.onClose)
    onCloseRef.current = props.onClose
    const handleClose = useCallback((): void => {
        if (!uploadPickerOpenRef.current) onCloseRef.current()
    }, [])
    useEffect(() => {
        const onPickerChange = (event: Event): void => {
            uploadPickerOpenRef.current = (event as CustomEvent<boolean>).detail
            setUploadPickerOpen(uploadPickerOpenRef.current)
        }

        window.addEventListener(UPLOAD_PICKER_EVENT, onPickerChange)
        return () => window.removeEventListener(UPLOAD_PICKER_EVENT, onPickerChange)
    }, [])
    const { content }: ModalContentResponse = useFetchModalContent(
        props.contentUrl,
        props.open,
    )

    const renterContent: () => ReactNode = () => {
        if (props.children || !props.contentUrl) {
            return undefined
        }

        if (!content) {
            return <LoadingSpinner />
        }

        return (
            <div
                className={props.contentClassName}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        )
    }

    const handleBodyScroll = useCallback(
        (force?: boolean) => {
            if (!props.allowBodyScroll) {
                const isOpen = force ?? props.open
                document.documentElement.style.overflow = isOpen ? 'hidden' : ''
                document.body.style.overflow = isOpen ? 'hidden' : ''
            }
        },
        [props.open, props.allowBodyScroll],
    )

    useEffect(() => {
        if (props.blockScroll) {
            return undefined
        }

        handleBodyScroll()
        return () => handleBodyScroll(false)
    }, [handleBodyScroll, props.blockScroll, props.open])

    return (
        <Modal
            {...props}
            onClose={handleClose}
            focusTrapped={uploadPickerOpen ? false : props.focusTrapped}
            classNames={{
                ...props.classNames,
                modal: classNames(
                    props.classNames?.modal,
                    `modal-${props.size || 'md'}`,
                    props.theme && styles[`theme-${props.theme}`],
                ),
            }}
            closeIcon={(
                <IconOutline.XIcon
                    className={styles['close-icon']}
                    width={24}
                    height={24}
                />
            )}
            // send blockScroll as false unless we get a specific true from props
            blockScroll={props.blockScroll === true}
        >
            {props.title && (
                <>
                    <div className={styles['modal-header']}>
                        {typeof props.title === 'string' ? (
                            <h3>{props.title}</h3>
                        ) : (
                            props.title
                        )}
                    </div>

                    {props.spacer !== false && <hr className={styles.spacer} />}
                </>
            )}

            <div
                className={classNames(
                    props.bodyClassName,
                    styles['modal-body'],
                    'modal-body',
                )}
            >
                {renterContent()}
                {props.children}
            </div>
            {props.buttons && (
                <div className={styles.buttonsWrap}>
                    <hr className={styles.spacer} />
                    <div className={styles.buttonContainer}>
                        {props.buttons}
                    </div>
                </div>
            )}
        </Modal>
    )
}

export default BaseModal
