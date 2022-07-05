import classNames from 'classnames'
import { FC } from 'react'

import { CertificateBgPattern } from './certificate-bg-pattern'
import { CertificateTrackType } from './certificate-track-type.enum'
import styles from './Certificate.module.scss'
import { CourseCard } from './course-card'
import { ReactComponent as TcAcademyLogoSvg } from './tc-academy-logo.svg'
import { ReactComponent as TcLogoSvg } from './tc-logo.svg'
import { ReactComponent as FccLogoSvg } from './vendor-fcc-logo.svg'

interface CertificateProps {
    completedDate?: string
    course?: string
    provider?: string
    tcHandle?: string
    userName?: string
}

const Certificate: FC<CertificateProps> = (props: CertificateProps) => {
    const certificateType: CertificateTrackType = 'DEV'

    return (
        <div className={styles['wrap']}>
            <div className={classNames(styles['details'], `theme-${certificateType.toLowerCase()}`)}>
                <h2 className='details'>Topcoder Academy</h2>
                <h3>Certificate of Course Completion</h3>
                <h1 className={styles['username']}>
                    {props.userName}
                </h1>
                <div className={classNames('large-subtitle', styles['tc-handle'])}>
                    <span>Topcoder Handle: </span>
                    <span>{props.tcHandle}</span>
                </div>
                <div className={styles['logos']}>
                    <div className={styles['logo']}>
                        <TcLogoSvg />
                    </div>
                    <div className={styles['divider']} />
                    <div className={styles['logo']}>
                        <TcAcademyLogoSvg />
                    </div>
                </div>
            </div>
            <div className={styles['badges']}>
                <div className={styles['pattern-bg']}>
                    <CertificateBgPattern type={certificateType} />
                </div>
                <div className={styles['course-card']}>
                    <CourseCard
                        type={certificateType}
                        course={props.course}
                        completedDate={props.completedDate}
                    />
                </div>
                <div className={styles['vendor']}>
                    <div className='body-ultra-small'>
                        Course content provided by {props.provider}
                    </div>
                    <div className={styles['vendor-logo']} title={props.provider}>
                        <FccLogoSvg />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Certificate
