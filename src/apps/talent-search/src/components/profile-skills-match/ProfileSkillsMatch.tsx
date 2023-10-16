import { FC } from 'react'
import classNames from 'classnames'

import { UserSkill } from '~/libs/core'
import { EmsiSkill, isSkillVerified, Skill, SkillPill } from '~/libs/shared'

import { useIsMatchingSkill } from '../../lib/utils'

import styles from './ProfileSkillsMatch.module.scss'

interface ProfileSkillsMatchProps {
    matchValue: number
    profileSkills: Pick<UserSkill, 'name'|'id'|'levels'>[]
    queriedSkills: Skill[]
}

const ProfileSkillsMatch: FC<ProfileSkillsMatchProps> = props => {
    const isMatchingSkill = useIsMatchingSkill(props.queriedSkills)
    const matchedSkills = (props.profileSkills as unknown as EmsiSkill[]).filter(isMatchingSkill)
    const provenMatched = matchedSkills.filter(isSkillVerified)
    const selfSkillmatched = matchedSkills.filter(s => !isSkillVerified(s))
    const missingSkills = props.queriedSkills.filter(qs => !matchedSkills.find(ms => ms.skillId === qs.emsiId))

    return (
        <div className={styles.wrap}>
            <div className={styles.highlightWrap}>
                <div className={styles.matchPerc}>
                    <strong>
                        {Math.round(props.matchValue * 100)}
                        %
                    </strong>
                    <span>Match</span>
                </div>
                <div className={styles.infoWrap}>
                    {provenMatched.length > 0 && (
                        <>
                            <div className='body-main-bold'>
                                {provenMatched.length}
                                {` matched proven skill${provenMatched.length > 1 ? 's' : ''}`}
                            </div>
                            <div className={styles.skillsList}>
                                {provenMatched.map(skill => (
                                    <SkillPill skill={skill} theme='verified' key={skill.skillId} />
                                ))}
                            </div>
                        </>
                    )}
                    {selfSkillmatched.length > 0 && (
                        <>
                            <div className='body-main'>
                                {selfSkillmatched.length}
                                {` matched self proclaimed skill${selfSkillmatched.length > 1 ? 's' : ''}`}
                            </div>
                            <div className={styles.skillsList}>
                                {selfSkillmatched.map(skill => (
                                    <SkillPill skill={skill} theme='dark' key={skill.skillId} />
                                ))}
                            </div>
                        </>
                    )}
                    {missingSkills.length > 0 && (
                        <div className={classNames('body-small', styles.missingSkills)}>
                            <span>Missing skills:</span>
                            <span className='body-small-medium'>
                                {
                                    missingSkills
                                        .map(s => s.name)
                                        .join(', ')
                                }
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProfileSkillsMatch
