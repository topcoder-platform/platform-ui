/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
import { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import _ from 'lodash'
import { connect } from 'react-redux'

import { Button, PageDivider } from '~/libs/ui'

import { ProgressBar } from '../../components/progress-bar'
import styles from './styles.module.scss'
import IconEdit from '../../assets/images/edit.svg'
import IconTrash from '../../assets/images/trash.svg'
import EducationInfo from '../../models/EducationInfo'
import ModalAddEducation from '../../components/modal-add-education'
import { updateMemberEducations, createMemberEducations } from '../../redux/actions/member'

export const PageEducationsContent: FC<{
    reduxEducations: EducationInfo[] | null
    updateMemberEducations: (educations: EducationInfo[]) => void
    createMemberEducations: (educations: EducationInfo[]) => void
}> = props => {
    const navigate: any = useNavigate()
    const [editingEducation, setEditingEducation] = useState<EducationInfo | null>(null)
    const [educations, setEducations] = useState<EducationInfo[] | null>(null)
    const [educationId, setEducationId] = useState<number>(10)
    const [showAddEducationModal, setShowAddEducationModal] = useState(false)
    const [loading, setLoading] = useState<boolean>(false)
    useEffect(() => {
        if (!educations && props.reduxEducations) {
            setEducations(props.reduxEducations)
            setEducationId(props.reduxEducations[props.reduxEducations.length - 1].id + 1)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [props.reduxEducations])

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>Add your education information</h2>
            <PageDivider />

            <div className={classNames('d-flex flex-column full-width align-items-start', styles.blockContent)}>
                <div className='d-flex flex-column full-width'>
                    {(educations || []).map(education => (
                        <div key={education.id} className='d-flex flex-column full-width'>
                            <div className='d-flex align-items-center gap-20'>
                                <span>{education.collegeName}</span>
                                <button
                                    aria-label='edit'
                                    type='button'
                                    onClick={() => {
                                        setEditingEducation(education)
                                        setShowAddEducationModal(true)
                                    }}
                                >
                                    <img width={15} height={15} src={IconEdit} alt='' />
                                </button>
                                <button
                                    aria-label='edit'
                                    type='button'
                                    onClick={() => setEducations(_.filter(educations, w => w.id !== education.id))}
                                >
                                    <img width={15} height={15} src={IconTrash} alt='' />
                                </button>
                            </div>
                            <span>{education.major}</span>
                            {education.dateDescription ? (<span>{education.dateDescription}</span>) : null}
                            <PageDivider />
                        </div>
                    ))}
                </div>

                <Button
                    size='lg'
                    secondary
                    iconToLeft
                    onClick={() => setShowAddEducationModal(true)}
                    disabled={!educations}
                >
                    + add education
                </Button>
                {(!educations || educations.length === 0) ? (
                    <span className='mt-30'>
                        Relevant education details will help make your
                        profile more valuable to potential employers, add it here!
                    </span>
                ) : null}
            </div>

            <ProgressBar
                className={styles.ProgressBar}
                progress={4.0 / 7}
                label='4/7'
            />

            <div className={classNames('d-flex justify-content-between', styles.blockFooter)}>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    onClick={() => navigate('../works')}
                >
                    back
                </Button>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={loading || !educations}
                    onClick={async () => {
                        setLoading(true)
                        if (!_.isEqual(props.reduxEducations, educations)) {
                            if (!props.reduxEducations) {
                                await props.createMemberEducations(educations || [])
                            } else {
                                await props.updateMemberEducations(educations || [])
                            }
                        }

                        setLoading(false)
                    }}
                >
                    next
                </Button>
            </div>
            {showAddEducationModal ? (
                <ModalAddEducation
                    editingEducation={editingEducation}
                    onClose={() => {
                        setShowAddEducationModal(false)
                        setEditingEducation(null)
                    }}
                    onAdd={newEducation => {
                        setEducations([...(educations || []), {
                            ...newEducation,
                            id: educationId + 1,
                        }])
                        setEducationId(educationId + 1)
                    }}
                    onEdit={editEducation => {
                        setEducations((educations || []).map(w => (w.id !== editEducation.id ? w : editEducation)))
                    }}
                />
            ) : null}
        </div>
    )
}

const mapStateToProps: any = (state: any) => {
    const {
        educations,
    }: any = state.member

    return {
        reduxEducations: educations,
    }
}

const mapDispatchToProps: any = {
    createMemberEducations,
    updateMemberEducations,
}

export const PageEducations: any = connect(mapStateToProps, mapDispatchToProps)(PageEducationsContent)

export default PageEducations
