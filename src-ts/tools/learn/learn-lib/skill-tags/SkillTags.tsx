import { FC } from 'react'
import classNames from 'classnames'

import { Tooltip } from '../../../../lib'
import { SkillLabel } from '..'

import styles from './SkillTags.module.scss'

interface SkillTagsProps {
    courseKey: string
    expandCount?: number
    skills: Array<string> | null | undefined
}

const SkillTags: FC<SkillTagsProps> = (props: SkillTagsProps) => {
    const expandCount: number = props.expandCount || 3
    return (
        <div className={styles.skills}>
            <span className={classNames('body-small', styles.infoText)}>skills taught</span>
            {props.skills?.slice(0, expandCount)
                .map((skill: string) => <SkillLabel skill={skill} key={`${props.courseKey}:${skill}`} />)}
            {props.skills?.length > expandCount && (
                <Tooltip
                    content={props.skills?.slice(expandCount)
                        .join(', ')}
                    trigger={<SkillLabel skill={`+ ${props.skills?.slice(expandCount).length}`} />}
                />
            )}
        </div>
    )
}

export default SkillTags
