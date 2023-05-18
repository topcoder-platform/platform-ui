
import { Component } from 'react'
import Skill from '@talentSearch/lib/models/Skill'
import Member from '@talentSearch/lib/models/Member'
import { LoadingCircles, Table, TableColumn } from '~/libs/ui'
import MemberHandleRenderer from './renderers/MemberHandleRenderer'

import styles from './SkillSearchResults.module.scss'
import MemberSkillsRenderer from './renderers/MemberSkillsRenderer'

export const memberColumns: ReadonlyArray<TableColumn<Member>> = [
    {
        label: 'Handle',
        propertyName: 'handle',
        type: 'element',
        renderer: MemberHandleRenderer,
    },
    {
        label: 'Searched Skill Score',
        propertyName: 'searchedSkillScore',
        type: 'numberElement',
        renderer: MemberSkillsRenderer,
        defaultSortDirection: 'desc',
        isDefaultSort: true,
    },
    {
        label: 'Challenges Won',
        propertyName: 'numberOfChallengesWon',
        type: 'number',
    },
    {
        label: 'Challenges Placed',
        propertyName: 'numberOfChallengesPlaced',
        type: 'number',
    },
    {
        label: 'First Name',
        propertyName: 'firstName',
        type: 'text',
    },
    {
        label: 'Last Name',
        propertyName: 'lastName',
        type: 'text',
    },
    {
        label: 'Country',
        propertyName: 'country',
        type: 'text',
    },
    {
        label: 'Total Skill Score',
        propertyName: 'totalSkillScore',
        type: 'number',
        renderer: MemberSkillsRenderer,
    }
]

type SkillSearchResultsProps = {
    results:ReadonlyArray<Member>
    skillsFilter?:ReadonlyArray<Skill>
    isLoading?:boolean
}

export default class SkillSearchResult extends Component<SkillSearchResultsProps>{

    render() {
        //If we searched and have no results, show "No results found", otherwise hide the results table 
        //until a search has been made
        if(this.props.isLoading){
            return (<LoadingCircles />)
        }
        else if(this.props.skillsFilter && 
            this.props.skillsFilter.length>0 && 
            (!this.props.results || 
            this.props.results.length==0)){
            //TODO - fill this in with useful no results found
            return (<div>No results found</div>)
        }
        else if(!this.props.skillsFilter || 
                 this.props.skillsFilter.length==0){
            return (<div></div>)
        }

        return (
            <div>
                <Table
                    data={this.props.results}
                    columns={memberColumns}
                />
            </div>
        )
    }
}

