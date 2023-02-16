import { FC, MutableRefObject, ReactNode, useRef } from 'react'

import { UserProfile } from '../../../../lib'
import { TCACertification, useCertificateScaling } from '../../learn-lib'
import { Certificate } from '../../tca-certificate'

import styles from './CertificatePreview.module.scss'

interface CertificatePreviewProps {
    certification: TCACertification
    profile?: UserProfile,
    completedDate?: Date
}

const CertificatePreview: FC<CertificatePreviewProps> = (props: CertificatePreviewProps) => {
    const certificateWrapRef: MutableRefObject<HTMLDivElement | any> = useRef()

    useCertificateScaling(certificateWrapRef, 780, 780)

    function getPlaceholder(): ReactNode {
        return (
            <Certificate
                certification={props.certification}
                userName='Your Name'
                viewStyle='large-container'
            />
        )
    }

    function getCompletedCertificate(): ReactNode {
        if (!props.profile) {
            return <></>
        }

        const userName: string = (
            [props.profile.firstName, props.profile.lastName].filter(Boolean).join(' ')
            || props.profile.handle
        )

        return (
            // TODO: update validateLink with real link
            <Certificate
                certification={props.certification}
                completedDate={props.completedDate ? new Date(props.completedDate).toDateString() : ''}
                userName={userName}
                tcHandle={props.profile?.handle ?? ''}
                viewStyle='large-container'
                validateLink='https://google.com'
                displaySignature
            />
        )
    }

    return (
        <div className={styles.wrap} ref={certificateWrapRef}>
            {props.profile && props.completedDate ? getCompletedCertificate() : getPlaceholder()}
        </div>
    )
}

export default CertificatePreview
