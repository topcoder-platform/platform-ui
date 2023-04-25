import { FC, ReactNode, useEffect } from 'react'
import Modal, { ModalProps } from 'react-responsive-modal'
import classNames from 'classnames'

import { LoadingSpinner } from '../../loading-spinner'
import { IconOutline } from '../../svgs'

import { ModalContentResponse, useFetchModalContent } from './use-fetch-modal-content'
import styles from './BaseModal.module.scss'

export interface BaseModalProps extends ModalProps {
    bodyClassName?: string
    contentClassName?: string
    contentUrl?: string
    theme?: 'danger'
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
            classNames={{
                ...props.classNames,
                modal: classNames(
                    props.classNames?.modal,
                    `modal-${props.size || 'md'}`,
                    props.theme && `theme-${props.theme}`,
                ),
            }}
            closeIcon={<IconOutline.XIcon className={styles['close-icon']} width={24} height={24} />}
        >
            {props.title && (
                <>
                    <div className={styles['modal-header']}>
                        <h3>{props.title}</h3>
                    </div>

                    <hr className={styles.spacer} />
                </>
            )}

            <div className={classNames(props.bodyClassName, styles['modal-body'], 'modal-body')}>
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
