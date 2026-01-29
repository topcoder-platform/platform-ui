import { FC, useEffect, useMemo, useState } from 'react'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import { Button, IconOutline, PageDivider } from '~/libs/ui'
import { UserTrait } from '~/libs/core'
import { AddEditWorkExperienceModal, WorkExperienceCard } from '~/libs/shared'
import { useSkillsByIds } from '~/libs/shared/lib/services/standard-skills'

import { createMemberWorks, updateMemberWorks } from '../../redux/actions/member'
import { ProgressBar } from '../../components/progress-bar'
import WorkInfo from '../../models/WorkInfo'

import styles from './styles.module.scss'

function workInfoToUserTrait(work: WorkInfo): UserTrait {
    return {
        associatedSkills: work.associatedSkills,
        cityName: work.city,
        company: work.companyName,
        companyName: work.companyName,
        description: work.description,
        endDate: work.endDate?.toISOString(),
        industry: work.industry,
        otherIndustry: work.otherIndustry,
        position: work.position,
        startDate: work.startDate?.toISOString(),
        timePeriodFrom: work.startDate?.toISOString(),
        timePeriodTo: work.endDate?.toISOString(),
        working: work.currentlyWorking,
    }
}

function userTraitToWorkInfo(trait: UserTrait, id: number): WorkInfo {
    return {
        id,
        associatedSkills: Array.isArray(trait.associatedSkills) ? trait.associatedSkills : undefined,
        city: trait.cityName || trait.cityTown || trait.city,
        companyName: trait.company || trait.companyName,
        currentlyWorking: trait.working,
        description: trait.description,
        endDate: trait.timePeriodTo ? new Date(trait.timePeriodTo) : (trait.endDate ? new Date(trait.endDate) : undefined),
        industry: trait.industry,
        otherIndustry: trait.otherIndustry,
        position: trait.position,
        startDate: trait.timePeriodFrom ? new Date(trait.timePeriodFrom) : (trait.startDate ? new Date(trait.startDate) : undefined),
    }
}

export const PageWorksContent: FC<{
    reduxWorks: WorkInfo[] | undefined
    updateMemberWorks: (works: WorkInfo[]) => void
    createMemberWorks: (works: WorkInfo[]) => void
    loadingMemberTraits: boolean
}> = props => {
    const navigate: any = useNavigate()
    const [editingWork, setEditingWork] = useState<WorkInfo | undefined>(undefined)
    const [works, setWorks] = useState<WorkInfo[] | undefined>(undefined)
    const [workId, setWorkId] = useState<number>(10)
    const [showAddWorkModal, setShowAddWorkModal] = useState(false)
    const [loading, setLoading] = useState<boolean>(false)

    const allSkillIds = useMemo(() => {
        if (!works) return []
        const ids = new Set<string>()
        works.forEach(w => {
            if (w.associatedSkills) {
                w.associatedSkills.forEach((id: string) => ids.add(id))
            }
        })
        return Array.from(ids)
    }, [works])

    const { data: fetchedSkills } = useSkillsByIds(allSkillIds.length > 0 ? allSkillIds : undefined)
    const skillNamesMap = useMemo(() => {
        const map: Record<string, string> = {}
        if (fetchedSkills) {
            fetchedSkills.forEach(skill => {
                if (skill.id && skill.name) map[skill.id] = skill.name
            })
        }
        allSkillIds.forEach(id => {
            if (!map[id]) map[id] = id
        })
        return map
    }, [fetchedSkills, allSkillIds])

    useEffect(() => {
        if (!works && props.reduxWorks) {
            setWorks(props.reduxWorks)
            if (props.reduxWorks.length > 0) {
                setWorkId(props.reduxWorks[props.reduxWorks.length - 1].id + 1)
            }
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [props.reduxWorks])

    useEffect(() => {
        const saveData: any = async () => {
            setLoading(true)
            if (!props.reduxWorks) {
                await props.createMemberWorks(works || [])
            } else {
                await props.updateMemberWorks(works || [])
            }
            setLoading(false)
        }

        if (!!works && !_.isEqual(props.reduxWorks, works)) {
            saveData()
                .then(_.noop)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [works])

    const displayWorks = works || []

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>Show us what you have done!</h2>
            <PageDivider />

            <div className={classNames('d-flex justify-content-between gap-50 flex-wrap mt-8', styles.blockContent)}>
                <div className='d-flex flex-column align-items-start full-width'>
                    <h3>Add your experience</h3>

                    <span className='color-black-80 mt-8'>
                        Add details for career experiences that demonstrate your abilities.
                    </span>

                    {displayWorks.length > 0 ? (
                        <div
                            className={'d-grid grid-2-column mobile-grid-1-column '
                                + ' gap-column-16 gap-row-8 mobile-gap-row-16 full-width mt-24 mobile-mt-8'}
                        >
                            {displayWorks.map(work => (
                                <div
                                    key={work.id}
                                    className={styles.workCardWrap}
                                >
                                    <div className='flex-1'>
                                        <WorkExperienceCard
                                            work={workInfoToUserTrait(work)}
                                            isModalView
                                            skillNamesMap={skillNamesMap}
                                        />
                                    </div>
                                    <div className={styles.workCardActions}>
                                        <button
                                            aria-label='edit'
                                            type='button'
                                            onClick={function onEdit() {
                                                setEditingWork(work)
                                                setShowAddWorkModal(true)
                                            }}
                                        >
                                            <IconOutline.PencilIcon width={24} height={24} />
                                        </button>
                                        <button
                                            aria-label='delete'
                                            type='button'
                                            onClick={function onDelete() {
                                                setWorks(_.filter(works, w => w.id !== work.id))
                                            }}
                                        >
                                            <IconOutline.TrashIcon width={24} height={24} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : undefined}

                    <Button
                        size='lg'
                        secondary
                        iconToLeft
                        onClick={function onClick() {
                            setShowAddWorkModal(true)
                        }}
                        disabled={props.loadingMemberTraits || loading}
                        className='mt-24'
                    >
                        + add experience
                    </Button>
                </div>
            </div>

            <ProgressBar
                className={styles.ProgressBar}
                progress={3}
                maxStep={5}
            />

            <div className={classNames('d-flex justify-content-between', styles.blockFooter)}>
                <Button
                    size='lg'
                    secondary
                    iconToLeft
                    icon={IconOutline.ChevronLeftIcon}
                    disabled={loading}
                    onClick={function previousPage() {
                        navigate('../open-to-work')
                    }}
                />
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={loading}
                    onClick={function nextPage() {
                        navigate('../educations')
                    }}
                >
                    next
                </Button>
            </div>
            <AddEditWorkExperienceModal
                open={showAddWorkModal}
                onClose={function onClose() {
                    setShowAddWorkModal(false)
                    setEditingWork(undefined)
                }}
                initialWork={editingWork ? workInfoToUserTrait(editingWork) : undefined}
                onSave={function onSave(trait: UserTrait) {
                    if (editingWork) {
                        setWorks(
                            (works || []).map(w => (w.id !== editingWork.id ? w : userTraitToWorkInfo(trait, editingWork.id))),
                        )
                    } else {
                        const newId = workId + 1
                        setWorks([...(works || []), userTraitToWorkInfo(trait, newId)])
                        setWorkId(newId)
                    }
                }}
            />
        </div>
    )
}

const mapStateToProps: any = (state: any) => {
    const {
        loadingMemberTraits,
        works,
    }: any = state.member

    return {
        loadingMemberTraits,
        reduxWorks: works,
    }
}

const mapDispatchToProps: any = {
    createMemberWorks,
    updateMemberWorks,
}

export const PageWorks: any = connect(mapStateToProps, mapDispatchToProps)(PageWorksContent)

export default PageWorks
