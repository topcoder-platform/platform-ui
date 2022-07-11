import { FC } from 'react'

import { EnvironmentConfig } from '../../../../config'
import { Button } from '../../../../lib'

import styles from './HeroCard.module.scss'

interface HeroCardProps {
    userHandle?: string
}

const HeroCard: FC<HeroCardProps> = (props: HeroCardProps) => {

    return (
        <div className={styles['wrap']}>
            <div className={styles['line']}>
                <span>Learning looks good on you.</span>
                <Button
                    buttonStyle='link'
                    label='check out your profile'
                    url={`${EnvironmentConfig.TOPCODER_URLS.USER_PROFILE}/${props.userHandle}`}
                    target='_blank'
                />
            </div>
            <div className={styles['line']}>
                <span>Put your new skills to use.</span>
                <Button
                    buttonStyle='link'
                    label='compete in a challenge'
                    url={EnvironmentConfig.TOPCODER_URLS.CHALLENGES_PAGE}
                    target='_blank'
                />
            </div>
            <div className={styles['line']}>
                <span>Get that Gig!</span>
                <Button
                    buttonStyle='link'
                    label='see gig opportunities'
                    url={EnvironmentConfig.TOPCODER_URLS.GIGS_PAGE}
                    target='_blank'
                />
            </div>

        </div>
    )
}

export default HeroCard
