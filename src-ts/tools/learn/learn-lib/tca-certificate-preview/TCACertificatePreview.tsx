import { FC, MutableRefObject, ReactNode, useRef } from 'react'
import classNames from 'classnames'

import { TCACertification, useCertificateScaling } from '..'

import { TCACertificate } from './tca-certificate'
import styles from './TCACertificatePreview.module.scss'

interface TCACertificatePreviewProps {
    className?: string
    certificateElRef?: MutableRefObject<HTMLElement | any>
    certification: TCACertification
    userName?: string
    tcHandle?: string
    completedDate?: string
    completionUuid?: string
    validateLink?: string
    viewStyle?: 'large-container' | 'small-container'
}

const TCACertificatePreview: FC<TCACertificatePreviewProps> = (props: TCACertificatePreviewProps) => {
    const certificateWrapRef: MutableRefObject<HTMLDivElement | any> = useRef()

    useCertificateScaling(certificateWrapRef, 880, 880)

    function getPlaceholder(): ReactNode {
        return (
            <TCACertificate
                certification={props.certification}
                userName='Your Name'
                viewStyle='large-container'
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
                viewStyle={props.viewStyle ?? 'large-container'}
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
