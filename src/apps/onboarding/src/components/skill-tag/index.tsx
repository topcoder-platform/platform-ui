/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
import React, { FC } from 'react'
import classNames from 'classnames'

import { Skill } from '~/apps/talent-search/src/lib/models'

import XIcon from '../../assets/images/x-icon.svg'

import styles from './styles.module.scss'

interface SkillTagProps {
    skill: Skill
    onDelete?: () => void
}

const SkillTag: FC<SkillTagProps> = (props: SkillTagProps) => (
    <div className={classNames('d-flex align-items-center', styles.container)}>
        {props.skill.name}
        <button type='button' className={styles.btnDelete} onClick={props.onDelete}>
            <img width={7} height={7} src={XIcon} alt='' />
        </button>
    </div>
)

export default SkillTag
