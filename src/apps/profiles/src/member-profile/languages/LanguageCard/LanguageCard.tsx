import { FC } from 'react'

import { UserTrait } from '~/libs/core'

import styles from './LanguageCard.module.scss'

interface LanguageCardProps {
    trait: UserTrait
}

const LanguageCard: FC<LanguageCardProps> = (props: LanguageCardProps) => (
    <div className={styles.language}>
        <p className='body-main-bold'>{props.trait.language}</p>
    </div>
)

export default LanguageCard
