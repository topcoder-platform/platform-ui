/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable sort-keys */
import { FC, useEffect, useState } from 'react'
import classNames from 'classnames'
import moment from 'moment'
import _ from 'lodash'

import { BaseModal, Button, InputText } from '~/libs/ui'
import { FormInputCheckbox } from '~/apps/self-service/src/components/form-elements'

import styles from './styles.module.scss'
import EducationInfo, { emptyEducationInfo } from '../../models/EducationInfo'
import FormField from '../FormField'
import DateInput from '../DateInput'

const FormInputCheckboxMiddleware: any = FormInputCheckbox as any

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
                <Button
                    primary
                    size='lg'
                    label={props.editingEducation ? 'edit education' : 'add education'}
                    onClick={() => {
                        if (validateField()) {
                            const endDate: Date | undefined = educationInfo.endDate
                            let endDateString: string = endDate ? moment(endDate)
                                .format('YYYY') : ''
                            if (!educationInfo.graduated) {
                                endDateString = 'current'
                            }

                            let startDateString: string = educationInfo.startDate ? moment(educationInfo.startDate)
                                .format('YYYY') : ''
                            if (startDateString) {
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
            )}
            onClose={props.onClose || _.noop}
            open
            size='body'
            title={props.editingEducation ? 'Edit education:' : 'Add education:'}
            classNames={{ modal: styles.infoModal }}
        >
            <div className={classNames(styles.modalContent, 'd-flex flex-column align-items-start')}>
                <div className='full-width'>
                    <InputText
                        name='collegeName'
                        label='Name of College or University'
                        value={educationInfo.collegeName}
                        onChange={event => {
                            setEducationInfo({
                                ...educationInfo,
                                collegeName: event.target.value,
                            })
                        }}
                        placeholder='Name of College or University'
                        tabIndex={0}
                        type='text'
                        dirty
                        error={formErrors.collegeName}
                    />
                </div>
                <div className='full-width'>
                    <InputText
                        name='major'
                        label='Major'
                        value={educationInfo.major}
                        onChange={event => setEducationInfo({
                            ...educationInfo,
                            major: event.target.value,
                        })}
                        placeholder='Major'
                        tabIndex={0}
                        type='text'
                        dirty
                        error={formErrors.major}
                    />
                </div>
                <div className='d-flex gap-20 full-width'>
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
                                onChange={v => {
                                    setEducationInfo({
                                        ...educationInfo,
                                        startDate: v || undefined,
                                    })
                                }}
                                style2
                                placeholder='Start date'
                            />
                        </FormField>
                    </div>
                    <div
                        className='flex-1'
                    >
                        <FormField
                            label='End Date (or expected)'
                        >
                            <DateInput
                                disabled={!educationInfo.graduated}
                                value={educationInfo.endDate}
                                onChange={v => {
                                    setEducationInfo({
                                        ...educationInfo,
                                        endDate: v || undefined,
                                    })
                                }}
                                style2
                                placeholder='End date'
                            />
                        </FormField>
                    </div>
                </div>
                <FormInputCheckboxMiddleware
                    label='Graduated'
                    checked={educationInfo.graduated}
                    inline
                    onChange={(e: any) => {
                        setEducationInfo({
                            ...educationInfo,
                            graduated: e.target.checked,
                        })
                    }}
                />
            </div>
        </BaseModal>
    )
}

export default ModalAddEducation
