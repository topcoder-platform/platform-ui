import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'

import { UserSkill } from '~/libs/core'
import { SkillPill } from '~/libs/shared'

import { CollapsibleSkillsList } from '../collapsible-skills-list'

import styles from './GroupedSkillsUI.module.scss'

interface GroupedSkillsUIProps {
    groupedSkillsByCategory: { [key: string]: UserSkill[] }
    skillsCatsCollapsed: boolean
    onAllSkillsSameDisplayState: (collapsed: boolean) => void
}
const GroupedSkillsUI: FC<GroupedSkillsUIProps> = (props: GroupedSkillsUIProps) => {
    const [collapsedMap, setCollapsedMap]:
        [{ [key: string]: boolean }, Dispatch<SetStateAction<{ [key: string]: boolean }>>]
        = useState<{ [key: string]: boolean }>({})

    useEffect(() => {
        const newCollapsedMap: { [key: string]: boolean } = {}

        Object.keys(props.groupedSkillsByCategory)
            .forEach((categoryName: string) => {
                newCollapsedMap[categoryName] = props.skillsCatsCollapsed
            })

        setCollapsedMap(newCollapsedMap)
    }, [props.groupedSkillsByCategory, props.skillsCatsCollapsed])

    useEffect(() => {
        const arr: boolean[] = Object.values(collapsedMap)

        if (arr.every(val => val === arr[0])) {
            props.onAllSkillsSameDisplayState(arr[0])
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collapsedMap])

    function handleCollapseChange(categoryName: string, isCollapsed: boolean): void {
        setCollapsedMap({
            ...collapsedMap,
            [categoryName]: isCollapsed,
        })
    }

    return (
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
                                isCollapsed={collapsedMap[categoryName]}
                                // eslint-disable-next-line react/jsx-no-bind
                                onDisplayChnage={handleCollapseChange.bind(this, categoryName)}
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
}

export default GroupedSkillsUI
