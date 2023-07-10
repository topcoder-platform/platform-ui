import { FC, FocusEvent, useEffect, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import moment from 'moment'

import { BaseModal, Button, InputText } from '~/libs/ui'

import DateInput from '../DateInput'
import EducationInfo, { emptyEducationInfo } from '../../models/EducationInfo'
import FormField from '../FormField'

import styles from './styles.module.scss'

interface ModalAddEducationProps {
    onClose?: () => void
    editingEducation?: EducationInfo | null
    onAdd?: (educationInfo: EducationInfo) => void
    onEdit?: (educationInfo: EducationInfo) => void
}

const ModalAddEducation: FC<ModalAddEducationProps> = (props: ModalAddEducationProps) => {
    const [educationInfo, setEducationInfo] = useState(emptyEducationInfo())
    const [formErrors, setFormErrors] = useState<any>({
        collegeName: undefined,
        major: undefined,
        startDate: undefined,
    })

    const validateDate: any = (startDate: Date | undefined, endDate: Date | undefined) => {
        const isInValid: any = endDate
            && startDate
            && moment(endDate)
                .isSameOrBefore(startDate)
        return !isInValid
    }

    const validateField: any = () => {
        const errorTmp: any = {}
        if (!educationInfo.collegeName) {
            errorTmp.collegeName = 'Required'
        }

        if (!educationInfo.major) {
            errorTmp.major = 'Required'
        }

        if (!validateDate(educationInfo.startDate, educationInfo.endDate)) {
            errorTmp.startDate = 'Start Date should be before End Date'
        }

        setFormErrors(errorTmp)
        return _.isEmpty(errorTmp)
    }

    useEffect(() => {
        if (props.editingEducation) {
            setEducationInfo(props.editingEducation)
        }
    }, [props.editingEducation])

    return (
        <BaseModal
            buttons={(
                <div className='d-flex gap-16'>
                    <Button
                        secondary
                        size='lg'
                        label='cancel'
                        onClick={props.onClose}
                    />
                    <Button
                        primary
                        size='lg'
                        label='save'
                        onClick={function onClick() {
                            if (validateField()) {
                                const endDate: Date | undefined = educationInfo.endDate
                                const endDateString: string = endDate ? moment(endDate)
                                    .format('YYYY') : ''

                                let startDateString: string = educationInfo.startDate ? moment(educationInfo.startDate)
                                    .format('YYYY') : ''
                                if (startDateString && endDateString) {
                                    startDateString += '-'
                                }

                                (props.editingEducation ? props.onEdit : props.onAdd)?.({
                                    ...educationInfo,
                                    dateDescription: (
                                        educationInfo.startDate || educationInfo.endDate
                                    ) ? `${startDateString}${endDateString}` : '',
                                })
                                props.onClose?.()
                            }
                        }}
                    />
                </div>
            )}
            onClose={props.onClose || _.noop}
            open
            size='body'
            title={props.editingEducation ? 'Edit Education' : 'Add Education'}
            classNames={{ modal: styles.infoModal }}
        >
            <div className={classNames(styles.modalContent, 'd-flex flex-column align-items-start')}>
                <div className='full-width'>
                    <InputText
                        name='collegeName'
                        label='College or University *'
                        value={educationInfo.collegeName}
                        onChange={function onChange(event: FocusEvent<HTMLInputElement>) {
                            setEducationInfo({
                                ...educationInfo,
                                collegeName: event.target.value,
                            })
                        }}
                        placeholder='Enter school'
                        tabIndex={0}
                        type='text'
                        dirty
                        error={formErrors.collegeName}
                    />
                </div>
                <div className='full-width'>
                    <InputText
                        name='major'
                        label='Degree *'
                        value={educationInfo.major}
                        onChange={function onChange(event: FocusEvent<HTMLInputElement>) {
                            setEducationInfo({
                                ...educationInfo,
                                major: event.target.value,
                            })
                        }}
                        placeholder='Enter degree'
                        tabIndex={0}
                        type='text'
                        dirty
                        error={formErrors.major}
                    />
                </div>
                <div className='d-flex gap-16 full-width'>
                    <div
                        className='flex-1'
                    >
                        <FormField
                            label='Start Date'
                            error={
                                formErrors.startDate
                            }
                        >
                            <DateInput
                                value={educationInfo.startDate}
                                onChange={function onChange(v: Date | null) {
                                    setEducationInfo({
                                        ...educationInfo,
                                        startDate: v || undefined,
                                    })
                                }}
                                style2
                                placeholder='Select start date'
                            />
                        </FormField>
                    </div>
                    <div
                        className='flex-1'
                    >
                        <FormField
                            label='End Date or Expected'
                        >
                            <DateInput
                                value={educationInfo.endDate}
                                onChange={function onChange(v: Date | null) {
                                    setEducationInfo({
                                        ...educationInfo,
                                        endDate: v || undefined,
                                    })
                                }}
                                style2
                                placeholder='Select end date'
                            />
                        </FormField>
                    </div>
                </div>
            </div>
        </BaseModal>
    )
}

export default ModalAddEducation
