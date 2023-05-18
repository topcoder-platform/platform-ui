import { FC } from 'react'

import { useMemberSkills, UserProfile, UserSkill } from '~/libs/core'
import { TCVerifiedSkillIcon, TCVerifiedSkillWhiteIcon } from '~/libs/ui'

import styles from './MemberSkillsInfo.module.scss'

interface MemberSkillsInfoProps {
    profile: UserProfile | undefined
}
const MemberSkillsInfo: FC<MemberSkillsInfoProps> = (props: MemberSkillsInfoProps) => {

    const memberSkills: UserSkill[] | undefined = useMemberSkills(props.profile?.handle)

    return memberSkills ? (
        <div className={styles.container}>
            <h3>Skills</h3>

            <div className={styles.skillsWrap}>
                {
                    memberSkills.map((memberSkill: UserSkill) => (
                        <div className={styles.skillItem} key={memberSkill.id}>
                            {memberSkill.sources?.includes('CHALLENGE') && <TCVerifiedSkillWhiteIcon />}
                            {memberSkill.tagName}
                        </div>
                    ))
                }
            </div>

            <div className={styles.legendWrap}>
                <TCVerifiedSkillIcon />
&nbsp;= Topcoder Verified
            </div>
        </div>
    ) : <></>
}

export default MemberSkillsInfo
