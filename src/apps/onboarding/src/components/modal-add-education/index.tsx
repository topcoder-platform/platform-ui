import { FC, FocusEvent, useEffect, useState } from 'react'
import { getYear, setYear } from 'date-fns'
import _ from 'lodash'
import classNames from 'classnames'

import { Button, InputSelect, InputText } from '~/libs/ui'

import EducationInfo, { emptyEducationInfo } from '../../models/EducationInfo'
import OnboardingBaseModal from '../onboarding-base-modal'

import styles from './styles.module.scss'

interface ModalAddEducationProps {
    onClose?: () => void
    editingEducation?: EducationInfo | null
    onAdd?: (educationInfo: EducationInfo) => void
    onEdit?: (educationInfo: EducationInfo) => void
}

const years: number[] = _.range(1979, getYear(new Date()) + 10)
const yearOptions: any = years
    .map(v => ({
        label: `${v}`,
        value: `${v}`,
    }))

const ModalAddEducation: FC<ModalAddEducationProps> = (props: ModalAddEducationProps) => {
    const [educationInfo, setEducationInfo] = useState(emptyEducationInfo())
    const [formErrors, setFormErrors] = useState<any>({
        collegeName: undefined,
        endDate: undefined,
        major: undefined,
    })

    const validateField: any = () => {
        const errorTmp: any = {}
        if (!educationInfo.collegeName) {
            errorTmp.collegeName = 'Required'
        }

        if (!educationInfo.major) {
            errorTmp.major = 'Required'
        }

        if (!educationInfo.endDate) {
            errorTmp.endDate = 'Required'
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
        <OnboardingBaseModal
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
                                (props.editingEducation ? props.onEdit : props.onAdd)?.(educationInfo)
                                props.onClose?.()
                            }
                        }}
                    />
                </div>
            )}
            onClose={props.onClose || _.noop}
            title={props.editingEducation ? 'Edit Education' : 'Add Education'}
        >
            <div className={classNames(styles.modalContent, 'd-flex flex-column align-items-start mobile-gap-16')}>
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
                <div className='full-width'>
                    <InputSelect
                        tabIndex={0}
                        options={yearOptions}
                        value={educationInfo.endDate ? `${getYear(educationInfo.endDate)}` : undefined}
                        onChange={function onChange(event: any) {
                            setEducationInfo({
                                ...educationInfo,
                                endDate: setYear(
                                    new Date(),
                                    parseInt(event.target.value, 10),
                                ),
                            })
                        }}
                        dirty
                        error={formErrors.endDate}
                        name='endDate'
                        label='End Year or Expected'
                        placeholder='Select year'
                    />
                </div>
            </div>
        </OnboardingBaseModal>
    )
}

export default ModalAddEducation
