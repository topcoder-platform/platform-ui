import { FC } from 'react'
import classNames from 'classnames'

import { TCAcademyLogoMixedSvg, TcLogoSvg } from '../../../../lib'
import { CertificateNotFoundContent } from '../../learn-lib'

import { ReactComponent as BackgroundSvg } from './bg.svg'
import styles from './CertificateNotFound.module.scss'

const CertificateNotFound: FC<{}> = () => (
    <div className={styles.wrap}>
        <BackgroundSvg />
        <div className={styles.details}>
            <div className={styles.detailsInner}>
                <h2 className='details'>Topcoder Academy</h2>
                <h3>
                    Certificate
                    {' '}
                    <span className='nw'>not found</span>
                </h3>
                <CertificateNotFoundContent className='mobile-hide' />
                <div className={styles.logos}>
                    <div className={classNames(styles.logo, styles.whiteLogo)}>
                        <TcLogoSvg />
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.logo}>
                        <TCAcademyLogoMixedSvg />
                    </div>
                </div>
            </div>
        </div>
        <div className={styles.rightSide} />
    </div>
)

export default CertificateNotFound
