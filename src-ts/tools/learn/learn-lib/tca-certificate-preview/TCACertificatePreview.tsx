import { FC, MutableRefObject, ReactNode, useRef } from 'react'
import classNames from 'classnames'

import { TCACertification, useCertificateScaling } from '..'

import { TCACertificate } from './tca-certificate'
import styles from './TCACertificatePreview.module.scss'

export interface TCACertificatePreviewProps {
    className?: string
    certificateElRef?: MutableRefObject<HTMLElement | any>
    certification: TCACertification
    userName?: string
    tcHandle?: string
    completedDate?: string
    completionUuid?: string
    validateLink?: string
    maxScale?: number
}

const TCACertificatePreview: FC<TCACertificatePreviewProps> = (props: TCACertificatePreviewProps) => {
    const certificateWrapRef: MutableRefObject<HTMLDivElement | any> = useRef()

    useCertificateScaling(certificateWrapRef, 880, 880, props.maxScale)

    function getPlaceholder(): ReactNode {
        return (
            <TCACertificate
                certification={props.certification}
                userName='Your Name'
            />
        )
    }

    function getCompletedCertificate(): ReactNode {
        return (
            <TCACertificate
                certification={props.certification}
                completedDate={props.completedDate ?? ''}
                completionUuid={props.completionUuid}
                displaySignature
                tcHandle={props.tcHandle ?? ''}
                userName={props.userName}
                validateLink={props.validateLink}
                elRef={props.certificateElRef}
            />
        )
    }

    return (
        <div className={classNames(props.className, styles.wrap)} ref={certificateWrapRef}>
            <div className={styles.inner}>
                {props.userName && props.completedDate ? getCompletedCertificate() : getPlaceholder()}
            </div>
        </div>
    )
}

export default TCACertificatePreview
