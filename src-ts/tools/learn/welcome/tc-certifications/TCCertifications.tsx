import { sortBy } from 'lodash'
import { FC, ReactNode, useCallback, useMemo } from 'react'
import classNames from 'classnames'

import { TCACertification, TCACertificationProgress } from '../../learn-lib'

import { TCCertCard } from './cert-card'
import styles from './TCCertifications.module.scss'

interface TCCertificationsProps {
    certifications: ReadonlyArray<TCACertification>
    progress: TCACertificationProgress[]
}

interface ProgressByIdCollection {
    [key: string]: TCACertificationProgress
}

const TCCertifications: FC<TCCertificationsProps> = (props: TCCertificationsProps) => {
    const progressById: ProgressByIdCollection = useMemo(() => (
        (props.progress ?? []).reduce((all, progress) => {
            all[progress.topcoderCertificationId] = progress
            return all
        }, {} as ProgressByIdCollection) ?? {}
    ), [props.progress])

    const renderListCard: (certification: TCACertification) => ReactNode
        = useCallback((certification: TCACertification) => (
            <TCCertCard
                certification={certification}
                key={certification.id}
                progress={progressById[certification.id]}
            />
        ), [progressById])

    const certificationsCount: number = props.certifications.length

    return (
        <div className={styles.wrap}>
            <h2 className='details'>
                Certifications
                <span className={classNames(styles.badge, 'medium-subtitle')}>
                    {certificationsCount}
                </span>
            </h2>
            <div className={styles.teaseBanner}>
                <h2>Introducing Topcoder Certifications</h2>
                <p>
                    We are happy to release Topcoder Certifications! Take advantage
                    of our pilot Certification program. Click on a certification below to learn more.
                </p>
            </div>

            <div className={styles.certsList}>
                {
                    sortBy(props.certifications, 'createdAt')
                        .map(renderListCard)
                }
            </div>
        </div>
    )
}

export default TCCertifications
