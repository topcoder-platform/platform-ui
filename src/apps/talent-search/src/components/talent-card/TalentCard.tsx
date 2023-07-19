import { CSSProperties, FC } from 'react'
import { orderBy } from 'lodash'

import { IconSolid } from '~/libs/ui'
import { EmsiSkill } from '~/libs/shared'

import { MatchBar } from '../match-bar'
import { SkillPill } from '../skill-pill'
import { Member } from '../../lib/models'

import styles from './TalentCard.module.scss'

interface TalentCardProps {
    isMatchingSkill: (skill: EmsiSkill) => boolean
    member: Member
    match?: number
}

const TalentCard: FC<TalentCardProps> = props => {
    const visibleSkills = orderBy(props.member.emsiSkills, props.isMatchingSkill, 'desc')
        .slice(0, 6) as EmsiSkill[]

    const hiddenSkills = props.member.emsiSkills.length - visibleSkills.length

    return (
        <div className={styles.wrap}>
            <div
                className={styles.profilePic}
                style={{ '--background-image-url': `url(${props.member.photoURL})` } as CSSProperties}
            >
                <span className={styles.profileInitials}>
                    {props.member.firstName.slice(0, 1)}
                    {props.member.lastName.slice(0, 1)}
                </span>
                <img src={props.member.photoURL} alt='' />
            </div>
            <div className={styles.detailsContainer}>
                <div className={styles.talentInfo}>
                    <div className={styles.talentInfoName}>
                        {props.member.firstName}
                        {' '}
                        {props.member.lastName}
                    </div>
                    <div className={styles.talentInfoHandle}>
                        <span className='body-medium-normal'>
                            {props.member.handle}
                        </span>
                    </div>
                    {props.member.addresses?.map(addr => (
                        <div
                            className={styles.talentInfoLocation}
                            key={`${addr.streetAddr1}${addr.zip}${addr.city}${addr.stateCode}`}
                        >
                            <IconSolid.LocationMarkerIcon className='icon-xxl' />
                            <span className='body-main'>
                                {`${addr.city}, ${addr.stateCode}`}
                            </span>
                        </div>
                    ))}
                </div>
                <MatchBar className={styles.matchBar} percent={props.match} />
                <div className={styles.skillsWrap}>
                    {visibleSkills.map(skill => (
                        <SkillPill
                            key={skill.skillId}
                            theme='dark'
                            skill={skill}
                            verified={props.isMatchingSkill(skill)}
                        />
                    ))}
                    {hiddenSkills > 0 && (
                        <SkillPill theme='etc' skill={{ name: `+${hiddenSkills}` }} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default TalentCard
