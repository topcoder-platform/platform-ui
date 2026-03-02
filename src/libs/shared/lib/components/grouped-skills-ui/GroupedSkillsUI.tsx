import { FC } from 'react'

import type { UserSkill } from '~/libs/core/lib/profile/user-skill.model'

import { SkillsList } from '../skills-list'
import { SkillPill } from '../skill-pill'
import { SkillPillProps } from '../skill-pill/SkillPill'

import styles from './GroupedSkillsUI.module.scss'

interface GroupedSkillsUIProps {
    groupedSkillsByCategory: { [key: string]: UserSkill[] }
    fetchSkillDetails: SkillPillProps['fetchSkillDetails']
}
const GroupedSkillsUI: FC<GroupedSkillsUIProps> = (props: GroupedSkillsUIProps) => (
    <div
        className={styles.skillsCategories}
    >
        {
            Object.keys(props.groupedSkillsByCategory)
                .map((categoryName: string) => (

                    <SkillsList
                        key={categoryName}
                        header={categoryName}
                    >
                        {
                            props.groupedSkillsByCategory[categoryName]
                                .map((skill: UserSkill) => (
                                    <SkillPill
                                        skill={skill}
                                        key={skill.id}
                                        theme='catList'
                                        fetchSkillDetails={props.fetchSkillDetails}
                                    />
                                ))
                        }
                    </SkillsList>
                ))
        }
    </div>
)

export default GroupedSkillsUI
