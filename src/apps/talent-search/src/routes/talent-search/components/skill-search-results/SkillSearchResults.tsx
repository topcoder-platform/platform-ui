
import { Component, useEffect } from 'react'
import Skill from '@talentSearch/lib/models/Skill'
import Member from '@talentSearch/lib/models/Member'
import { LoadingCircles, Table, TableColumn } from '~/libs/ui'
import MemberHandleRenderer from './renderers/MemberHandleRenderer'
import styles from './SkillSearchResults.module.scss'
import MemberSkillsRenderer from './renderers/MemberSkillsRenderer'
import MatcherService from '@talentSearch/lib/services/MatcherService'
import codes from "country-calling-code";

export const memberColumns: ReadonlyArray<TableColumn<Member>> = [
    {
        label: 'Handle',
        propertyName: 'numberOfChallengesWon',
        type: 'element',
        renderer: MemberHandleRenderer,
    },
    {
        label: 'Skills',
        propertyName: 'emsiSkills',
        type: 'element',
        renderer: MemberSkillsRenderer,
    }
]

type SkillSearchResultsProps = {
    skillsFilter:ReadonlyArray<Skill>
}

type SkilLSearchResultState = {
    isLoading: boolean
    searchResults: ReadonlyArray<Member>
    skillsFilter: ReadonlyArray<Skill>
    page: number,
    hasMore: boolean
}

const PER_PAGE=2

export default class SkillSearchResult extends Component<SkillSearchResultsProps>{

    state: SkilLSearchResultState = {
        isLoading: false,
        searchResults: [],
        skillsFilter: [],
        page: 1,
        hasMore: true
    };

    componentDidUpdate(prevProps: Readonly<SkillSearchResultsProps>, prevState: Readonly<{}>, snapshot?: any): void {
        if(this.props.skillsFilter != this.state.skillsFilter){
            this.state.searchResults=[]
            this.state.page=1
            this.retrieveMatches(this.props.skillsFilter)    
            this.state.skillsFilter = this.props.skillsFilter
            this.setState(this.state)
        }
    }

    retrieveMatches(filter:ReadonlyArray<Skill>){
        this.state.isLoading = true
        this.setState(this.state)
        MatcherService.retrieveMatchesForSkills(this.props.skillsFilter, this.state.page, PER_PAGE)
        .then((response: Array<Member>) => {
            if(response){
                if(response.length==PER_PAGE){
                    this.state.hasMore = true
                }

                response.forEach(function (value){
                    const code = codes.find((i) => i.isoCode3 === value.competitionCountryCode);
                    
                    if (code) {
                      value.country = code.country;
                    }
                })
            }
            if(this.state.page==1){
                this.state.searchResults = response;
            }
            else{
                this.state.searchResults = this.state.searchResults.concat(response)
            }
            this.state.isLoading = false;
            this.setState(this.state)
        })
        .catch((e: Error) => {
            console.log(e);
        });
    }
    
    async loadMore(){
        this.state.page+=1
        this.setState(this.state)

        this.retrieveMatches(this.props.skillsFilter)
    }

    render() {
        //If we searched and have no results, show "No results found", otherwise hide the results table 
        //until a search has been made
        if(this.state.isLoading){
            return (<LoadingCircles />)
        }
        else if(this.props.skillsFilter && 
            this.props.skillsFilter.length>0 && 
            (!this.state.searchResults || 
                this.state.searchResults.length==0)){
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
                    data={this.state.searchResults}
                    columns={memberColumns}
                    onLoadMoreClick={() => this.loadMore()}
                    moreToLoad={this.state.hasMore}
                />
            </div>
        )
    }
}

