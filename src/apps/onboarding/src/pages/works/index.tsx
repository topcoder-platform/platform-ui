/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
import { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import _ from 'lodash'

import { Button, PageDivider } from '~/libs/ui'

import { ProgressBar } from '../../components/progress-bar'
import styles from './styles.module.scss'
import WorkInfo from '../../models/WorkInfo'
import ModalAddWork from '../../components/modal-add-work'
import { ReactComponent as IconBackGreen } from '../../assets/images/back-green.svg'
import { createMemberWorks, updateMemberWorks } from '../../redux/actions/member'
import CardItem from '../../components/card-item'

export const PageWorksContent: FC<{
    reduxWorks: WorkInfo[] | null
    updateMemberWorks: (works: WorkInfo[]) => void
    createMemberWorks: (works: WorkInfo[]) => void
    loadingMemberTraits: boolean
}> = props => {
    const navigate: any = useNavigate()
    const [editingWork, setEditingWork] = useState<WorkInfo | null>(null)
    const [works, setWorks] = useState<WorkInfo[] | null>(null)
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

                    {(works || []).length > 0 ? (
                        <div className='d-grid grid-2-column gap-column-16 gap-row-8 full-width mt-24'>
                            {(works || []).map(work => (
                                <CardItem
                                    key={work.id}
                                    title={work.position || ''}
                                    subTitle={work.city || ''}
                                    description={work.dateDescription || ''}
                                    onEdit={() => {
                                        setEditingWork(work)
                                        setShowAddWorkModal(true)
                                    }}
                                    onDelete={() => setWorks(_.filter(works, w => w.id !== work.id))}
                                />
                            ))}
                        </div>
                    ) : null}

                    <Button
                        size='lg'
                        secondary
                        iconToLeft
                        onClick={() => setShowAddWorkModal(true)}
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
                    icon={IconBackGreen}
                    disabled={loading}
                    onClick={() => navigate('../open-to-work')}
                />
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={loading}
                    onClick={() => navigate('../educations')}
                >
                    next
                </Button>
            </div>
            {showAddWorkModal ? (
                <ModalAddWork
                    editingWork={editingWork}
                    onClose={() => {
                        setShowAddWorkModal(false)
                        setEditingWork(null)
                    }}
                    onAdd={newWork => {
                        setWorks([...(works || []), {
                            ...newWork,
                            id: workId + 1,
                        }])
                        setWorkId(workId + 1)
                    }}
                    onEdit={editWork => {
                        setWorks(
                            (works || []).map(w => (w.id !== editWork.id ? w : editWork)),
                        )
                    }}
                />
            ) : null}
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
