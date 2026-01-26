import { FC } from 'react'

import { UserSkill, UserSkillWithActivity } from '~/libs/core'
import { SkillPill } from '~/libs/shared'

import { SkillsList } from '../skills-list'

import styles from './GroupedSkillsUI.module.scss'
import { SkillPillProps } from '../skill-pill/SkillPill'

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
