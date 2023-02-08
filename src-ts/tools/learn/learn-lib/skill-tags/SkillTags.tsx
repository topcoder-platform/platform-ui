import { FC } from 'react'
import classNames from 'classnames'

import { Tooltip } from '../../../../lib'
import { SkillLabel } from '..'

import styles from './SkillTags.module.scss'

interface SkillTagsProps {
    courseKey: string
    expandCount?: number
    theme?: 'white' | 'gray' | undefined
    skills: Array<string> | null | undefined
}

const SkillTags: FC<SkillTagsProps> = (props: SkillTagsProps) => {
    const expandCount: number = props.expandCount || 3
    const theme: 'white' | 'gray' = props.theme || 'white'

    return (
        <div className={styles.skills}>
            <span className={classNames('body-small', styles.infoText)}>skills taught</span>
            {props.skills?.slice(0, expandCount)
                .map((skill: string) => <SkillLabel skill={skill} theme={theme} key={`${props.courseKey}:${skill}`} />)}
            {props.skills?.length > expandCount && (
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
