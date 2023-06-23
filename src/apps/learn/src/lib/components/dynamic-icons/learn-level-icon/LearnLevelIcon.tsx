import { FC } from 'react'
import classNames from 'classnames'

import { TCACertificationLearnLevel } from '../../../data-providers'

import { ReactComponent as Icon } from './icon-level-3.svg'
import styles from './LearnLevelIcon.module.scss'

interface LearnLevelIconProps {
    level: TCACertificationLearnLevel
}

const LearnLevelIcon: FC<LearnLevelIconProps> = (props: LearnLevelIconProps) => (
    <Icon className={classNames(styles.icon, (props.level ?? '').toLowerCase())} />
)

export default LearnLevelIcon
