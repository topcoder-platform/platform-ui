import { FC, MutableRefObject } from 'react'
import classNames from 'classnames'

import { LearnConfig } from '../../../learn-config'
import { LearnCertificateTrackType } from '../../../learn-lib'

import { CertificateBgPattern } from './certificate-bg-pattern'
import { CourseCard } from './course-card'
import { ReactComponent as TcAcademyLogoSvg } from './tc-academy-logo.svg'
import { ReactComponent as TcLogoSvg } from './tc-logo.svg'
import { ReactComponent as FccLogoSvg } from './vendor-fcc-logo.svg'
import styles from './Certificate.module.scss'

interface CertificateProps {
    completedDate?: string
    course?: string
    elRef?: MutableRefObject<HTMLElement | any>
    provider?: string
    tcHandle?: string
    type?: LearnCertificateTrackType
    userName?: string
    viewStyle?: 'large-container'
}

const Certificate: FC<CertificateProps> = (props: CertificateProps) => {

    const certificateType: LearnCertificateTrackType = props.type ?? 'DEV'

    const elementSelector: { [attr: string]: string } = {
        [LearnConfig.CERT_ELEMENT_SELECTOR.attribute]: LearnConfig.CERT_ELEMENT_SELECTOR.value,
    }

    return (
        <div
            {...elementSelector}
            className={classNames(styles.wrap, props.viewStyle)}
            ref={props.elRef}
        >
            <div className={classNames(styles.details, `theme-${certificateType.toLowerCase()}`)}>
                <div className={styles['details-inner']}>
                    <h2 className='details grad'>Topcoder Academy</h2>
                    <h3>Certificate of Course Completion</h3>
                    <h1 className={classNames(styles.username, 'grad')}>
                        {props.userName}
                    </h1>
                    <div className={classNames('large-subtitle', styles['tc-handle'])}>
                        <span>Topcoder Handle: </span>
                        <span>{props.tcHandle}</span>
                    </div>
                    <div className={styles.logos}>
                        <div className={styles.logo}>
                            <TcLogoSvg />
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.logo}>
                            <TcAcademyLogoSvg />
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.badges}>
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
                <div className={styles.vendor}>
                    <div className='body-ultra-small'>
                        Course content provided by
                        {' '}
                        {props.provider}
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
