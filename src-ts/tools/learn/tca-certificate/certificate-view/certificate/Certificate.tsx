import { FC, MutableRefObject } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import classNames from 'classnames'
import moment from 'moment'

import { LearnConfig } from '../../../learn-config'
import { TCAcademyLogoWhiteSvg, TCLogoSvg } from '../../../../../lib'
import { CertificateBadgeIcon, DougSigSvg, TCACertificateType, TCACertification } from '../../../learn-lib'

import styles from './Certificate.module.scss'

interface CertificateProps {
    certification: TCACertification
    completionUuid?: null | string
    completedDate?: string
    displaySignature?: boolean
    elRef?: MutableRefObject<HTMLElement | any>
    tcHandle?: string
    userName?: string
    validateLink?: string
    viewStyle?: 'large-container' | 'small-container'
}

const Certificate: FC<CertificateProps> = (props: CertificateProps) => {
    // TODO: add cross track theme/type support
    const certificateType: TCACertificateType = props.certification.certificationCategory?.track ?? 'DEV'

    const displaySignature: boolean = props.displaySignature ?? true

    // TODO: revisit this when certs expirations are defined, now just +1 year
    const expireDate: string = moment(props.completedDate || new Date())
        .add(1, 'year')
        .format('MMM D, YYYY')

    const elementSelector: { [attr: string]: string } = {
        [LearnConfig.CERT_ELEMENT_SELECTOR.attribute]: LearnConfig.CERT_ELEMENT_SELECTOR.value,
    }

    return (
        <div
            {...elementSelector}
            className={classNames(styles.wrap, props.viewStyle)}
            ref={props.elRef}
        >
            <div className={classNames(styles.theme, styles[`theme-${certificateType.toLowerCase()}`])}>
                <div className={classNames(styles.details)}>
                    <div className={styles.headerWrap}>
                        <CertificateBadgeIcon
                            type={certificateType}
                            level={props.certification.learnerLevel}
                        />
                        <div className={styles.logos}>
                            <TCLogoSvg />
                            <div className={styles.logosDivider} />
                            <TCAcademyLogoWhiteSvg />
                        </div>
                    </div>
                    <div className={styles.certWrap}>
                        <div className={styles.certOwner}>{props.userName || props.tcHandle || 'Your Name'}</div>
                        <p className={classNames('body-small', styles.certText)}>
                            has successfully completed the certification requirements and has been awarded
                        </p>
                        <div className={classNames('grad', styles.certTitle)}>
                            {props.certification.title}
                        </div>
                    </div>
                    {
                        props.completedDate && props.validateLink && (
                            <div className={styles.certInfo}>
                                <div className={styles.certInfoLeft}>
                                    <QRCodeSVG
                                        value={props.validateLink}
                                        size={57}
                                        className={styles.qrCode}
                                        includeMargin
                                    />
                                    <div className={styles.certInfoLeftData}>
                                        <span>Date of certification</span>
                                        <span className='ultra-small-medium'>{props.completedDate}</span>
                                        <span>Valid through</span>
                                        <span className={classNames('ultra-small-medium', styles.gridSeparator)}>
                                            {expireDate}
                                        </span>
                                        <span>Serial Number</span>
                                        <span className='ultra-small-medium'>{props.completionUuid}</span>
                                        <span>Validate at</span>
                                        <span className='ultra-small-medium'>{props.validateLink}</span>
                                    </div>
                                </div>
                                {
                                    displaySignature && (
                                        <div className={styles.sigWrap}>
                                            <DougSigSvg />
                                            <div className={styles.divider} />
                                            <span>Doug Hanson</span>
                                            <span>CEO, Topcoder</span>
                                        </div>
                                    )
                                }
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default Certificate
