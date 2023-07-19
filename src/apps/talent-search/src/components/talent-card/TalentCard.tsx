import { FC } from 'react'

import { IconSolid } from '~/libs/ui'

import { MatchBar } from '../match-bar'
import { SkillPill } from '../skill-pill'
import UserAvatar from '../../assets/user.jpg'

import styles from './TalentCard.module.scss'

interface TalentCardProps {
    match?: number
}

const TalentCard: FC<TalentCardProps> = props => {
    const a = 0
    console.log(a)

    return (
        <div className={styles.wrap}>
            <div className={styles.profilePic}>
                <img src={UserAvatar} alt='/' />
            </div>
            <div className={styles.detailsContainer}>
                <div className={styles.talentInfo}>
                    <div className={styles.talentInfoName}>
                        Emily Johnson
                    </div>
                    <div className={styles.talentInfoHandle}>
                        <span className='body-medium-normal'>CodeSprite</span>
                    </div>
                    <div className={styles.talentInfoLocation}>
                        <IconSolid.LocationMarkerIcon className='icon-xxl' />
                        <span className='body-main'>San Francisco, Ca, United States</span>
                    </div>
                </div>
                <MatchBar className={styles.matchBar} percent={props.match} />
                <div className={styles.skillsWrap}>
                    <SkillPill skill={{ emsiId: '1', name: 'HTML' }} verified />
                    <SkillPill skill={{ emsiId: '1', name: 'LESS' }} theme='dark' />
                    <SkillPill skill={{ emsiId: '1', name: '+45' }} theme='etc' />
                </div>
            </div>
        </div>
    )
}

export default TalentCard
