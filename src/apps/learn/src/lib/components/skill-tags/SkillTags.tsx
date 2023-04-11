import { FC } from 'react'
import classNames from 'classnames'

import { Tooltip } from '~/libs/ui'

import { SkillLabel } from '../skill'

import styles from './SkillTags.module.scss'

interface SkillTagsProps {
    courseKey?: string
    expandCount?: number
    label?: string
    theme?: 'white' | 'gray' | undefined
    skills: Array<string> | null | undefined
}

const SkillTags: FC<SkillTagsProps> = (props: SkillTagsProps) => {
    const expandCount: number = props.expandCount || 3
    const theme: 'white' | 'gray' = props.theme || 'white'
    const label: string = props.label ?? 'skills taught'

    return (
        <div className={styles.skills}>
            {label && (
                <span className={classNames('body-small', styles.infoText)}>{label}</span>
            )}
            {props.skills?.slice(0, expandCount)
                .map((skill: string) => <SkillLabel skill={skill} theme={theme} key={`${props.courseKey}:${skill}`} />)}
            {Number(props.skills?.length) > expandCount && (
                <Tooltip
                    content={props.skills?.slice(expandCount)
                        .join(', ')}
                    trigger={<SkillLabel skill={`+ ${props.skills?.slice(expandCount).length}`} theme={theme} />}
                />
            )}
        </div>
    )
}

export default SkillTags
