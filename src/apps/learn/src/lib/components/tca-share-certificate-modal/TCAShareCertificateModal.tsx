import { FC, FocusEvent } from 'react'
import { toast } from 'react-toastify'

import {
    BaseModal,
    BaseModalProps,
    FacebookSocialShareBtn,
    IconOutline,
    LinkedinSocialShareBtn,
    TwitterSocialShareBtn,
} from '~/libs/ui'
import { copyTextToClipboard } from '~/libs/shared'

import styles from './TCAShareCertificateModal.module.scss'

function selectText(ev: FocusEvent<HTMLInputElement, Element>): void {
    ev.target?.select()
}

export interface TCAShareCertificateModalProps extends BaseModalProps {
    shareUrl: string
}

const TCAShareCertificateModal: FC<TCAShareCertificateModalProps>
= (props: TCAShareCertificateModalProps) => {

    function handleCopyToClipboard(): void {
        copyTextToClipboard(props.shareUrl)
        toast.success('Sharable URL successfully copied to clipboard!')
    }

    return (
        <BaseModal
            size='md'
            classNames={{ modal: styles.shareCertificateModal }}
            title='Share your certificate'
            {...props}
        >
            <p className='body-main'>Share your certificate on social media</p>
            <div className={styles.shareBtnsWrap}>
                <FacebookSocialShareBtn
                    className={styles['share-btn']}
                    shareUrl={props.shareUrl}
                />
                <LinkedinSocialShareBtn
                    className={styles['share-btn']}
                    shareUrl={props.shareUrl}
                />
                <TwitterSocialShareBtn
                    className={styles['share-btn']}
                    shareUrl={props.shareUrl}
                />
            </div>
            <p className='body-main'>
                Put this validation link on your resume or share it with
                anyone you want to be able to validate your credentials.
            </p>
            <div
                className={styles.shareUrl}
                onFocus={selectText}
            >
                <input type='text' value={props.shareUrl} />

                <IconOutline.DuplicateIcon
                    className={styles.icon}
                    onClick={handleCopyToClipboard}
                />
            </div>
        </BaseModal>
    )
}

export default TCAShareCertificateModal
