import { FC, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { orderBy } from 'lodash'
import classNames from 'classnames'
import codes from 'country-calling-code'

import { IconSolid } from '~/libs/ui'
import { isSkillVerified, ProfilePicture, Skill, SkillPill } from '~/libs/shared'

import { ProfileMatch } from '../profile-match'
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

function isOverflow(el: HTMLElement): boolean {
    const parentHeight = el.parentElement?.offsetHeight ?? 0
    const bottom = el.offsetTop + el.offsetHeight
    return bottom > parentHeight
}

interface TalentCardProps {
    queriedSkills: Skill[]
    member: Member
    match?: number
}

const TalentCard: FC<TalentCardProps> = props => {
    const skillsWrapRef = useRef<HTMLDivElement|null>(null)
    const talentRoute = `${TALENT_SEARCH_PATHS.talent}/${props.member.handle}`
    const isMatchingSkill = useIsMatchingSkill(props.queriedSkills)

    const matchedSkills = orderBy(
        props.member.emsiSkills,
        [isSkillVerified, a => a.name],
        ['desc', 'asc'],
    )
        .filter(isMatchingSkill)

    const limitMatchedSkills = matchedSkills

    const provenSkills = matchedSkills.filter(isSkillVerified)
    const selfSkills = matchedSkills.filter(s => !isSkillVerified(s))

    const matchState = useMemo(() => ({
        matchValue: props.match,
        queriedSkills: props.queriedSkills,
    }), [props.match, props.queriedSkills])

    // after initial render, check and limit to 3 rows of skills
    useEffect(() => {
        if (!skillsWrapRef.current) {
            return
        }

        // check if there are more than 3 rows of skills displayed initially, and hide them
        const isHidden: HTMLElement[] = [].filter.call(skillsWrapRef.current.childNodes, isOverflow)
        isHidden.forEach(c => { c.style.display = 'none' })

        // remove css height limit from the skillsWrap el
        skillsWrapRef.current.classList.toggle('init', false)

        // if there are hidden skill pills, show the "+N more matched skills" pill
        if (isHidden.length) {
            const restLabel = document.createElement('div')
            restLabel.classList.add(styles.unmatchedSkills)
            restLabel.innerText = `+${isHidden.length} more matched skill${isHidden.length > 1 ? 's' : ''}`
            skillsWrapRef.current.appendChild(restLabel)
        }
    }, [limitMatchedSkills])

    return (
        <Link to={talentRoute} className={styles.wrap} state={matchState}>
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
                    <div className={styles.profileMatch}>
                        <ProfileMatch percent={props.match} />
                    </div>
                </div>
            </div>
            <div className={styles.skillsContainer}>
                <div className={classNames(styles.skillsContainerTitle, 'overline')}>
                    {`${matchedSkills.length} Matched skills`}
                </div>
                <div className={classNames(styles.skillsWrap, 'init')} ref={skillsWrapRef}>
                    {provenSkills.length > 0 && provenSkills.map(skill => (
                        <SkillPill
                            key={skill.skillId}
                            theme='dark'
                            skill={skill}
                        />
                    ))}
                    {selfSkills.length > 0 && selfSkills.map(skill => (
                        <SkillPill
                            key={skill.skillId}
                            theme='dark'
                            skill={skill}
                        />
                    ))}
                </div>
            </div>
        </Link>
    )
}

export default TalentCard
