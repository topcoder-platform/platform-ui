import { FC, useEffect, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import moment from 'moment'

import { Button, InputSelect, InputText } from '~/libs/ui'
import { FormInputCheckbox } from '~/apps/self-service/src/components/form-elements'

import { INDUSTRIES_OPTIONS } from '../../config'
import DateInput from '../DateInput'
import FormField from '../FormField'
import OnboardingBaseModal from '../onboarding-base-modal'
import WorkInfo, { emptyWorkInfo } from '../../models/WorkInfo'

import styles from './styles.module.scss'

const FormInputCheckboxMiddleware: any = FormInputCheckbox as any

interface ModalAddWorkProps {
    onClose?: () => void
    editingWork?: WorkInfo | null
    onAdd?: (workInfo: WorkInfo) => void
    onEdit?: (workInfo: WorkInfo) => void
}

const industryOptions: any = _.sortBy(INDUSTRIES_OPTIONS)
    .map(v => ({
        label: v,
        value: v,
    }))

const ModalAddWork: FC<ModalAddWorkProps> = (props: ModalAddWorkProps) => {
    const [workInfo, setWorkInfo] = useState(emptyWorkInfo())
    const [formErrors, setFormErrors] = useState<any>({
        company: undefined,
        endDate: undefined,
        position: undefined,
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
        if (!workInfo.company) {
            errorTmp.company = 'Required'
        }

        if (!workInfo.position) {
            errorTmp.position = 'Required'
        }

        if (!workInfo.startDate) {
            errorTmp.startDate = 'Required'
        } else if (!validateDate(workInfo.startDate, workInfo.endDate)) {
            errorTmp.startDate = 'Start Date should be before End Date'
        }

        if (!workInfo.endDate && !workInfo.currentlyWorking) {
            errorTmp.endDate = 'Required'
        }

        setFormErrors(errorTmp)
        return _.isEmpty(errorTmp)
    }

    useEffect(() => {
        if (props.editingWork) {
            setWorkInfo(props.editingWork)
        }
    }, [props.editingWork])

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
                                (props.editingWork ? props.onEdit : props.onAdd)?.(workInfo)
                                props.onClose?.()
                            }
                        }}
                    />
                </div>
            )}
            onClose={props.onClose || _.noop}
            title={props.editingWork ? 'Edit Experience' : 'Add Experience'}
        >
            <div className={classNames(styles.modalContent, 'd-flex flex-column align-items-start mobile-gap-16')}>
                <div className='full-width'>
                    <InputText
                        name='company'
                        label='Company *'
                        value={workInfo.company}
                        onChange={function onChange(event: any) {
                            setWorkInfo({
                                ...workInfo,
                                company: event.target.value,
                            })
                        }}
                        placeholder='Enter company'
                        tabIndex={0}
                        type='text'
                        dirty
                        error={formErrors.company}
                    />
                </div>
                <div className='full-width'>
                    <InputText
                        name='position'
                        label='Position *'
                        value={workInfo.position}
                        onChange={function onChange(event: any) {
                            setWorkInfo({
                                ...workInfo,
                                position: event.target.value,
                            })
                        }}
                        placeholder='Enter position'
                        tabIndex={0}
                        type='text'
                        dirty
                        error={formErrors.position}
                    />
                </div>
                <div className='full-width'>
                    <InputSelect
                        tabIndex={1}
                        options={industryOptions}
                        value={workInfo.industry}
                        onChange={function onChange(event: any) {
                            setWorkInfo({
                                ...workInfo,
                                industry: event.target.value,
                            })
                        }}
                        name='industry'
                        label='Industry'
                        placeholder='Select industry'
                        dirty
                    />
                </div>
                <div className='d-flex gap-16 full-width'>
                    <div
                        className='flex-1'
                    >
                        <FormField
                            label='Start Date *'
                            error={
                                formErrors.startDate
                            }
                        >
                            <DateInput
                                value={workInfo.startDate}
                                onChange={function onChange(v: any) {
                                    setWorkInfo({
                                        ...workInfo,
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
                            label={workInfo.currentlyWorking ? 'End Date' : 'End Date *'}
                            error={
                                formErrors.endDate
                            }
                        >
                            <DateInput
                                disabled={workInfo.currentlyWorking}
                                value={workInfo.endDate}
                                onChange={function onChange(v: any) {
                                    setWorkInfo({
                                        ...workInfo,
                                        endDate: v || undefined,
                                    })
                                }}
                                style2
                                placeholder='Select end date'
                            />
                        </FormField>
                    </div>
                </div>
                <div className='mt-16 mobile-mt-0'>
                    <FormInputCheckboxMiddleware
                        label='I am currently working in this role'
                        checked={workInfo.currentlyWorking}
                        inline
                        onChange={function onChange(e: any) {
                            setWorkInfo({
                                ...workInfo,
                                currentlyWorking: e.target.checked,
                                endDate: e.target.checked ? undefined : workInfo.endDate,
                            })
                        }}
                    />
                </div>
            </div>
        </OnboardingBaseModal>
    )
}

export default ModalAddWork
