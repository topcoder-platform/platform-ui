import classNames from 'classnames'
import { FC, ReactNode } from 'react'
import Modal, { ModalProps } from 'react-responsive-modal'

import { LoadingSpinner } from '../../loading-spinner'
import { IconOutline } from '../../svgs'

import styles from './BaseModal.module.scss'
import { ModalContentResponse, useFetchModalContent } from './use-fetch-modal-content'

export interface BaseModalProps extends ModalProps {
    contentClassName?: string
    contentUrl?: string
    size?: 'lg' | 'md'
    title: string
}

const BaseModal: FC<BaseModalProps> = ({
    children,
    title,
    contentUrl,
    contentClassName,
    ...props
}: BaseModalProps) => {

    const { content }: ModalContentResponse = useFetchModalContent(contentUrl, props.open)

    const renterContent: () => ReactNode = () => {
        if (children || !contentUrl) {
            return
        }

        if (!content) {
            return <LoadingSpinner />
        }

        return (
            <div
                className={contentClassName}
                dangerouslySetInnerHTML={{__html: content}}
            />
        )
    }

    return (
        <Modal
            {...props}
            classNames={{ modal: `modal-${props.size || 'md'}` }}
            closeIcon={<IconOutline.XIcon width={28} height={28} />}
        >
            <div className={styles['modal-header']}>
                <h3>{title}</h3>
            </div>

            <hr className={styles['spacer']} />

            <div className={classNames(styles['modal-body'], 'modal-body')}>
                {renterContent()}
                {children}
            </div>
        </Modal>
    )
}

export default BaseModal
