import { compact } from 'lodash'
import { FC } from 'react'

import { UserTrait } from '~/libs/core'

import styles from './LanguageCard.module.scss'

interface LanguageCardProps {
    trait: UserTrait
}

const LanguageCard: FC<LanguageCardProps> = (props: LanguageCardProps) => (
    <div className={styles.language}>
        <p className='body-main-medium'>{props.trait.language}</p>
        <p className='body-small'>
            {compact([
                props.trait.spokenLevel ? `Spoken: ${props.trait.spokenLevel}` : undefined,
                props.trait.writtenLevel ? `Written: ${props.trait.writtenLevel}` : undefined,
            ])
                .join(' | ')}
        </p>
    </div>
)

export default LanguageCard
