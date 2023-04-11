import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import {
    LearnCertificateTrackType,
    TCACertificationLearnLevel,
    TCACertificationProviderBase,
} from '../../data-providers'
import { CourseBadge } from '../course-badge'
import { CertificateBadgeIcon } from '../dynamic-icons'
import { ProvidersLogoList } from '../providers-logo-list'

import styles from './CourseTitle.module.scss'

export enum TitleBadgeType {
    course = 'course',
    tcaCertification = 'tca-certification'
}

interface CourseTitleProps {
    badgeType?: TitleBadgeType
    children?: ReactNode
    learnLevel?: TCACertificationLearnLevel
    provider?: string
    providers?: TCACertificationProviderBase[]
    size?: 'md'|'lg'|'xl'
    title: string
    trackType?: LearnCertificateTrackType
}

const CourseTitle: FC<CourseTitleProps> = (props: CourseTitleProps) => {
    const title: ReactNode = (!props.size || props.size === 'md') ? (
        <div className='body-main-bold'>
            {props.title}
        </div>
    ) : (
        <h1 className={classNames(props.size === 'lg' ? 'details' : '', props.size)}>
            {props.title}
        </h1>
    )

    return (
        <div className={classNames(styles.wrap, props.size)}>
            <div className={classNames('badge-icon', props.size)}>
                {props.badgeType === TitleBadgeType.tcaCertification ? (
                    <CertificateBadgeIcon type={props.trackType ?? 'DEV'} level={props.learnLevel!} />
                ) : (
                    <CourseBadge type={props.trackType ?? 'DEV'} />
                )}
            </div>
            <div className={styles.text}>
                <div className={styles['title-row']}>
                    {title}
                    <span className='mobile-hide'>
                        {props.children}
                    </span>
                </div>
                {(props.provider || props.providers?.length) && (
                    <em className={classNames('quote-small', props.size)}>
                        <ProvidersLogoList
                            providers={props.providers ?? [{ name: props.provider } as TCACertificationProviderBase]}
                            label='by'
                        />
                    </em>
                )}
                <span className='desktop-hide'>
                    {props.children}
                </span>
            </div>
        </div>
    )
}

export default CourseTitle
