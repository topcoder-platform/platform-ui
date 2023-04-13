import { FC, memo, ReactNode } from 'react'
import classNames from 'classnames'

import { EnvironmentConfig } from '~/config'
import {
    Button,
    ButtonStyle,
    IconSolid,
    ProgressBar,
} from '~/libs/ui'

import { getTCACertificationPath, getTCAUserCertificationUrl } from '../../../learn.routes'
import {
    CertificateBadgeIcon,
    CompletionTimeRange,
    LearnLevelIcon,
    ProvidersLogoList,
    SkillTags,
    TCACertification,
    TCACertificationProgress,
    TCACertificationProviderBase,
} from '../../../lib'

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

    const isCompleted: boolean = props.progress?.status === 'completed'

    function renderCta(): ReactNode {
        if (!isEnrolled && !isCompleted) {
            return getCtaBtn('secondary', 'Details', getTCACertificationPath(dashedName))
        }

        if (isCompleted) {
            const certificatePath: string = getTCAUserCertificationUrl(dashedName, props.progress?.userHandle as string)
            return (
                <div className={styles.completedCTAs}>
                    <div className={styles.certCTAButtons}>
                        {getCtaBtn('primary', 'View Certificate', certificatePath)}
                        {getCtaBtn('secondary', 'Details', getTCACertificationPath(dashedName))}
                    </div>
                </div>
            )
        }

        return getCtaBtn('primary', 'Resume', getTCACertificationPath(dashedName))
    }

    function renderStats(): ReactNode {
        return (
            <div className={styles.cardSubWrap}>
                <div className={styles.subTitleItem}>
                    <LearnLevelIcon level={props.certification.learnerLevel} />
                    <span className={classNames('body-small', styles.infoText)}>
                        {props.certification.learnerLevel}
                    </span>
                </div>
                <div className={styles.subTitleItem}>
                    <IconSolid.DocumentTextIcon width={16} height={16} />
                    <span className={classNames('body-small', styles.infoText)}>
                        {props.certification.coursesCount}
                        {' courses'}
                    </span>
                </div>
                <div className={styles.subTitleItem}>
                    <IconSolid.ClockIcon width={16} height={16} />
                    <span className={classNames('body-small', styles.durationWrap)}>
                        <CompletionTimeRange range={props.certification.completionTimeRange} />
                    </span>
                </div>
            </div>
        )
    }

    function renderProgressBar(): ReactNode {
        if (!isEnrolled && !isCompleted) {
            return <div className={styles.separatorBar} />
        }

        return (
            <div className={styles.progressBar}>
                <ProgressBar
                    progress={props.progress.certificationProgress / 100}
                    track={props.certification.certificationCategory.track}
                />
            </div>
        )
    }

    return (
        <div className={classNames(styles.wrap, isCompleted && styles.completed)}>
            <div className={styles.cardHeader}>
                <CertificateBadgeIcon
                    type={props.certification.certificationCategory.track}
                    level={props.certification.learnerLevel}
                />
                <div className={styles.cardHeadline}>
                    <div className={styles.cardTitleline}>
                        <p className='body-large-medium'>{props.certification.title}</p>

                        <div className={styles.cardLabels}>
                            <div className={styles.newLabel}>NEW</div>
                            {!EnvironmentConfig.ENABLE_TCA_CERT_MONETIZATION
                                && <div className={styles.freeLabel}>FREE</div>}
                        </div>
                    </div>
                    {renderStats()}
                </div>
            </div>

            {renderProgressBar()}

            <p>
                {desc}
                {props.certification.description.length > EXCERPT_TEXT_LEN ? '...' : ''}
            </p>

            <SkillTags
                skills={skills}
                courseKey={dashedName}
                theme={isCompleted ? 'gray' : 'white'}
            />

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
