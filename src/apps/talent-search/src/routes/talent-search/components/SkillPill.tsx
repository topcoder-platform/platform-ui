/* eslint-disable react/prefer-stateless-function */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-access-state-in-setstate */
/* eslint-disable react/state-in-constructor */
/* eslint-disable ordered-imports/ordered-imports */

import { Component } from 'react'
import { Skill } from '@talentSearch/lib/models'
import styles from './SkillPill.module.scss'

type SkillPillProps = {
    skill: Skill,
    selected: boolean
    onClick: (skill:Skill) => void,
}

export default class SkillPill extends Component<SkillPillProps> {
    render(): JSX.Element | null {
        return (
            <span
                className={this.props.selected ? styles.selected : styles.unSelected}
                onClick={() => this.props.onClick(this.props.skill)}
            >
                <span className={styles.pillText}>
                    {this.props.skill.name}
                </span>
            </span>
        )
    }
}
