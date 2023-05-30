
import { Component } from 'react'
import MemberEmsiSkill from '@talentSearch/lib/models/MemberEmsiSkill'
import styles from './SkillTag.module.scss'
import { ReactComponent as IconCheck } from '@talentSearch/assets/verified-icon-white.svg';

type SkillTagProps = {
    skill: MemberEmsiSkill
}

export default class SkillTag extends Component<SkillTagProps>{

    render() {
        let style = styles["skill"]

        if(this.props.skill.isSearched){
            style = style + " " + styles["isSearched"]
        }
        if(this.props.skill.skillSources.includes("ChallengeWin")){
            style = style + " " + styles["challengeWin"]
        }
        return(
            <div
                key={this.props.skill.emsiId}
                data-id={this.props.skill.emsiId}
                tabIndex={0}
                className={style}
            >
                {this.props.skill.skillSources.includes("ChallengeWin") ?
                    <IconCheck className={styles["before"]}/>: ''}
                {this.props.skill.name}
            </div>
        )
    }
}

