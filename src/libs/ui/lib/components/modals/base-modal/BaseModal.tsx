import { FC, ReactNode, useCallback, useEffect } from 'react'
import Modal, { ModalProps } from 'react-responsive-modal'
import classNames from 'classnames'

import { LoadingSpinner } from '../../loading-spinner'
import { IconOutline } from '../../svgs'

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
