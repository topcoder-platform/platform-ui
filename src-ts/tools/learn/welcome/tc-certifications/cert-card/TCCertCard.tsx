import { FC, memo, ReactNode } from 'react'
import classNames from 'classnames'

import { Button, ButtonStyle, IconSolid, ProgressBar } from '../../../../../lib'
import {
    CertificateBadgeIcon,
    LearnLevelIcon,
    ProvidersLogoList,
    SkillTags,
    TCACertification,
    TCACertificationProgress,
    TCACertificationProviderBase,
} from '../../../learn-lib'
import { getTCACertificationPath } from '../../../learn.routes'

import styles from './TCCertCard.module.scss'

interface TCCertCardProps {
    certification: TCACertification
    progress: TCACertificationProgress
}

const getCtaBtn: (style: ButtonStyle, label: string, route: string) => ReactNode
    = (style: ButtonStyle, label: string, route: string) => (
        <Button buttonStyle={style} size='sm' label={label} route={route} />
    )

const EXCERPT_TEXT_LEN: number = 165

const TCCertCard: FC<TCCertCardProps> = (props: TCCertCardProps) => {
    const desc: string = props.certification.description.slice(0, EXCERPT_TEXT_LEN)
    const { skills, providers, dashedName }: {
        skills: string[],
        providers: Array<TCACertificationProviderBase>,
        dashedName: string
    } = props.certification

    const isEnrolled: boolean = props.progress?.status === 'enrolled'

    function renderCta(): ReactNode {
        if (!isEnrolled) {
            return getCtaBtn('secondary', 'Details', getTCACertificationPath(dashedName))
        }

        return getCtaBtn('primary', 'Resume', getTCACertificationPath(dashedName))
    }

    function renderProgressBar(): ReactNode {
        if (props.progress?.status !== 'enrolled') {
            return <div className={styles.separatorBar} />
        }

        return (
            <div className={styles.progressBar}>
                <ProgressBar progress={props.progress.certificationProgress / 100} />
            </div>
        )
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.cardHeader}>
                <CertificateBadgeIcon
                    type={props.certification.certificationCategory.track}
                    level={props.certification.learnerLevel}
                />
                <div className={styles.cardTitleWrap}>
                    <p className='body-large-medium'>{props.certification.title}</p>
                    <div className={styles.cardSubWrap}>
                        <LearnLevelIcon level={props.certification.learnerLevel} />
                        <span className={classNames('body-small', styles.infoText)}>
                            {props.certification.learnerLevel}
                        </span>
                        <IconSolid.DocumentTextIcon width={16} height={16} />
                        <span className={classNames('body-small', styles.infoText)}>
                            {props.certification.coursesCount}
                            {' courses'}
                        </span>
                        <IconSolid.ClockIcon width={16} height={16} />
                        <span className={classNames('body-small', styles.infoText)}>
                            {props.certification.completionTimeRange.lowRangeValue}
                            -
                            {props.certification.completionTimeRange.highRangeValue}
                            {' '}
                            {props.certification.completionTimeRange.units}
                        </span>
                        {/* TODO: Uncomment this when paid certs come to prod! */}
                        {/* <IconSolid.CurrencyDollarIcon width={16} height={16} />
                        <span className={classNames('body-small', styles.infoText)}>
                            {' One time payment'}
                        </span> */}
                    </div>
                </div>
                <div className={styles.newLabel}>NEW</div>
            </div>

            {renderProgressBar()}

            <p>
                {desc}
                {props.certification.description.length > EXCERPT_TEXT_LEN ? '...' : ''}
            </p>

            <SkillTags skills={skills} courseKey={dashedName} />

            <ProvidersLogoList
                className={styles.providers}
                label='content from'
                providers={providers}
            />

            <div className={styles.cardBottom}>
                {renderCta()}
            </div>
        </div>
    )
}

export default memo(TCCertCard)
