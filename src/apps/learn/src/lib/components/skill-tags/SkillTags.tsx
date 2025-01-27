import { FC } from 'react'
import classNames from 'classnames'

import { Tooltip } from '~/libs/ui'

import { SkillLabel } from '..'
import { TCASkillType } from '../../data-providers'

import styles from './SkillTags.module.scss'

interface SkillTagsProps {
    courseKey?: string
    expandCount?: number
    label?: string
    theme?: 'white' | 'gray' | undefined
    skills?: Array<TCASkillType> | null | undefined
}

const SkillTags: FC<SkillTagsProps> = (props: SkillTagsProps) => {
    const expandCount: number = props.expandCount || 3
    const theme: 'white' | 'gray' = props.theme || 'white'
    const label: string = props.label ?? 'skills taught'

    const skills: string[] | TCASkillType[] = props.skills || []

    return (
        <div className={styles.skills}>
            {label && (
                <span className={classNames('body-small', styles.infoText)}>{label}</span>
            )}
            {skills?.slice(0, expandCount)
                .map((skill: string | TCASkillType) => (
                    <SkillLabel
                        skill={skill}
                        theme={theme}
                        key={`${props.courseKey}:${typeof skill === 'string' ? skill : skill.name}`}
                    />
                ))}
            {Number(skills?.length) > expandCount && (
                <Tooltip
                    content={skills.slice(expandCount)
                        .map(skill => (typeof skill === 'string' ? skill : skill.name))
                        .join(', ')}
                >
                    <SkillLabel
                        skill={`+ ${skills?.slice(expandCount).length}`}
                        theme={theme}
                    />
                </Tooltip>
            )}
        </div>
    )
}

export default SkillTags
