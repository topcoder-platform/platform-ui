/* eslint-disable react/no-danger */
import { FC, ReactNode, useMemo } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import {
    CertificateBadgeIcon,
    TCACertification,
    TCACertificationProgressProviderData,
    TCACertificationsProviderData,
    useGetAllTCACertifications,
    useGetTCACertificationProgress,
} from '../../learn-lib'
import { getTCACertificationPath } from '../../learn.routes'

import styles from './TCACertificationBanner.module.scss'
import { IconOutline, IconSolid } from '../../../../lib'

export interface TCACertificationBannerProps {
    userId?: number
    className?: string
    fccCertificateId?: string
}

function getStatusBox(icon: ReactNode, text: string, theme: string = 'gray'): ReactNode {
    return (
        <div className={styles.statusBox}>
            <div className={classNames(styles.icon, theme)}>
                {icon}
            </div>
            <div className='body-small'>
                {text}
            </div>
        </div>
    )
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

    // Fetch Enrollment status & progress
    const {
        progress: certifProgress,
    }: TCACertificationProgressProviderData = useGetTCACertificationProgress(
        props.userId as unknown as string,
        certification?.dashedName as string,
        { enabled: !!certification && !!props.userId },
    )

    if (!certification) {
        return <></>
    }

    const certifUrl: string = getTCACertificationPath(certification.dashedName)

    function renderStatusBox(): ReactNode {

        if (!certifProgress) {
            return (
                <Link
                    className={styles.link}
                    title='Learn more'
                    to={certifUrl}
                >
                    Learn more
                </Link>
            )
        }

        const coursesCount: number = certifProgress.coursesCount
        const completedCoursesCount: number = Math.round(coursesCount * (certifProgress.certificationProgress / 100))

        if (!completedCoursesCount) {
            return getStatusBox(
                <IconOutline.DotsCircleHorizontalIcon />,
                'Begin working towards earning this Topcoder Certification by starting this course today!',
            )
        }

        if (completedCoursesCount === 1) {
            return getStatusBox(
                <IconOutline.ClockIcon />,
                `Good job! You are making progress with 1 of ${coursesCount} required courses.`,
                'green',
            )
        }

        return getStatusBox(
            <IconSolid.CheckCircleIcon />,
            `You have completed ${completedCoursesCount} of ${coursesCount} required courses.`,
            'green',
        )
    }

    return (
        <div className={classNames(props.className, styles.wrap)}>
            <div className={styles.header}>
                <CertificateBadgeIcon
                    type={certification.certificationCategory.track}
                    level={certification.learnerLevel}
                />
                <div className={styles.headerContent}>
                    <div className='overline'>
                        This course is part of a topcoder certification:
                    </div>
                    <div className={classNames(styles.certTitle, 'body-main-bold')}>
                        {certification.title}
                        {!!certifProgress && (
                            <Link className={styles.externalLink} to={certifUrl}>
                                <IconOutline.ExternalLinkIcon />
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {!certifProgress && (
                <p className={classNames(styles.desc, 'body-small')}>
                    {certification.description}
                </p>
            )}

            {renderStatusBox()}
        </div>
    )
}

export default TCACertificationBanner
