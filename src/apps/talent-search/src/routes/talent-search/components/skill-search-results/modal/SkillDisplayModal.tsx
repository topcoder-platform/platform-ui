import { Component, EventHandler, MouseEvent } from 'react'

import { BaseModal, Button } from '~/libs/ui'
import { EnvironmentConfig } from '~/config'

import Member from '@talentSearch/lib/models/Member'
import SkillScore from '@talentSearch/lib/models/SkillScore'
import SkillRenderer from './renderers/SkillRenderer'
import styles from './SkillDisplayModal.module.scss'
import { Table, TableColumn } from '~/libs/ui'

type SkillDisplayModalModalProps = {
    isOpen: boolean
    onClose: () => void
    member: Member
}
export const skillColumns: Array<TableColumn<SkillScore>> = [
    {
        label: 'Skill',
        propertyName: 'skill',
        type: 'element',
        renderer: SkillRenderer,
    },
    {
        label: 'Score',
        propertyName: 'score',
        type: 'number',
        defaultSortDirection: 'desc',
        isDefaultSort: true,
    }
]
export default class SkillDisplayModal extends Component<SkillDisplayModalModalProps>{

    handleOpenLink(){
        window.open(`${EnvironmentConfig.URLS.USER_PROFILE}/${this.props.member.handle}`, '_blank')
    }
    
    render(){
        let style="score-low"
        if(this.props.member.searchedSkillScore>50){
            style = "score-high"
        }
        else if(this.props.member.searchedSkillScore>20){
            style = "score-medium"
        }
        else{
            style = "score-low"
        }
        
        return(
            <BaseModal
                onClose={this.props.onClose}
                open={this.props.isOpen}
                size='lg'
                title={`Skills Summary for ${this.props.member.handle} `}
                contentClassName={styles.container}
            >
                <div className={styles.profileButton}>
                    <Button
                        primary
                        size='md'
                        onClick={this.handleOpenLink.bind(this)}
                    >
                        View Profile 
                    </Button>
                </div>
                <div className={styles.topTable}>
                    <h4>Searched for skills score: <span className={styles[style]}>{this.props.member.searchedSkillScore}</span></h4>
                    <Table
                        data={this.props.member.searchedSkills}
                        columns={skillColumns}
                    />
                </div>
                <div>
                    <h4>All skills score: {this.props.member.totalSkillScore}</h4>
                    <Table
                        data={this.props.member.skills}
                        columns={skillColumns}
                    />
                </div>
            </BaseModal>
        )
    }
}

