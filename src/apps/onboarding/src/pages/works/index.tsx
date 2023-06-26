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
import ConnectLinkedIn from '../../components/connect-linked-in'
import WorkInfo from '../../models/WorkInfo'
import ModalAddWork from '../../components/modal-add-work'
import IconEdit from '../../assets/images/edit.svg'
import IconTrash from '../../assets/images/trash.svg'
import { createMemberWorks, updateMemberWorks } from '../../redux/actions/member'

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
            setWorkId(props.reduxWorks[props.reduxWorks.length - 1].id + 1)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [props.reduxWorks])

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>Add your work experience here</h2>
            <PageDivider />

            <div className={classNames('d-flex justify-content-between gap-50 flex-wrap', styles.blockContent)}>
                <div className='d-flex flex-column align-items-start flex-1'>
                    <div className='d-flex flex-column full-width'>
                        {(works || []).map(work => (
                            <div key={work.id} className='d-flex flex-column full-width'>
                                <div className='d-flex align-items-center gap-20'>
                                    <span>{work.company}</span>
                                    <button
                                        aria-label='edit'
                                        type='button'
                                        onClick={() => {
                                            setEditingWork(work)
                                            setShowAddWorkModal(true)
                                        }}
                                    >
                                        <img width={15} height={15} src={IconEdit} alt='' />
                                    </button>
                                    <button
                                        aria-label='delete'
                                        type='button'
                                        onClick={() => setWorks(_.filter(works, w => w.id !== work.id))}
                                    >
                                        <img width={15} height={15} src={IconTrash} alt='' />
                                    </button>
                                </div>
                                {work.city ? (<span>{work.city}</span>) : null}
                                <span className={styles.textPosition}>{work.position}</span>
                                {work.dateDescription ? (<span>{work.dateDescription}</span>) : null}
                                {work.description ? (
                                    <span
                                        className={classNames('mt-30', styles.textDescription)}
                                    >
                                        {work.description}
                                    </span>
                                ) : null}
                                <PageDivider />
                            </div>
                        ))}
                    </div>

                    <Button
                        size='lg'
                        secondary
                        iconToLeft
                        onClick={() => setShowAddWorkModal(true)}
                        disabled={props.loadingMemberTraits}
                    >
                        + add work experience
                    </Button>
                    {(!works || works.length === 0) ? (
                        <span className='mt-30'>
                            You will be able to add details for each of the work experiences
                            that you think will demonstrate your abilities.
                        </span>
                    ) : null}
                </div>
                <ConnectLinkedIn />
            </div>

            <ProgressBar
                className={styles.ProgressBar}
                progress={3.0 / 7}
                label='3/7'
            />

            <div className={classNames('d-flex justify-content-between', styles.blockFooter)}>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    onClick={() => navigate('../skills')}
                >
                    back
                </Button>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={loading || props.loadingMemberTraits}
                    onClick={async () => {
                        setLoading(true)
                        if (!_.isEqual(props.reduxWorks, works)) {
                            if (!props.reduxWorks) {
                                await props.createMemberWorks(works || [])
                            } else {
                                await props.updateMemberWorks(works || [])
                            }
                        }

                        setLoading(false)
                        navigate('../educations')
                    }}
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
