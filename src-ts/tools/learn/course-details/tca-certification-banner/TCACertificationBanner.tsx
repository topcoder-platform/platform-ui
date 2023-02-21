/* eslint-disable react/no-danger */
import { FC, ReactNode, useMemo } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { IconOutline, IconSolid } from '../../../../lib'
import {
    CertificateBadgeIcon,
    LearnUserCertificationProgress,
    TCACertification,
    TCACertificationProgressProviderData,
    TCACertificationsProviderData,
    useGetAllTCACertifications,
    useGetTCACertificationProgress,
    useGetUserCertifications,
    UserCertificationProgressStatus,
    UserCertificationsProviderData,
} from '../../learn-lib'
import { getTCACertificationPath } from '../../learn.routes'

import styles from './TCACertificationBanner.module.scss'

interface ProgressByIdCollection {
    [key: string]: LearnUserCertificationProgress
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

export interface TCACertificationBannerProps {
    userId?: number
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

    // Fetch Enrollment status & progress
    const {
        progress: certifProgress,
        ready: certifProgressReady,
    }: TCACertificationProgressProviderData = useGetTCACertificationProgress(
        props.userId as unknown as string,
        certification?.dashedName as string,
        { enabled: !!certification && !!props.userId },
    )

    // Fetch the User's progress for all the tca certification's courses
    // so we can show their progress even before they enroll with the certification
    const {
        progresses: certsProgress,
    }: UserCertificationsProviderData = useGetUserCertifications('freeCodeCamp', {
        enabled: certifProgressReady && !certifProgress,
    })

    const progressById: ProgressByIdCollection = useMemo(() => (
        certsProgress?.reduce((all, progress) => {
            all[progress.certificationId] = progress
            return all
        }, {} as ProgressByIdCollection) ?? {}
    ), [certsProgress])

    if (!certification) {
        return <></>
    }

    const certifUrl: string = getTCACertificationPath(certification.dashedName)

    function renderStatusBox(): ReactNode {
        if (!certification) {
            return <></>
        }

        const coursesCount: number = certification.coursesCount
        const completedCoursesCount: number = certifProgress
            ? Math.round(coursesCount * (certifProgress.certificationProgress / 100))
            : certification.certificationResources.filter(d => (
                progressById[d.freeCodeCampCertification.fccId]?.status === UserCertificationProgressStatus.completed
            )).length

        if (!completedCoursesCount) {
            return certifProgress ? getStatusBox(
                <IconOutline.DotsCircleHorizontalIcon />,
                'Begin working towards earning this Topcoder Certification by starting this course today!',
            ) : <></>
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

            {!certifProgress && (
                <Link
                    className={styles.link}
                    title='Learn more'
                    to={certifUrl}
                >
                    Learn more
                </Link>
            )}
        </div>
    )
}

export default TCACertificationBanner
