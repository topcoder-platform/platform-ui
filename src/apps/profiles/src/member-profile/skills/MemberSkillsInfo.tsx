import { FC } from 'react'
import classNames from 'classnames'

import { isVerifiedSkill, useMemberSkills, UserProfile, UserSkill } from '~/libs/core'
import { IconOutline, TCVerifiedSkillIcon } from '~/libs/ui'

import { TC_VERIFIED_SKILL_LABEL } from '../../config'

import styles from './MemberSkillsInfo.module.scss'

interface MemberSkillsInfoProps {
    profile: UserProfile | undefined
}

const MemberSkillsInfo: FC<MemberSkillsInfoProps> = (props: MemberSkillsInfoProps) => {

    const memberSkills: UserSkill[] | undefined = useMemberSkills(props.profile?.handle)

    return memberSkills ? (
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
                    memberSkills.map((memberSkill: UserSkill) => (
                        <div
                            className={classNames(
                                styles.skillItem,
                                isVerifiedSkill(memberSkill.sources) ? styles.verifiedSkillItem : '',
                            )}
                            key={memberSkill.id}
                        >
                            {memberSkill.tagName}
                            {isVerifiedSkill(memberSkill.sources) && <IconOutline.CheckCircleIcon />}
                        </div>
                    ))
                }
            </div>
        </div>
    ) : <></>
}

export default MemberSkillsInfo
