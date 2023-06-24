/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
import { useNavigate } from 'react-router-dom'
import { connect } from 'react-redux'
import { FC, useEffect, useState } from 'react'
import _ from 'lodash'
import AsyncSelect from 'react-select/async'
import classNames from 'classnames'

import { Member } from '~/apps/talent-search/src/lib/models'
import { Button, PageDivider } from '~/libs/ui'

import { ProgressBar } from '../../components/progress-bar'
import { autoCompleteSkills } from '../../services/skills'
import { updateMemberSkills } from '../../redux/actions/member'
import SkillInfo from '../../models/SkillInfo'
import SkillTag from '../../components/skill-tag'

import styles from './styles.module.scss'
import ConnectLinkedIn from '../../components/connect-linked-in'

const PageSkillsContent: FC<{
    memberInfo?: Member,
    updateMemberSkills: (skills: SkillInfo[]) => void
}> = props => {
    const navigate: any = useNavigate()
    const [skillsFilter, setSkillsFilter] = useState<ReadonlyArray<SkillInfo> | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    useEffect(() => {
        if (!skillsFilter && props.memberInfo) {
            setSkillsFilter(props.memberInfo?.emsiSkills || [])
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [props.memberInfo])

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>What skills do you have?</h2>
            <PageDivider />
            <div className={classNames(styles.blockContent, 'd-flex justify-content-between')}>
                <div className={classNames('d-flex flex-column', styles.blockLeft)}>
                    <h3>Select your skills</h3>
                    <span className='mt-30'>
                        Add industry standard skills to your profile to let employers
                        search and find you for opportunities that fit your capabilities.
                    </span>
                    <div>
                        {(skillsFilter && skillsFilter.length > 0) ? (
                            <div
                                className={
                                    classNames(
                                        'mt-30 d-flex flex-wrap',
                                        styles.blockSkilTags,
                                    )
                                }
                            >
                                {(skillsFilter || []).map(skillItem => (
                                    <SkillTag
                                        key={skillItem.name}
                                        skill={skillItem}
                                        onDelete={() => {
                                            setSkillsFilter(
                                                _.filter(skillsFilter, skill => skill.name !== skillItem.name),
                                            )
                                        }}
                                    />
                                ))}
                            </div>
                        ) : null}
                        <AsyncSelect
                            isMulti
                            cacheOptions
                            autoFocus
                            defaultOptions
                            placeholder='Start typing to autocomplete available EMSI skills'
                            loadOptions={autoCompleteSkills}
                            name='skills'
                            className='basic-multi-select mt-30'
                            classNamePrefix='select'
                            getOptionLabel={(skill: SkillInfo) => skill.name}
                            getOptionValue={(skill: SkillInfo) => skill.emsiId}
                            onChange={(options: readonly SkillInfo[]) => {
                                if (options.length > 0) {
                                    const newSkillFilter: SkillInfo[] = _.uniqBy(
                                        [...(skillsFilter || []), ...options],
                                        'name',
                                    )
                                    _.forEach(options, option => {
                                        const matchSkill: SkillInfo | undefined = _.find(
                                            newSkillFilter,
                                            { name: option.name },
                                        )
                                        if (matchSkill && !matchSkill?.skillSources) {
                                            matchSkill.skillSources = ['SelfPicked']
                                        } else if (
                                            matchSkill
                                            && matchSkill.skillSources
                                            && matchSkill.skillSources.indexOf('SelfPicked') < 0
                                        ) {
                                            matchSkill.skillSources.push('SelfPicked')
                                        }
                                    })
                                    setSkillsFilter(newSkillFilter)
                                }
                            }}
                            value={[]}
                            isDisabled={!props.memberInfo || loading}
                        />
                    </div>
                </div>

                <ConnectLinkedIn />
            </div>

            <ProgressBar
                className={styles.ProgressBar}
                progress={2.0 / 7}
                label='2/7'
            />

            <div className={classNames('d-flex justify-content-between', styles.blockFooter)}>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    onClick={() => navigate('../start')}
                >
                    back
                </Button>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={loading}
                    onClick={async () => {
                        setLoading(true)
                        if (!_.isEqual(props.memberInfo?.emsiSkills, skillsFilter)) {
                            await props.updateMemberSkills([...(skillsFilter || [])])
                        }

                        setLoading(false)
                        navigate('../works')
                    }}
                >
                    next
                </Button>
            </div>
        </div>
    )
}

const mapStateToProps: any = (state: any) => {
    const {
        memberInfo,
    }: any = state.member

    return {
        memberInfo,
    }
}

const mapDispatchToProps: any = {
    updateMemberSkills,
}

export const PageSkills: any = connect(mapStateToProps, mapDispatchToProps)(PageSkillsContent)

export default PageSkills
