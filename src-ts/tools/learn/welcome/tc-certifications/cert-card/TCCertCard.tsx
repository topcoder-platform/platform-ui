import { FC, memo } from 'react'
import classNames from 'classnames'

import { IconSolid, Tooltip } from '../../../../../lib'
import { CertificateBadgeIcon, LearnLevelIcon, ProvidersLogoList, TCACertification } from '../../../learn-lib'
import { SkillLabel } from '../../skill'

import styles from './TCCertCard.module.scss'

interface TCCertCardProps {
    certification: TCACertification
}

const EXCERPT_TEXT_LEN: number = 170

const TCCertCard: FC<TCCertCardProps> = (props: TCCertCardProps) => {
    const desc: string = props.certification.description.slice(0, EXCERPT_TEXT_LEN)
    const { skills }: { skills: string[] } = props.certification

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
                            {props.certification.estimatedCompletionTime}
                            {' months'}
                        </span>
                        <IconSolid.CurrencyDollarIcon width={16} height={16} />
                        <span className={classNames('body-small', styles.infoText)}>
                            {' One time payment'}
                        </span>
                    </div>
                </div>
                <div className={styles.newLabel}>NEW</div>
            </div>

            <p>
                {desc}
                {props.certification.description.length > EXCERPT_TEXT_LEN ? '...' : ''}
            </p>

            <div className={styles.skills}>
                <span className={classNames('body-small', styles.infoText)}>skills taught</span>
                {skills.slice(0, 3)
                    .map(skill => <SkillLabel skill={skill} />)}
                {skills.length > 3 && (
                    <Tooltip
                        content={skills.slice(0, 3)
                            .join(', ')}
                        trigger={<SkillLabel skill={`+ ${skills.slice(0, 3).length}`} />}
                    />
                )}
            </div>

            <ProvidersLogoList
                className={styles.providers}
                label='content from'
                providers={props.certification.providers}
            />
        </div>
    )
}

export default memo(TCCertCard)
