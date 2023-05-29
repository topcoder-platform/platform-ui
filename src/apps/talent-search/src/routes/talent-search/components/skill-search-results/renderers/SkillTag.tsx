
import { Component } from 'react'
import MemberEmsiSkill from '@talentSearch/lib/models/MemberEmsiSkill'
import styles from './SkillTag.module.scss'
import { ReactComponent as IconCheck } from '@talentSearch/assets/check-mark.svg';

type SkillTagProps = {
    skill:MemberEmsiSkill
}

export default class SkillTag extends Component<SkillTagProps>{

    render() {
        let style = "self-reported"
        if(this.props.skill.skillSources.includes("ChallengeWin")){
            style = "challenge-win"
        }
        return(
            <div
                key={this.props.skill.emsiId}
                data-id={this.props.skill.emsiId}
                tabIndex={0}
                className={styles[style]}
            >
                {this.props.skill.skillSources.includes("ChallengeWin") ?
                    <i><IconCheck className={styles["before"]}/></i> : ''}
                {this.props.skill.name}
            </div>
        )
    }
}

