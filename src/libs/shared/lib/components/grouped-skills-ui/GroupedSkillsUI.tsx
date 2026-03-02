import { FC, useCallback, useState } from 'react'

import { UserSkill } from '~/libs/core'
import { SkillPill } from '~/libs/shared'

import { SkillsList } from '../skills-list'
import { SkillPillProps } from '../skill-pill/SkillPill'

import styles from './GroupedSkillsUI.module.scss'

interface GroupedSkillsUIProps {
  groupedSkillsByCategory: { [key: string]: UserSkill[] }
  fetchSkillDetails: SkillPillProps['fetchSkillDetails']
}

const DEFAULT_VISIBLE = 3

const GroupedSkillsUI: FC<GroupedSkillsUIProps> = (props: GroupedSkillsUIProps) => {
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

    const toggleCategory = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        const categoryName = event.currentTarget.dataset.category
        if (!categoryName) return

        setExpandedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName],
        }))
    }, [])

    const categories = Object.keys(props.groupedSkillsByCategory)

    return (
        <div className={styles.skillsCategories}>
            {categories.map((categoryName: string) => {
                const skills = props.groupedSkillsByCategory[categoryName] ?? []

                const sortedSkills = [...skills].sort(
                    (a, b) => (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' }),
                )

                const isExpanded = !!expandedCategories[categoryName]
                const total = sortedSkills.length
                const extraCount = Math.max(0, total - DEFAULT_VISIBLE)

                const visibleSkills = isExpanded ? sortedSkills : sortedSkills.slice(0, DEFAULT_VISIBLE)

                return (
                    <SkillsList key={categoryName} header={categoryName} count={sortedSkills.length}>
                        {visibleSkills.map((skill: UserSkill) => (
                            <SkillPill
                                skill={skill}
                                key={skill.id}
                                theme='catList'
                                fetchSkillDetails={props.fetchSkillDetails}
                            />
                        ))}

                        {extraCount > 0 && (
                            <button
                                type='button'
                                className={styles.moreLessButton}
                                data-category={categoryName}
                                onClick={toggleCategory}
                            >
                                {isExpanded ? `- Hide ${extraCount} skills` : `+ ${extraCount} more skills`}
                            </button>
                        )}
                    </SkillsList>
                )
            })}
        </div>
    )
}

export default GroupedSkillsUI
