import { FC, ReactNode, useCallback } from 'react'

import { TCACertification } from '../../learn-lib'

import { TCCertCard } from './cert-card'

import styles from './TCCertifications.module.scss'

interface TCCertificationsProps {
    certifications: ReadonlyArray<TCACertification>
}

const TCCertifications: FC<TCCertificationsProps> = (props: TCCertificationsProps) => {
    const renderListCard: (certification: TCACertification) => ReactNode
        = useCallback((certification: TCACertification) => (
            <TCCertCard certification={certification} key={certification.dashedName} />
        ), [])

    return (
        <div className={styles.wrap}>
            <h2 className='details'>Certifications</h2>
            <div className={styles.teaseBanner}>
                <h2>Introducing Topcoder Certifications</h2>
                <p>
                    We are happy to release Topcoder Certifications! Take advantage
                    of our pilot Certification program. Click on a certification below to learn more.
                </p>
            </div>

            <div className={styles.certsList}>
                {
                    props.certifications.map(renderListCard)
                }
            </div>
        </div>
    )
}

export default TCCertifications
