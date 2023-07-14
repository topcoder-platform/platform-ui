/* eslint-disable react/prefer-stateless-function */
/* eslint-disable ordered-imports/ordered-imports */
import { Component } from 'react'
import { ReactComponent as IconCheck } from '@talentSearch/assets/verified-icon-white.svg'
import MemberEmsiSkill from '@talentSearch/lib/models/MemberEmsiSkill'
import styles from './SkillTag.module.scss'

type SkillTagProps = {
    skill: MemberEmsiSkill
}

export default class SkillTag extends Component<SkillTagProps> {

    render(): JSX.Element {
        let style:string = styles.skill

        if (this.props.skill.isSearched) {
            style = `${style} ${styles.isSearched}`
        }

        if (this.props.skill.skillSources.includes('ChallengeWin')) {
            style = `${style} ${styles.challengeWin}`
        }

        return (
            <div
                key={this.props.skill.skillId}
                data-id={this.props.skill.skillId}
                className={style}
            >
                {this.props.skill.skillSources.includes('ChallengeWin')
                    ? <IconCheck className={styles.before} /> : ''}
                {this.props.skill.name}
            </div>
        )
    }
}
