import { FC } from "react"
import { UserProfile, UserSkills, useMemberSkills } from "~/libs/core"
import { TCVerifiedSkillIcon, TCVerifiedSkillWhiteIcon } from "~/libs/ui"
import { keys } from "lodash"

import styles from './MemberSkillsInfo.module.scss'

interface MemberSkillsInfoProps {
    profile: UserProfile | undefined
}
const MemberSkillsInfo: FC<MemberSkillsInfoProps> = (props: MemberSkillsInfoProps) => {
    const { profile } = props

    const memberSkills: UserSkills | undefined = useMemberSkills(profile?.handle)

    return memberSkills ? (
        <div className={styles.container}>
            <h3>Skills</h3>

            <div className={styles.skillsWrap}>
                {
                    keys(memberSkills).map((skillKey: string) => (
                        <div className={styles.skillItem} key={skillKey}>
                            {memberSkills[skillKey].sources?.includes('CHALLENGE') && <TCVerifiedSkillWhiteIcon />}
                            {memberSkills[skillKey].tagName}
                        </div>
                    ))
                }
            </div>

            <div className={styles.legendWrap}>
                <TCVerifiedSkillIcon />&nbsp;= Topcoder Verified
            </div>
        </div>
    ) : <></>
}

export default MemberSkillsInfo
