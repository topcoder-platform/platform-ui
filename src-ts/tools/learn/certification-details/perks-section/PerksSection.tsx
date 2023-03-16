import { FC } from 'react'
import classNames from 'classnames'

import { type PerkItem } from '../certification-details-modal/certif-details-content/data'

import { getPerkIcon } from './icons-map'
import styles from './PerksSection.module.scss'

interface PerksSectionProps {
    items: Array<PerkItem>
    title?: string
    theme?: 'clear'
}

const PerksSection: FC<PerksSectionProps> = (props: PerksSectionProps) => (
    <div className={classNames(styles.wrap, props.theme && styles[props.theme])}>
        <h2>{props.title ?? 'Why certify with Topcoder?'}</h2>
        <svg width='0' height='0'>
            <defs>
                <linearGradient
                    id='paint0_linear_1847_10558'
                    x1='-1.11475e-07'
                    y1='31.2359'
                    x2='41.4349'
                    y2='27.2123'
                    gradientUnits='userSpaceOnUse'
                >
                    <stop stopColor='#05456D' />
                    <stop offset='1' stopColor='#0A7AC0' />
                </linearGradient>
            </defs>
        </svg>
        <ul className={styles.perksList}>
            {props.items.map(perk => (
                <li key={perk.title}>
                    <div className={styles.perkIcon}>
                        {getPerkIcon(perk)}
                    </div>
                    <div className={styles.perkContent}>
                        <h3 className='details'>{perk.title}</h3>
                        <p className='body-main'>{perk.description}</p>
                    </div>
                </li>
            ))}
        </ul>
    </div>
)

export default PerksSection
