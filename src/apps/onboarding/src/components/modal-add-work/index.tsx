/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable sort-keys */
import { FC, useEffect, useState } from 'react'
import classNames from 'classnames'
import _ from 'lodash'
import moment from 'moment'

import { BaseModal, Button, InputSelect, InputText, InputTextarea } from '~/libs/ui'
import { FormInputCheckbox } from '~/apps/self-service/src/components/form-elements'

import styles from './styles.module.scss'
import WorkInfo, { emptyWorkInfo } from '../../models/WorkInfo'
import { INDUSTRIES_OPTIONS } from '../../config'
import FormField from '../FormField'
import DateInput from '../DateInput'

const FormInputCheckboxMiddleware: any = FormInputCheckbox as any

interface ModalAddWorkProps {
    onClose?: () => void
    editingWork?: WorkInfo | null
    onAdd?: (workInfo: WorkInfo) => void
    onEdit?: (workInfo: WorkInfo) => void
}

const industryOptions: any = _.sortBy(INDUSTRIES_OPTIONS)
    .map(v => ({
        value: v,
        label: v,
    }))

const ModalAddWork: FC<ModalAddWorkProps> = (props: ModalAddWorkProps) => {
    const [workInfo, setWorkInfo] = useState(emptyWorkInfo())
    const [formErrors, setFormErrors] = useState<any>({
        company: undefined,
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

        if (!validateDate(workInfo.startDate, workInfo.endDate)) {
            errorTmp.startDate = 'Start Date should be before End Date'
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
        <BaseModal
            buttons={(
                <Button
                    primary
                    size='lg'
                    label={props.editingWork ? 'edit experience' : 'add experience'}
                    onClick={() => {
                        if (validateField()) {
                            const endDate: Date | undefined = workInfo.endDate
                            let endDateString: string = endDate ? moment(endDate)
                                .format('YYYY') : ''
                            if (workInfo.currentlyWorking) {
                                endDateString = 'current'
                            }

                            let startDateString: string = workInfo.startDate ? moment(workInfo.startDate)
                                .format('YYYY') : ''
                            if (startDateString) {
                                startDateString += '-'
                            }

                            (props.editingWork ? props.onEdit : props.onAdd)?.({
                                ...workInfo,
                                dateDescription: (
                                    workInfo.startDate || workInfo.endDate
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
            title={props.editingWork ? 'Edit work experience:' : 'Add work experience:'}
            classNames={{ modal: styles.infoModal }}
        >
            <div className={classNames(styles.modalContent, 'd-flex flex-column align-items-start')}>
                <div className='full-width'>
                    <InputText
                        name='company'
                        label='Company Name'
                        value={workInfo.company}
                        onChange={event => {
                            setWorkInfo({
                                ...workInfo,
                                company: event.target.value,
                            })
                        }}
                        placeholder='Company Name'
                        tabIndex={0}
                        type='text'
                        dirty
                        error={formErrors.company}
                    />
                </div>
                <div className='d-flex full-width gap-20'>
                    <div className='flex-1'>
                        <InputSelect
                            options={industryOptions}
                            value={workInfo.industry}
                            onChange={event => setWorkInfo({
                                ...workInfo,
                                industry: event.target.value,
                            })}
                            name='industry'
                            label='Industry'
                            placeholder='Industry'
                        />
                    </div>
                    <div className='flex-1'>
                        <InputText
                            name='location'
                            label='Location'
                            value={workInfo.city}
                            onChange={event => setWorkInfo({
                                ...workInfo,
                                city: event.target.value,
                            })}
                            placeholder='Location'
                            tabIndex={0}
                            type='text'
                        />
                    </div>
                </div>
                <div className='full-width'>
                    <InputText
                        name='position'
                        label='Position / Job Title'
                        value={workInfo.position}
                        onChange={event => setWorkInfo({
                            ...workInfo,
                            position: event.target.value,
                        })}
                        placeholder='Position / Job Title'
                        tabIndex={0}
                        type='text'
                        dirty
                        error={formErrors.position}
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
                                value={workInfo.startDate}
                                onChange={v => {
                                    setWorkInfo({
                                        ...workInfo,
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
                            label='End Date'
                        >
                            <DateInput
                                disabled={workInfo.currentlyWorking}
                                value={workInfo.endDate}
                                onChange={v => {
                                    setWorkInfo({
                                        ...workInfo,
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
                    label='Current Role'
                    checked={workInfo.currentlyWorking}
                    inline
                    onChange={(e: any) => {
                        setWorkInfo({
                            ...workInfo,
                            currentlyWorking: e.target.checked,
                        })
                    }}
                />
                <div className={classNames('full-width mt-30', styles.InputTextareaDescription)}>
                    <InputTextarea
                        name='description'
                        label='Description'
                        value={workInfo.description}
                        onChange={event => setWorkInfo({
                            ...workInfo,
                            description: event.target.value,
                        })}
                        onBlur={_.noop}
                        placeholder='Description'
                        tabIndex={0}
                    />
                </div>
            </div>
        </BaseModal>
    )
}

export default ModalAddWork
