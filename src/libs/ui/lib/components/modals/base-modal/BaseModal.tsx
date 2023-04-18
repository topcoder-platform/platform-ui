import { FC, ReactNode, useEffect } from 'react'
import Modal, { ModalProps } from 'react-responsive-modal'
import classNames from 'classnames'

import { LoadingSpinner } from '../../loading-spinner'
import { IconOutline } from '../../svgs'

import { ModalContentResponse, useFetchModalContent } from './use-fetch-modal-content'
import styles from './BaseModal.module.scss'

export interface BaseModalProps extends ModalProps {
    contentClassName?: string
    contentUrl?: string
    size?: 'body' | 'lg' | 'md' | 'sm'
    title?: string
    buttons?: ReactNode
}

const BaseModal: FC<BaseModalProps> = (props: BaseModalProps) => {

    const { content }: ModalContentResponse = useFetchModalContent(props.contentUrl, props.open)

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

    useEffect(() => {
        if (props.blockScroll === false) {
            document.documentElement.style.overflow = props.open ? 'hidden' : ''
            document.body.style.overflow = props.open ? 'hidden' : ''
        }
    }, [props.blockScroll, props.open])

    return (
        <Modal
            {...props}
            classNames={{ ...props.classNames, modal: `${props.classNames?.modal ?? ''} modal-${props.size || 'md'}` }}
            closeIcon={<IconOutline.XIcon width={28} height={28} />}
        >
            {props.title && (
                <>
                    <div className={styles['modal-header']}>
                        <h3>{props.title}</h3>
                    </div>

                    <hr className={styles.spacer} />
                </>
            )}

            <div className={classNames(styles['modal-body'], 'modal-body')}>
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