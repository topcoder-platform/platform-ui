import { CSSProperties, FC, useMemo } from 'react'
import { orderBy } from 'lodash'
import { Link } from 'react-router-dom'
import codes from 'country-calling-code'

import { IconSolid } from '~/libs/ui'
import { EmsiSkill, isSkillVerified, Skill, SkillPill } from '~/libs/shared'

import { MatchBar } from '../match-bar'
import { Member } from '../../lib/models'
import { TALENT_SEARCH_PATHS } from '../../talent-search.routes'
import { useIsMatchingSkill } from '../../lib/utils'

import styles from './TalentCard.module.scss'

const getCountry = (countryCode: string): string => (
    codes.find(c => c.isoCode3 === countryCode || c.isoCode2 === countryCode)?.country ?? countryCode ?? ''
)

const getAddrString = (city: string, country: string): string => (
    [city, country].filter(Boolean)
        .join(', ')
)

interface TalentCardProps {
    queriedSkills: Skill[]
    member: Member
    match?: number
}

const TalentCard: FC<TalentCardProps> = props => {
    const talentRoute = `${TALENT_SEARCH_PATHS.talent}/${props.member.handle}`

    const isMatchingSkill = useIsMatchingSkill(props.queriedSkills)

    const visibleSkills = orderBy(
        props.member.emsiSkills,
        [isMatchingSkill, isSkillVerified],
        ['desc', 'desc'],
    )
        .slice(0, 6) as EmsiSkill[]

    const hiddenSkills = props.member.emsiSkills.length - visibleSkills.length

    const matchState = useMemo(() => ({
        matchValue: props.match,
        queriedSkills: props.queriedSkills,
    }), [props.match, props.queriedSkills])

    return (
        <Link to={talentRoute} className={styles.wrap} state={matchState}>
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
                                {getAddrString(addr.city, getCountry(props.member.homeCountryCode))}
                            </span>
                        </div>
                    ))}
                </div>
                <MatchBar className={styles.matchBar} percent={props.match} />
                <div className={styles.skillsWrap}>
                    {visibleSkills.map(skill => (
                        <SkillPill
                            key={skill.skillId}
                            theme={isMatchingSkill(skill) ? 'verified' : 'dark'}
                            skill={skill}
                        />
                    ))}
                    {hiddenSkills > 0 && (
                        <SkillPill theme='etc' skill={{ name: `+${hiddenSkills}` }} />
                    )}
                </div>
            </div>
        </Link>
    )
}

export default TalentCard
