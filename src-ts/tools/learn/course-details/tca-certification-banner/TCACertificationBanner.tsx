/* eslint-disable react/no-danger */
import { FC, useMemo } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import {
    CertificateBadgeIcon,
    TCACertification,
    TCACertificationsProviderData,
    useGetAllTCACertifications,
} from '../../learn-lib'
import { getTCACertificationPath } from '../../learn.routes'

import styles from './TCACertificationBanner.module.scss'

export interface TCACertificationBannerProps {
    className?: string
    fccCertificateId?: string
}

const TCACertificationBanner: FC<TCACertificationBannerProps> = (props: TCACertificationBannerProps) => {

    const {
        certifications: tcaCertifications,
    }: TCACertificationsProviderData = useGetAllTCACertifications()

    const certification: TCACertification | undefined = useMemo(() => (
        tcaCertifications?.find(c => (
            c.certificationResources.find(fcc => `${fcc.resourceableId}` === `${props.fccCertificateId}`)
        ))
    ), [tcaCertifications, props.fccCertificateId])

    if (!certification) {
        return <></>
    }

    const certifUrl: string = getTCACertificationPath(certification.dashedName)

    return (
        <div className={classNames(props.className, styles.wrap)}>
            <div className={styles.header}>
                <CertificateBadgeIcon
                    type={certification.certificationCategory.track}
                    level={certification.learnerLevel}
                />
                <div className={styles.headerContent}>
                    <div className='overline'>
                        This course is part of A topcoder certification:
                    </div>
                    <div className='body-main-bold'>
                        {certification.title}
                    </div>
                </div>
            </div>

            <p className={classNames(styles.desc, 'body-small')}>
                {certification.description}
            </p>

            <Link
                className={styles.link}
                title='Learn more'
                to={certifUrl}
            >
                Learn more
            </Link>
        </div>
    )
}

export default TCACertificationBanner
