import { FC, useCallback, useEffect, useState } from 'react'
import { isEmpty } from 'lodash'

import { UserProfile } from '~/libs/core'
import {
    BaseModal,
    Button,
    Form,
    formGetInputModel,
    FormInputModel,
    FormValue,
    IconOutline,
    LoadingSpinner,
} from '~/libs/ui'

import { hiringFormDef, HiringFormField } from './hiring-form.config'
import styles from './HiringFormModal.module.scss'

interface HiringFormModalProps {
    onClose: () => void
    authProfile: UserProfile | undefined
    profile: UserProfile
    searchedSkills: string[]
}

function populateIframeForm(profile: UserProfile, formValues: any | undefined, searchedSkills: string[]): string {
    const formUrl = `https://go.topcoder.com/talent-search-intake?handle=${profile.handle}`

    if (formValues) {
        return `${formUrl}
&first_name=${formValues.firstName}
&last_name=${formValues.lastName}
&email=${formValues.email}
&phone_number=${formValues.phone}
&company=${formValues.company}
&searched_skills=${searchedSkills.join(',')}`
    }

    return formUrl
}

function renderSuccessModal(onClose: HiringFormModalProps['onClose']): JSX.Element {
    return (
        <BaseModal
            onClose={onClose}
            open
            size='md'
            buttons={<Button label='Close' onClick={onClose} primary />}
        >
            <div className={styles.successSubmit}>
                <IconOutline.CheckCircleIcon className='icon-mxx' />
                <div className='body-medium-bold'>
                    Your request has been submitted
                </div>
                <div className='body-main'>
                    We&apos;re excited to learn more about you and the work you want done.
                    A Topcoder Solutions Expert will be reaching out to you via email or phone very shortly.
                </div>

            </div>
        </BaseModal>
    )
}

const HiringFormModal: FC<HiringFormModalProps> = (props: HiringFormModalProps) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [submitted, setSubmitted] = useState<boolean>(false)
    const [formValues, setFormValues] = useState<any>({})

    const generateRequest = useCallback((inputs: ReadonlyArray<FormInputModel>): FormValue => {
        const firstName: string
            = formGetInputModel(inputs, HiringFormField.first).value as string
        const lastName: string
            = formGetInputModel(inputs, HiringFormField.last).value as string
        const email: string
            = formGetInputModel(inputs, HiringFormField.email).value as string
        const phone: string
            = formGetInputModel(inputs, HiringFormField.phone).value as string
        const company: string
            = formGetInputModel(inputs, HiringFormField.company).value as string
        return {
            company,
            email,
            firstName,
            lastName,
            phone,
        }
    }, [])

    const saveAsync = useCallback(async (request: FormValue): Promise<void> => {
        setLoading(true)
        setFormValues(request)
    }, [])

    useEffect(() => {
        function listenUnbounceSubmit(ev: any): void {
            if (ev.origin !== 'https://go.topcoder.com' || ev.data !== 'unbounceUserFormSubmitted') {
                return
            }

            setLoading(false)
            setSubmitted(true)
        }

        window.addEventListener('message', listenUnbounceSubmit, false)

        return () => window.removeEventListener('message', listenUnbounceSubmit, false)
    }, [])

    function renderIframe(): JSX.Element {
        return (
            <iframe
                src={populateIframeForm(props.profile, formValues, props.searchedSkills)}
                title='Start Hiring Form'
                id='start-hiring-form'
                className='hidden'
            />
        )
    }

    function renderIntakeForm(): JSX.Element {
        return (
            <Form
                formDef={hiringFormDef}
                formValues={props.authProfile as unknown as FormValue}
                requestGenerator={generateRequest}
                save={saveAsync}
            />
        )
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            title={!submitted && (
                <p className='body-large-bold'>
                    Interested in working with one of our experts?
                    <br />
                    Start with this form.
                </p>
            )}
            size={submitted ? 'md' : 'lg'}
            buttons={submitted && (
                <Button
                    label='Close'
                    onClick={props.onClose}
                    primary
                />
            )}
        >
            <LoadingSpinner hide={!loading || submitted} overlay />

            {submitted ? renderSuccessModal(props.onClose) : (
                <>
                    {!isEmpty(formValues) && renderIframe()}
                    {renderIntakeForm()}
                </>
            )}

        </BaseModal>
    )
}

export default HiringFormModal
