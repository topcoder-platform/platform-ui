import {
    FC,
    useEffect,
    useState,
} from 'react'

import { ContentLayout, LoadingSpinner } from '~/libs/ui'
import SkillSearchResults from './components/skill-search-results/SkillSearchResults'
import Skill from '@talentSearch/lib/models/Skill'
import Member from '@talentSearch/lib/models/Member'
import Select from 'react-select';

import MatcherService from '@talentSearch/lib/services/MatcherService'

import styles from './TalentSearch.module.scss'

export const TalentSearch: FC = () => {
    const [allSkills, setAllSkills] = useState<Array<Skill>>([]);
    const [skillsFilter, setSkillsFilter] = useState<ReadonlyArray<Skill>>([]);
    const [searchResults, setSearchResults] = useState<Array<Member>>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        retrieveAllSkills();
    }, []);

    const retrieveAllSkills = () => {
        MatcherService.getAllSkills()
        .then((response: Array<Skill>) => {
            setAllSkills(response);
            
            console.log(JSON.stringify(allSkills));
        })
        .catch((e: Error) => {
            console.log(e);
        });
    };

    function retrieveMatches(filter:ReadonlyArray<Skill>){
        setIsLoading(true);
        setSearchResults([]);
        MatcherService.retrieveMatchesForSkills(filter)
        .then((response: Array<Member>) => {
            if(response){
                response.forEach(function (value){
                    //The service doesn't always return all fields, so clean up the data a bit
                    if(!value.numberOfChallengesPlaced){
                        value.numberOfChallengesPlaced = 0
                    }
                    if(!value.numberOfChallengesWon){
                        value.numberOfChallengesWon = 0
                    }
                    if(!value.country){
                        value.country="-"
                    }
                    
                    //totalSkillScore holds the total scoe for *all* skills associated with this member, regardless of if 
                    //they are applicable against the searched skills
                    value.totalSkillScore = 0

                    //searchedSkillScore holds the total score for all searched skills (Javascript, HTML, CSS, for example)
                    //for this particular member.  
                    value.searchedSkillScore = 0
                    value.searchedSkills = []
                    if(value.skills){
                        //This isn't super efficient, but should be OK for now
                        //Here, we summarise the total score and collect an array of *just* the searched
                        //skills, for aggregation so that the user can differentiate between all skills
                        //for a particular member and the ones that are actively being searched for
                        value.skills.forEach(function(skill){
                            value.totalSkillScore += skill.score
                            
                            filter.forEach(function(searched){
                                if(skill.skill == searched.skillName){
                                    value.searchedSkillScore += skill.score
                                    value.searchedSkills.push(skill)
                                }
                            })
                        })
                    }
                })
            }
            setSearchResults(response);
            setIsLoading(false);
        })
        .catch((e: Error) => {
            console.log(e);
        });
    }

    if(!allSkills || allSkills.length==0){
        return (<LoadingSpinner />)
    }

    return (
            <ContentLayout
                contentClass={styles.contentLayout}
                outerClass={styles['contentLayout-outer']}
                innerClass={styles['contentLayout-inner']}
            >
            <div className={styles['header']}>
              <h2>Talent search</h2>
            </div>
            <div className={styles['options']}>
                <h4>Select Skills:</h4>
                
                <Select
                    isMulti
                    name="skills"
                    className="basic-multi-select"
                    classNamePrefix="select"
                    getOptionLabel={(skill: Skill) => skill.skillName}
                    getOptionValue={(skill: Skill) => skill.id}
                    options={allSkills}
                    onChange={(option: readonly Skill[]) => {
                        setSkillsFilter(option);
                        retrieveMatches(option);
                    }}
                />
            </div>
            

            <SkillSearchResults 
                results={searchResults}
                skillsFilter={skillsFilter}
                isLoading={isLoading}
            />
            
            </ContentLayout>
    )
}

export default TalentSearch
