import type { FC, SyntheticEvent } from 'react'

import { BaseModal, Button, LoadingSpinner } from '~/libs/ui'

import styles from './TermsAgreementModal.module.scss'

/**
 * Defines the content and callbacks needed to present a required engagement terms agreement.
 */
export interface TermsAgreementModalProps {
    open: boolean
    onClose: () => void
    contextDescription: string
    termsLabel?: string
    termsTitle: string
    termsBody?: string
    termsLoading: boolean
    termsError?: string
    termsAgreeing: boolean
    isElectronicallyAgreeable: boolean
    isDocuSignTerm: boolean
    docuSignUrl?: string
    docuSignLoading: boolean
    termsUrl?: string
    onAgree: () => void
    onOpenTermsLink: () => void
    onDocuSignFrameLoad?: (event: SyntheticEvent<HTMLIFrameElement>) => void
}

type TermsModalButtonProps = Pick<
    TermsAgreementModalProps,
    | 'isDocuSignTerm'
    | 'isElectronicallyAgreeable'
    | 'onAgree'
    | 'onClose'
    | 'onOpenTermsLink'
    | 'termsAgreeing'
    | 'termsLoading'
    | 'termsUrl'
>

type TermsModalDocuSignProps = Pick<
    TermsAgreementModalProps,
    | 'docuSignLoading'
    | 'docuSignUrl'
    | 'onDocuSignFrameLoad'
    | 'termsAgreeing'
    | 'termsTitle'
    | 'termsUrl'
>

type TermsModalBodyProps = Pick<TermsAgreementModalProps, 'termsBody' | 'termsUrl'>

type TermsModalContentProps = TermsModalBodyProps
    & TermsModalDocuSignProps
    & Pick<TermsAgreementModalProps, 'isDocuSignTerm' | 'termsLoading'>

const getTermsModalDescription = (
    termsLabel: string | undefined,
    contextDescription: string,
): string => {
    const subject = termsLabel ? `the ${termsLabel}` : 'these Terms & Conditions'
    return `You are seeing ${subject} because ${contextDescription}. You must agree to continue.`
}

const renderTermsModalButtons = (props: TermsModalButtonProps): JSX.Element => {
    if (props.isDocuSignTerm) {
        return (
            <Button
                secondary
                label='Close'
                onClick={props.onClose}
                disabled={props.termsAgreeing}
            />
        )
    }

    if (props.isElectronicallyAgreeable) {
        return (
            <>
                <Button
                    secondary
                    label='I Disagree'
                    onClick={props.onClose}
                    disabled={props.termsAgreeing}
                />
                <Button
                    primary
                    label='I Agree'
                    onClick={props.onAgree}
                    disabled={props.termsAgreeing || props.termsLoading}
                    loading={props.termsAgreeing}
                />
            </>
        )
    }

    return (
        <>
            <Button
                secondary
                label='Close'
                onClick={props.onClose}
                disabled={props.termsAgreeing}
            />
            <Button
                primary
                label='Open Terms'
                onClick={props.onOpenTermsLink}
                disabled={!props.termsUrl}
            />
        </>
    )
}

const renderTermsDocuSignSection = (props: TermsModalDocuSignProps): JSX.Element => {
    const isProcessing = props.docuSignLoading || props.termsAgreeing
    const statusMessage = props.docuSignLoading
        ? 'Loading agreement...'
        : 'Finalizing your agreement...'

    return (
        <div className={styles.termsDocuSign}>
            {isProcessing && (
                <div className={styles.termsDocuSignOverlay}>
                    <LoadingSpinner className={styles.termsModalSpinner} />
                    <span className={styles.termsDocuSignStatus}>{statusMessage}</span>
                </div>
            )}
            {!isProcessing && props.docuSignUrl && (
                <iframe
                    className={styles.termsDocuSignFrame}
                    src={props.docuSignUrl}
                    title={props.termsTitle}
                    onLoad={props.onDocuSignFrameLoad}
                />
            )}
            {!isProcessing && !props.docuSignUrl && (
                <div className={styles.termsModalFallback}>
                    <p>We could not load the agreement.</p>
                    {props.termsUrl && (
                        <a
                            className={styles.termsModalLink}
                            href={props.termsUrl}
                            target='_blank'
                            rel='noreferrer'
                        >
                            Open Terms of Use
                        </a>
                    )}
                </div>
            )}
        </div>
    )
}

const renderTermsBodySection = (props: TermsModalBodyProps): JSX.Element => (
    <div className={styles.termsModalBody}>
        {props.termsBody ? (
            <div
                className={styles.termsContent}
                dangerouslySetInnerHTML={{ __html: props.termsBody }}
            />
        ) : (
            <div className={styles.termsModalFallback}>
                <p>We could not load the full terms text.</p>
                {props.termsUrl && (
                    <a
                        className={styles.termsModalLink}
                        href={props.termsUrl}
                        target='_blank'
                        rel='noreferrer'
                    >
                        Open Terms of Use
                    </a>
                )}
            </div>
        )}
    </div>
)

const renderTermsModalContent = (props: TermsModalContentProps): JSX.Element => {
    if (props.termsLoading) {
        return (
            <div className={styles.termsModalLoading}>
                <LoadingSpinner className={styles.termsModalSpinner} />
            </div>
        )
    }

    if (props.isDocuSignTerm) {
        return renderTermsDocuSignSection(props)
    }

    return renderTermsBodySection(props)
}

/**
 * Renders the terms and NDA agreement modal shared by engagement apply and accept-offer flows.
 */
const TermsAgreementModal: FC<TermsAgreementModalProps> = (
    props: TermsAgreementModalProps,
): JSX.Element => {
    const buttonProps: TermsModalButtonProps = {
        isDocuSignTerm: props.isDocuSignTerm,
        isElectronicallyAgreeable: props.isElectronicallyAgreeable,
        onAgree: props.onAgree,
        onClose: props.onClose,
        onOpenTermsLink: props.onOpenTermsLink,
        termsAgreeing: props.termsAgreeing,
        termsLoading: props.termsLoading,
        termsUrl: props.termsUrl,
    }
    const contentProps: TermsModalContentProps = {
        docuSignLoading: props.docuSignLoading,
        docuSignUrl: props.docuSignUrl,
        isDocuSignTerm: props.isDocuSignTerm,
        onDocuSignFrameLoad: props.onDocuSignFrameLoad,
        termsAgreeing: props.termsAgreeing,
        termsBody: props.termsBody,
        termsLoading: props.termsLoading,
        termsTitle: props.termsTitle,
        termsUrl: props.termsUrl,
    }
    const description = getTermsModalDescription(props.termsLabel, props.contextDescription)

    return (
        <BaseModal
            open={props.open}
            onClose={props.onClose}
            size='lg'
            title={props.termsTitle}
            buttons={renderTermsModalButtons(buttonProps)}
        >
            <div className={styles.termsModalDescription}>{description}</div>
            {renderTermsModalContent(contentProps)}
            {props.termsError && props.open && (
                <div className={styles.termsModalError}>{props.termsError}</div>
            )}
        </BaseModal>
    )
}

export default TermsAgreementModal
