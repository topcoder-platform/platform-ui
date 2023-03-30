import {
    FC,
    MutableRefObject,
    ReactNode,
    useCallback,
    useLayoutEffect,
    useRef,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import classNames from 'classnames'

import {
    fileDownloadCanvasAsImage,
    IconOutline,
    LoadingSpinner,
    NavigateBackFunction,
    useNavigateBack,
} from '../../../../lib'
import { useCertificateScaling } from '../use-certificate-scaling-hook'
import { useCertificateCanvas } from '../use-certificate-canvas-hook'
import { ActionButton } from '../action-button'
import { hideSiblings } from '../functions'
import { getViewStyleParamKey } from '../../learn.routes'
import { TCAShareCertificateModalData, useTCAShareCertificateModal } from '../tca-share-certificate-modal'
import { useCertificatePrint } from '../use-certificate-print-hook'

import styles from './CertificatePageLayout.module.scss'

export type CertificatePageLayoutStyle = 'large-container'

interface CertificatePageLayoutProps {
    certificateElRef: MutableRefObject<HTMLDivElement|undefined>
    children?: ReactNode
    afterContent?: ReactNode
    className?: string
    disableActions?: boolean
    fallbackBackUrl?: string
    fullScreenCertLayout?: boolean
    isCertificateCompleted?: boolean
    isReady?: boolean
    ssrUrl: string
    title?: string
}

const CertificatePageLayout: FC<CertificatePageLayoutProps> = (props: CertificatePageLayoutProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const viewStyle: CertificatePageLayoutStyle = queryParams.get(getViewStyleParamKey()) as CertificatePageLayoutStyle

    const wrapElRef: MutableRefObject<HTMLElement | any> = useRef()
    const certificateWrapRef: MutableRefObject<HTMLDivElement | any> = useRef()
    const navigateBack: NavigateBackFunction = useNavigateBack()

    const shareModal: TCAShareCertificateModalData = useTCAShareCertificateModal(props.ssrUrl)

    useCertificateScaling(
        props.isReady ? certificateWrapRef : undefined,
        880,
        880,
        viewStyle ? 1 : Math.min(),
    )

    const handleBackBtnClick: () => void = useCallback(() => {
        navigateBack(props.fallbackBackUrl ?? '')
    }, [props.fallbackBackUrl, navigateBack])

    const getCertificateCanvas: () => Promise<HTMLCanvasElement | void>
        = useCertificateCanvas(props.certificateElRef)

    const handleDownload: () => Promise<void> = useCallback(async () => {

        const canvas: HTMLCanvasElement | void = await getCertificateCanvas()
        if (!!canvas) {
            fileDownloadCanvasAsImage(canvas, `${props.title}.png`)
        }

    }, [props.title, getCertificateCanvas])

    const handlePrint: () => Promise<void>
        = useCertificatePrint(props.certificateElRef, props.title ?? '')

    useLayoutEffect(() => {
        const el: HTMLElement = wrapElRef.current
        if (props.fullScreenCertLayout !== true || !el) {
            return
        }

        hideSiblings(el)
        hideSiblings(el.parentElement as HTMLElement)
        el.classList.add(styles['full-screen-cert'])
    })

    return (
        <>
            <LoadingSpinner hide={props.isReady} />

            {props.isReady && (
                <div className={classNames(styles.wrap, props.className)} ref={wrapElRef}>
                    <div className={styles['content-wrap']}>
                        {!props.fullScreenCertLayout && (
                            <div className={styles['btns-wrap']}>
                                <ActionButton
                                    icon={<IconOutline.ChevronLeftIcon />}
                                    onClick={handleBackBtnClick}
                                />
                            </div>
                        )}
                        <div
                            className={classNames(styles['certificate-wrap'], viewStyle)}
                            ref={certificateWrapRef}
                        >
                            <div className={styles.certifInnerWrap}>
                                {props.children}
                            </div>
                        </div>
                        {!props.fullScreenCertLayout && (
                            <div
                                className={
                                    classNames(
                                        styles['btns-wrap'],
                                        (!props.isCertificateCompleted || props.disableActions) && styles.disabled,
                                    )
                                }
                            >
                                <ActionButton
                                    icon={<IconOutline.PrinterIcon />}
                                    onClick={handlePrint}
                                />
                                <ActionButton
                                    icon={<IconOutline.DownloadIcon />}
                                    onClick={handleDownload}
                                />
                                <ActionButton
                                    icon={<IconOutline.ShareIcon />}
                                    onClick={shareModal.show}
                                >
                                    Share certificate
                                </ActionButton>
                            </div>
                        )}
                    </div>
                    {props.afterContent}
                    {shareModal.modal}
                </div>
            )}
        </>
    )
}

export default CertificatePageLayout
