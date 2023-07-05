import { FC, useMemo } from 'react'
import classNames from 'classnames'

import { isVerifiedSkill, UserEMSISkill, UserProfile } from '~/libs/core'
import { IconOutline, TCVerifiedSkillIcon } from '~/libs/ui'

import { TC_VERIFIED_SKILL_LABEL } from '../../config'

import styles from './MemberSkillsInfo.module.scss'

interface MemberSkillsInfoProps {
    profile: UserProfile
}

const MemberSkillsInfo: FC<MemberSkillsInfoProps> = (props: MemberSkillsInfoProps) => {

    const memberEMSISkills: UserEMSISkill[] = useMemo(
        () => (props.profile.emsiSkills || [])
            .sort((a, b) => (isVerifiedSkill(a.skillSources) ? -1 : (isVerifiedSkill(b.skillSources) ? 1 : 0))),
        [props.profile.emsiSkills],
    )

    return memberEMSISkills ? (
        <div className={styles.container}>
            <div className={styles.titleWrap}>
                <h3>My Skills</h3>
                <div className={styles.legendWrap}>
                    <TCVerifiedSkillIcon />
                    {' = '}
                    {TC_VERIFIED_SKILL_LABEL}
                </div>
            </div>

            <div className={styles.skillsWrap}>
                {
                    memberEMSISkills.map((memberEMSISkill: UserEMSISkill) => (
                        <div
                            className={classNames(
                                styles.skillItem,
                                isVerifiedSkill(memberEMSISkill.skillSources) ? styles.verifiedSkillItem : '',
                            )}
                            key={memberEMSISkill.id}
                        >
                            {memberEMSISkill.name}
                            {isVerifiedSkill(memberEMSISkill.skillSources) && <IconOutline.CheckCircleIcon />}
                        </div>
                    ))
                }
            </div>
        </div>
    ) : <></>
}

export default MemberSkillsInfo
