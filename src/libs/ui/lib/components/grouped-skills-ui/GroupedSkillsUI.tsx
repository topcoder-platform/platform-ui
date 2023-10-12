import { FC } from 'react'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'

import { UserEMSISkill } from '~/libs/core'
import { Skill, SkillPill } from '~/libs/shared'

import { CollapsibleSkillsList } from '../collapsible-skills-list'

import styles from './GroupedSkillsUI.module.scss'

interface GroupedSkillsUIProps {
    groupedSkillsByCategory: { [key: string]: UserEMSISkill[] }
    skillsCatsCollapsed: boolean
}
const GroupedSkillsUI: FC<GroupedSkillsUIProps> = (props: GroupedSkillsUIProps) => (
    <ResponsiveMasonry
        className={styles.skillsCategories}
        columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}
    >
        <Masonry>
            {
                Object.keys(props.groupedSkillsByCategory)
                    .map((categoryName: string) => (

                        <CollapsibleSkillsList
                            key={categoryName}
                            header={categoryName}
                            isCollapsed={props.skillsCatsCollapsed}
                        >
                            {
                                props.groupedSkillsByCategory[categoryName]
                                    .map((skill: UserEMSISkill) => (
                                        <SkillPill
                                            skill={skill as unknown as Skill}
                                            key={skill.id}
                                            theme='catList'
                                        />
                                    ))
                            }
                        </CollapsibleSkillsList>
                    ))
            }
        </Masonry>
    </ResponsiveMasonry>
)

export default GroupedSkillsUI
