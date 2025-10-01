import { FC, useEffect, useMemo, useState } from 'react'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'
import moment from 'moment'

import { Button, IconOutline, PageDivider } from '~/libs/ui'

import { createMemberWorks, updateMemberWorks } from '../../redux/actions/member'
import { ProgressBar } from '../../components/progress-bar'
import CardItem from '../../components/card-item'
import ModalAddWork from '../../components/modal-add-work'
import WorkInfo from '../../models/WorkInfo'

import styles from './styles.module.scss'

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

    const displayWorks = useMemo(() => (works || []).map(workItem => {
        const startDate: Date | undefined = workItem.startDate
        const endDate: Date | undefined = workItem.endDate
        let endDateString: string = endDate ? moment(endDate)
            .format('YYYY') : ''
        if (workItem.currentlyWorking) {
            endDateString = 'current'
        }

        const startDateString: string = startDate ? moment(startDate)
            .format('YYYY') : ''
        return {
            ...workItem,
            dateDescription: [
                ...(startDateString ? [startDateString] : []),
                ...(endDateString ? [endDateString] : []),
            ].join('-'),
            description: workItem.companyName,
        }
    }), [works])

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
                                <CardItem
                                    key={work.id}
                                    title={work.position || ''}
                                    subTitle={work.description || ''}
                                    description={work.dateDescription || ''}
                                    onEdit={function onEdit() {
                                        setEditingWork(work)
                                        setShowAddWorkModal(true)
                                    }}
                                    onDelete={function onDelete() {
                                        setWorks(_.filter(works, w => w.id !== work.id))
                                    }}
                                />
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
            {showAddWorkModal ? (
                <ModalAddWork
                    editingWork={editingWork}
                    onClose={function onClose() {
                        setShowAddWorkModal(false)
                        setEditingWork(undefined)
                    }}
                    onAdd={function onAdd(newWork: WorkInfo) {
                        setWorks([...(works || []), {
                            ...newWork,
                            id: workId + 1,
                        }])
                        setWorkId(workId + 1)
                    }}
                    onEdit={function onEdit(editWork: WorkInfo) {
                        setWorks(
                            (works || []).map(w => (w.id !== editWork.id ? w : editWork)),
                        )
                    }}
                />
            ) : undefined}
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
