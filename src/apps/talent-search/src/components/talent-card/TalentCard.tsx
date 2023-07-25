import { FC } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'
import codes from 'country-calling-code'

import { IconSolid } from '~/libs/ui'
import { EmsiSkill, isSkillVerified, ProfilePicture } from '~/libs/shared'

import { MatchBar } from '../match-bar'
import { SkillPill } from '../skill-pill'
import { Member } from '../../lib/models'
import { TALENT_SEARCH_PATHS } from '../../talent-search.routes'

import styles from './TalentCard.module.scss'
import { orderBy } from 'lodash'

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

    const matchedSkills = orderBy(
        props.member.emsiSkills,
        isSkillVerified,
        'desc',
    )
        .filter(props.isMatchingSkill)

    const limitMatchedSkills = matchedSkills.slice(0, 10)

    const provenSkills = limitMatchedSkills.filter(isSkillVerified)
    const selfSkills = limitMatchedSkills.filter(s => !isSkillVerified(s))
    const restSkills = matchedSkills.length - limitMatchedSkills.length

    const restLabel = restSkills > 0 && (
        <div className={styles.unmatchedSkills}>
            {`+${restSkills} more skill${restSkills > 1 ? 's' : ''}`}
        </div>
    )

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
                <div className={classNames(styles.skillsContainerTitle, 'overline')}>Matched skills</div>
                {provenSkills.length > 0 && (
                    <>
                        <div className='overline'>Proven skills</div>
                        <div className={styles.skillsWrap}>
                            {provenSkills.map(skill => (
                                <SkillPill
                                    key={skill.skillId}
                                    theme='dark'
                                    skill={skill}
                                    verified={isSkillVerified(skill)}
                                />
                            ))}
                            {!selfSkills.length && restLabel}
                        </div>
                    </>
                )}
                {selfSkills.length > 0 && (
                    <>
                        <div className='overline'>Self-selected skills</div>
                        <div className={styles.skillsWrap}>
                            {selfSkills.map(skill => (
                                <SkillPill
                                    key={skill.skillId}
                                    theme='dark'
                                    skill={skill}
                                    verified={isSkillVerified(skill)}
                                />
                            ))}
                            {restLabel}
                        </div>
                    </>
                )}
            </div>
        </Link>
    )
}

export default TalentCard
