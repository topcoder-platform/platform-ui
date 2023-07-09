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
import EducationInfo from '../../models/EducationInfo'
import ModalAddEducation from '../../components/modal-add-education'
import { updateMemberEducations, createMemberEducations } from '../../redux/actions/member'
import { ReactComponent as IconBackGreen } from '../../assets/images/back-green.svg'
import CardItem from '../../components/card-item'

export const PageEducationsContent: FC<{
    reduxEducations: EducationInfo[] | null
    updateMemberEducations: (educations: EducationInfo[]) => void
    createMemberEducations: (educations: EducationInfo[]) => void
    loadingMemberTraits: boolean
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
            if (props.reduxEducations.length > 0) {
                setEducationId(props.reduxEducations[props.reduxEducations.length - 1].id + 1)
            }
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [props.reduxEducations])

    useEffect(() => {
        const saveData: any = async () => {
            setLoading(true)
            if (!props.reduxEducations) {
                await props.createMemberEducations(educations || [])
            } else {
                await props.updateMemberEducations(educations || [])
            }

            setLoading(false)
        }

        if (!!educations && !_.isEqual(props.reduxEducations, educations)) {
            saveData()
                .then(_.noop)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [educations])

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>Add your education information</h2>
            <PageDivider />

            <div className={classNames('d-flex flex-column align-items-start full-width mt-8', styles.blockContent)}>
                <h3>Add your education</h3>

                <span className='color-black-80 mt-8'>
                    Relevant education details will help make your profile more valuable to potential employers.
                </span>

                {(educations || []).length > 0 ? (
                    <div className='d-grid grid-2-column gap-column-16 gap-row-8 full-width mt-24'>
                        {(educations || []).map(education => (
                            <CardItem
                                key={education.id}
                                title={education.major || ''}
                                subTitle={education.collegeName || ''}
                                description={education.dateDescription || ''}
                                onEdit={() => {
                                    setEditingEducation(education)
                                    setShowAddEducationModal(true)
                                }}
                                onDelete={() => setEducations(_.filter(educations, w => w.id !== education.id))}
                            />
                        ))}
                    </div>
                ) : null}

                <Button
                    size='lg'
                    secondary
                    iconToLeft
                    onClick={() => setShowAddEducationModal(true)}
                    disabled={props.loadingMemberTraits || loading}
                    className='mt-24'
                >
                    + add education
                </Button>
            </div>

            <ProgressBar
                className={styles.ProgressBar}
                progress={4}
                maxStep={5}
            />

            <div className={classNames('d-flex justify-content-between', styles.blockFooter)}>
                <Button
                    size='lg'
                    secondary
                    iconToLeft
                    icon={IconBackGreen}
                    onClick={() => navigate('../works')}
                />
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={loading}
                    onClick={() => navigate('../personalization')}
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
        loadingMemberTraits,
    }: any = state.member

    return {
        loadingMemberTraits,
        reduxEducations: educations,
    }
}

const mapDispatchToProps: any = {
    createMemberEducations,
    updateMemberEducations,
}

export const PageEducations: any = connect(mapStateToProps, mapDispatchToProps)(PageEducationsContent)

export default PageEducations
