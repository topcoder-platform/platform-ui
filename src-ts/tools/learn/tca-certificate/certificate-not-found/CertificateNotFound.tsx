import { FC } from 'react'
import classNames from 'classnames'

import { TCAcademyLogoWhiteSvg, TCLogoSvg } from '../../../../lib'
import { CertificateNotFoundContent } from '../../learn-lib'

import { ReactComponent as BackgroundSvg } from './bg.svg'
import { ReactComponent as BadgeSvg } from './badge.svg'
import styles from './CertificateNotFound.module.scss'

const CertificateNotFound: FC<{}> = () => (
    <div className={styles.wrap}>
        <BackgroundSvg />
        <div className={styles.details}>
            <div className={classNames(styles.headerWrap, 'mobile-hide')}>
                <BadgeSvg />
                <div className={styles.logos}>
                    <TCLogoSvg />
                    <div className={styles.logosDivider} />
                    <TCAcademyLogoWhiteSvg />
                </div>
            </div>
            <div className={styles.contentWrap}>
                <h2 className='details desktop-hide'>Topcoder Academy</h2>
                <h3>
                    Certificate
                    <br />
                    not found
                </h3>
                <CertificateNotFoundContent className='mobile-hide' />
                <div className={classNames('desktop-hide', styles.logos)}>
                    <TCLogoSvg />
                    <div className={styles.logosDivider} />
                    <TCAcademyLogoWhiteSvg />
                </div>
            </div>
            <BadgeSvg className={styles.mobileBadge} />
        </div>
    </div>
)

export default CertificateNotFound
