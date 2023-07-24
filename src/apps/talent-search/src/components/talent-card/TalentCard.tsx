import { FC } from 'react'
import { orderBy } from 'lodash'
import { Link } from 'react-router-dom'
import codes from 'country-calling-code'

import { IconSolid } from '~/libs/ui'
import { EmsiSkill, isSkillVerified, ProfilePicture } from '~/libs/shared'

import { MatchBar } from '../match-bar'
import { SkillPill } from '../skill-pill'
import { Member } from '../../lib/models'
import { TALENT_SEARCH_PATHS } from '../../talent-search.routes'

import styles from './TalentCard.module.scss'

const getCountry = (countryCode: string): string => (
    codes.find(c => c.isoCode3 === countryCode || c.isoCode2 === countryCode)?.country ?? countryCode ?? ''
)

const getAddrString = (city: string, country: string): string => (
    [city, country].filter(Boolean)
        .join(', ')
)

interface TalentCardProps {
    isMatchingSkill: (skill: EmsiSkill) => boolean
    member: Member
    match?: number
}

const TalentCard: FC<TalentCardProps> = props => {
    const talentRoute = `${TALENT_SEARCH_PATHS.talent}/${props.member.handle}`

    const visibleSkills = orderBy(
        props.member.emsiSkills.filter(props.isMatchingSkill),
        [props.isMatchingSkill, isSkillVerified],
        ['desc', 'desc'],
    )
        .slice(0, 6) as EmsiSkill[]

    const hiddenSkills = props.member.emsiSkills.length - visibleSkills.length
    const unmatchedLabel = `+${hiddenSkills} more unmatched skill${hiddenSkills > 1 ? 's' : ''}`

    return (
        <Link to={talentRoute} className={styles.wrap}>
            <div className={styles.topWrap}>
                <ProfilePicture member={props.member} className={styles.profilePic} />
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
                                    {getAddrString(addr.city, getCountry(props.member.homeCountryCode))}
                                </span>
                            </div>
                        ))}
                    </div>
                    <MatchBar className={styles.matchBar} percent={props.match} />
                </div>
            </div>
            <div className={styles.skillsContainer}>
                <div className='overline'>Matched skills</div>
                <div className={styles.skillsWrap}>
                    {visibleSkills.map(skill => (
                        <SkillPill
                            key={skill.skillId}
                            theme='dark'
                            skill={skill}
                            verified={isSkillVerified(skill)}
                        />
                    ))}
                    {hiddenSkills > 0 && (
                        <div className={styles.unmatchedSkills}>
                            {unmatchedLabel}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}

export default TalentCard
