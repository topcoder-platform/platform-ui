import { FC } from 'react'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'

import { UserSkill } from '~/libs/core'
import { SkillPill } from '~/libs/shared'

import { CollapsibleSkillsList } from '../collapsible-skills-list'

import styles from './GroupedSkillsUI.module.scss'

interface GroupedSkillsUIProps {
    groupedSkillsByCategory: { [key: string]: UserSkill[] }
}
const GroupedSkillsUI: FC<GroupedSkillsUIProps> = (props: GroupedSkillsUIProps) => (
    <ResponsiveMasonry
        className={styles.skillsCategories}
        columnsCountBreakPoints={{ 350: 1, 750: 2, 1368: 3 }}
    >
        <Masonry>
            {
                Object.keys(props.groupedSkillsByCategory)
                    .map((categoryName: string) => (

                        <CollapsibleSkillsList
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
