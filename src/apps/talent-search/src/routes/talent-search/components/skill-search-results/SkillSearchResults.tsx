/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-access-state-in-setstate */
/* eslint-disable react/state-in-constructor */
/* eslint-disable ordered-imports/ordered-imports */

import { Component } from 'react'
import { LoadingCircles, Table, TableColumn } from '~/libs/ui'
import { MatcherService } from '@talentSearch/lib/services/'
import { Member, Skill } from '@talentSearch/lib/models'
import codes, { ICountryCodeItem } from 'country-calling-code'
import MemberHandleRenderer from './renderers/MemberHandleRenderer'
import MemberSkillsRenderer from './renderers/MemberSkillsRenderer'

export const memberColumns: ReadonlyArray<TableColumn<Member>> = [
    {
        defaultSortDirection: 'desc',
        label: 'Wins',
        propertyName: 'numberOfChallengesWon',
        renderer: MemberHandleRenderer,
        type: 'numberElement',
    },
    {
        label: 'Skills',
        renderer: MemberSkillsRenderer,
        type: 'element',
    },
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

const PER_PAGE:number = 10

export default class SkillSearchResult extends Component<SkillSearchResultsProps> {
    state: SkilLSearchResultState

    constructor(props: SkillSearchResultsProps) {
        super(props)
        this.state = {
            hasMore: true,
            isLoading: false,
            page: 1,
            searchResults: [],
            skillsFilter: [],
        }
    }

    componentDidUpdate(): void {
        if (this.props.skillsFilter !== this.state.skillsFilter) {
            this.state.searchResults = []
            this.state.page = 1
            this.retrieveMatches()
            this.state.skillsFilter = this.props.skillsFilter
        }
    }

    retrieveMatches(): void {
        this.state.isLoading = true
        this.setState(this.state)
        MatcherService.retrieveMatchesForSkills(this.props.skillsFilter, this.state.page, PER_PAGE)
            .then((response: Array<Member>) => {
                if (response) {
                    if (response.length === PER_PAGE) {
                        this.state.hasMore = true
                    } else {
                        this.state.hasMore = false
                    }

                    const filter:readonly Skill[] = this.props.skillsFilter
                    response.forEach(value => {
                        const code:ICountryCodeItem | undefined = codes.find(i => i.isoCode3
                                                                             === value.competitionCountryCode)

                        if (code) {
                            value.country = code.country
                        }

                        // This isn't great TODO: make this cleaner
                        value.emsiSkills.forEach(emsiSkill => {
                            emsiSkill.isSearched = false
                            for (let i:number = 0; i < filter.length; i++) {
                                if (emsiSkill.emsiId === filter[i].emsiId) {
                                    emsiSkill.isSearched = true
                                }
                            }
                        })
                        // Move the values that were searched to the front of the skills list for display in the UI
                        value.emsiSkills.sort((a, b) => ((a.isSearched && b.isSearched) ? a.name.localeCompare(b.name)
                            : (a.isSearched ? -1 : 0)))
                    })
                }

                if (this.state.page === 1) {
                    this.state.searchResults = response
                } else {
                    this.state.searchResults = this.state.searchResults.concat(response)
                }

                this.state.isLoading = false
                this.setState(this.state)
            })
            .catch((e: Error) => {
                console.log(e)
            })
    }

    async loadMore(): Promise<void> {
        this.state.page += 1
        this.setState(this.state)
        this.retrieveMatches()
    }

    render(): JSX.Element | null {
        // If we searched and have no results, show "No results found", otherwise hide the results table
        // until a search has been made
        if (this.state.isLoading) {
            return (<LoadingCircles />)
        }

        if (this.props.skillsFilter
            && this.props.skillsFilter.length > 0
            && (!this.state.searchResults
                || this.state.searchResults.length === 0)) {
            // TODO - fill this in with useful no results found
            return (<div>No results found</div>)
        }

        if (!this.props.skillsFilter
                 || this.props.skillsFilter.length === 0) {
            return (<div />)
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
