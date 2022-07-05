import { FC } from 'react'

import { Button } from '../../../../lib'

import styles from './HeroCard.module.scss'

const HeroCard: FC<{}> = () => {

    return (
        <div className={styles['wrap']}>
            <div className={styles['line']}>
                <span>Learning looks good on you.</span>
                <Button buttonStyle='link' label='check out your profile' />
            </div>
            <div className={styles['line']}>
                <span>Put your new skills to use.</span>
                <Button buttonStyle='link' label='compete in a challenge' />
            </div>
            <div className={styles['line']}>
                <span>Get that Gig!</span>
                <Button buttonStyle='link' label='see gig opportunities' />
            </div>

        </div>
    )
}

export default HeroCard
