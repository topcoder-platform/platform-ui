/* eslint-disable complexity */
import { FC, ReactElement, useMemo } from 'react'
import classNames from 'classnames'

import { EnvironmentConfig } from '~/config'
import { ProfilePicture } from '~/libs/shared'
import { IconOutline, IconSolid, Tooltip } from '~/libs/ui'

import styles from './TalentResultCard.module.scss'

interface MatchedSkill {
    id: string
    name: string
    wins: number
    submitted: number
}

interface TalentResultCardTalent {
    id: string
    handle: string
    isVerified: boolean
    isRecentlyActive: boolean
    location: string
    matchIndex: number
    matchedSkills: MatchedSkill[]
    name: string
    openToWork?: boolean
    photoUrl?: string
}

interface TalentResultCardProps {
    talent: TalentResultCardTalent
}

function getUniqueMatchedSkills(talent: TalentResultCardTalent): TalentResultCardTalent['matchedSkills'] {
    const seen = new Set<string>()
    return talent.matchedSkills.filter((skill: MatchedSkill) => {
        const key = `${skill.id}-${skill.name}`
        if (seen.has(key)) {
            return false
        }

        seen.add(key)
        return true
    })
}

function buildMatchedSkillsTooltipContent(
    count: number,
    skills: MatchedSkill[],
): ReactElement {
    return (
        <div className={styles.tooltipBody}>
            <p className={styles.tooltipTitle}>
                {`${count} Matched Skills:`}
            </p>
            <p className={styles.tooltipLines}>
                {skills.map((skill: MatchedSkill) => (
                    <span key={`${skill.id}-${skill.name}`} className={styles.tooltipSkillLine}>
                        <span className={styles.tooltipSkillName}>{skill.name}</span>
                        {`: ${skill.wins} wins, ${skill.submitted} submissions`}
                    </span>
                ))}
            </p>
        </div>
    )
}

export const TalentResultCard: FC<TalentResultCardProps> = (props: TalentResultCardProps) => {
    const talent: TalentResultCardTalent = props.talent
    const uniqueSkills = useMemo(() => getUniqueMatchedSkills(talent), [talent])
    const isVerifiedProfile = talent.isVerified === true
    const displayName = String(talent.name || '')
        .trim()
    const [firstName, ...lastNameParts] = displayName.split(/\s+/)
    const lastName = lastNameParts.join(' ')
        .trim()

    const isActive = talent.isRecentlyActive === true
    const openToWork = talent.openToWork
    const profileUrl = `${EnvironmentConfig.USER_PROFILE_URL}/${encodeURIComponent(talent.handle)}`
    const matchedSkillLabel = uniqueSkills.length === 1 ? 'matched skill' : 'matched skills'

    return (
        <article className={styles.talentCard}>
            <div className={styles.cardMain}>
                <div className={styles.topRow}>
                    <div className={styles.avatarWrap}>
                        <ProfilePicture
                            className={styles.profilePic}
                            member={{
                                firstName: firstName || talent.handle,
                                lastName: lastName || '',
                                photoURL: talent.photoUrl || '',
                            }}
                        />
                        {isVerifiedProfile && (
                            <span className={styles.verifiedBadge}>
                                <IconSolid.CheckCircleIcon />
                            </span>
                        )}
                    </div>
                    <div className={styles.headContent}>
                        <div className={styles.cardHeader}>
                            <h4>{talent.handle}</h4>
                            <span className={styles.matchPill}>
                                {`${talent.matchIndex}% Match`}
                            </span>
                        </div>
                        <p className={styles.nameText}>{talent.name}</p>
                        <div className={styles.locationRow}>
                            <IconOutline.LocationMarkerIcon className={styles.locationIcon} aria-hidden />
                            <span className={styles.locationText}>{talent.location}</span>
                        </div>
                        <div className={styles.statusRow}>
                            <span
                                className={classNames(
                                    styles.statusPill,
                                    isActive ? styles.statusPillActive : styles.statusPillInactive,
                                )}
                            >
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                            {openToWork !== undefined && (
                                <span
                                    className={classNames(
                                        styles.availability,
                                        openToWork ? styles.availabilityYes : styles.availabilityNo,
                                    )}
                                >
                                    {openToWork ? (
                                        <IconOutline.CheckIcon
                                            aria-hidden
                                            className={styles.availabilityIcon}
                                        />
                                    ) : (
                                        <IconOutline.XIcon
                                            aria-hidden
                                            className={styles.availabilityIcon}
                                        />
                                    )}
                                    <span>{openToWork ? 'Available' : 'Unavailable'}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.cardFooter}>
                <div className={styles.footerMatched}>
                    <span className={styles.matchedSkillsText}>
                        {`${uniqueSkills.length} ${matchedSkillLabel}`}
                    </span>
                    {uniqueSkills.length > 0 && (
                        <Tooltip
                            className={styles.matchedSkillsTooltip}
                            content={buildMatchedSkillsTooltipContent(uniqueSkills.length, uniqueSkills)}
                            place='top'
                        >
                            <button
                                type='button'
                                className={styles.infoButton}
                                aria-label='Matched skills details'
                            >
                                <IconOutline.InformationCircleIcon className={styles.infoIcon} />
                            </button>
                        </Tooltip>
                    )}
                </div>
                <a
                    className={styles.experienceLink}
                    href={profileUrl}
                    rel='noopener noreferrer'
                    target='_blank'
                >
                    Experience Match
                    <IconOutline.ArrowRightIcon aria-hidden className={styles.experienceLinkIcon} />
                </a>
            </div>
        </article>
    )
}

export default TalentResultCard
