import { FC, memo, ReactNode } from 'react'
import classNames from 'classnames'

import { FccLogoBlackSvg, IconLevel1, IconLevel2, IconLevel3, IconSolid, Tooltip } from '../../../../../lib'
import { TCACertification } from '../../../learn-lib'
import { SkillLabel } from '../../skill'
import { ReactComponent as TCACertBadgeDEV1 } from '../assets/web-dev-cert-badge-1.svg'

import styles from './TCCertCard.module.scss'

interface TCCertCardProps {
    certification: TCACertification
}

const EXCERPT_TEXT_LEN: number = 170
const LEVEL_ICONS_MAP: Record<string, ReactNode> = {
    Beginner: <IconLevel1 />,
    Expert: <IconLevel3 />,
    Intermediate: <IconLevel2 />,
}

const TCCertCard: FC<TCCertCardProps> = (props: TCCertCardProps) => {
    const desc: string = props.certification.description.slice(0, EXCERPT_TEXT_LEN)
    const { skills }: { skills: string[] } = props.certification

    return (
        <div className={styles.wrap}>
            <div className={styles.cardHeader}>
                {/* TODO: move this to import from learn-lib/svgs
                when implementing render logic based on learneLevel field... */}
                <TCACertBadgeDEV1 />
                <div className={styles.cardTitleWrap}>
                    <p className='body-large-medium'>{props.certification.title}</p>
                    <div className={styles.cardSubWrap}>
                        {LEVEL_ICONS_MAP[props.certification.learnerLevel]}
                        <span className={classNames('body-small', styles.infoText)}>
                            {props.certification.learnerLevel}
                        </span>
                        <IconSolid.DocumentTextIcon width={16} height={16} />
                        <span className={classNames('body-small', styles.infoText)}>
                            {/* {props.certification.estimatedCompletionTime} */}
                            {' courses'}
                        </span>
                        <IconSolid.ClockIcon width={16} height={16} />
                        <span className={classNames('body-small', styles.infoText)}>
                            {props.certification.estimatedCompletionTime}
                            {' hours'}
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

            <div className={styles.contentFrom}>
                <span className={classNames('body-small', styles.infoText)}>content from</span>
                <FccLogoBlackSvg />
            </div>
        </div>
    )
}

export default memo(TCCertCard)
