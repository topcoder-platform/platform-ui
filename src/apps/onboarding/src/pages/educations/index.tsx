import { FC, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { connect } from 'react-redux'
import _ from 'lodash'
import classNames from 'classnames'
import moment from 'moment'

import { Button, IconOutline, PageDivider } from '~/libs/ui'

import { createMemberEducations, updateMemberEducations } from '../../redux/actions/member'
import { ProgressBar } from '../../components/progress-bar'
import CardItem from '../../components/card-item'
import EducationInfo from '../../models/EducationInfo'
import ModalAddEducation from '../../components/modal-add-education'

import styles from './styles.module.scss'

export const PageEducationsContent: FC<{
    reduxEducations: EducationInfo[] | undefined
    updateMemberEducations: (educations: EducationInfo[]) => void
    createMemberEducations: (educations: EducationInfo[]) => void
    loadingMemberTraits: boolean
}> = props => {
    const navigate: any = useNavigate()
    const [editingEducation, setEditingEducation] = useState<EducationInfo | undefined>(undefined)
    const [educations, setEducations] = useState<EducationInfo[] | undefined>(undefined)
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

    const displayEducations = useMemo(() => (educations || []).map(educationItem => {
        const endDate: Date | undefined = educationItem.endDate
        const endDateString: string = endDate ? moment(endDate)
            .format('YYYY') : ''
        return {
            ...educationItem,
            dateDescription: endDateString || '',
        }
    }), [educations])

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>Education</h2>
            <PageDivider />

            <div className={classNames('d-flex flex-column align-items-start full-width mt-8', styles.blockContent)}>
                <h3>Add your education</h3>

                <span className='color-black-80 mt-8'>
                    Relevant education details will help make your profile more valuable to potential employers.
                </span>

                {displayEducations.length > 0 ? (
                    <div
                        className={'d-grid grid-2-column mobile-grid-1-column '
                            + ' gap-column-16 gap-row-8 mobile-gap-row-16 full-width mt-24 mobile-mt-8'}
                    >
                        {displayEducations.map(education => (
                            <CardItem
                                key={education.id}
                                title={education.major || ''}
                                subTitle={education.collegeName || ''}
                                description={education.dateDescription || ''}
                                onEdit={function onEdit() {
                                    setEditingEducation(education)
                                    setShowAddEducationModal(true)
                                }}
                                onDelete={function onDelete() {
                                    setEducations(_.filter(educations, w => w.id !== education.id))
                                }}
                            />
                        ))}
                    </div>
                ) : undefined}

                <Button
                    size='lg'
                    secondary
                    iconToLeft
                    onClick={function showAddEducation() {
                        setShowAddEducationModal(true)
                    }}
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
                    icon={IconOutline.ChevronLeftIcon}
                    onClick={function onPrevious() {
                        navigate('../works')
                    }}
                />
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={loading}
                    onClick={function onNext() {
                        navigate('../personalization')
                    }}
                >
                    next
                </Button>
            </div>
            {showAddEducationModal ? (
                <ModalAddEducation
                    editingEducation={editingEducation}
                    onClose={function onClose() {
                        setShowAddEducationModal(false)
                        setEditingEducation(undefined)
                    }}
                    onAdd={function onAdd(newEducation: EducationInfo) {
                        setEducations([...(educations || []), {
                            ...newEducation,
                            id: educationId + 1,
                        }])
                        setEducationId(educationId + 1)
                    }}
                    onEdit={function onEdit(editEducation: EducationInfo) {
                        setEducations((educations || []).map(w => (w.id !== editEducation.id ? w : editEducation)))
                    }}
                />
            ) : undefined}
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
