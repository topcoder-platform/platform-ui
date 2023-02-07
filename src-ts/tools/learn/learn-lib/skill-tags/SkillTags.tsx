import { FC } from 'react'
import classNames from 'classnames'

import { Tooltip } from '../../../../lib'
import { SkillLabel } from '..'

import styles from './SkillTags.module.scss'

interface SkillTagsProps {
    courseKey: string
    skills: Array<string> | null | undefined
}

const SkillTags: FC<SkillTagsProps> = (props: SkillTagsProps) => (
    <div className={styles.skills}>
        <span className={classNames('body-small', styles.infoText)}>skills taught</span>
        {props.skills?.slice(0, 3)
            .map((skill: string) => <SkillLabel skill={skill} key={`${props.courseKey}:${skill}`} />)}
        {props.skills?.length > 3 && (
            <Tooltip
                content={props.skills?.slice(0, 3)
                    .join(', ')}
                trigger={<SkillLabel skill={`+ ${props.skills?.slice(0, 3).length}`} />}
            />
        )}
    </div>
)

export default SkillTags
