import { Dispatch, FC, SetStateAction, useCallback, useContext, useEffect, useState } from 'react'

import { profileContext, ProfileContextData } from '~/libs/core'

import { Form, FormDefinition, formGetInputModel, FormInputModel } from '../form'
import { FormValue } from '../form/form-functions'
import { LoadingSpinner } from '../loading-spinner'

import { ContactSupportFormField } from './contact-support-form.config'
import { ContactSupportRequest } from './contact-support-functions'
import { contactSupportSubmitRequestAsync } from './contact-support-functions/contact-support-store'
import styles from './ContactSupportForm.module.scss'

export interface ContactSupportFormProps {
    formDef: FormDefinition
    isSelfService?: boolean
    onSave: () => void
    workId?: string
}

const ContactSupportForm: FC<ContactSupportFormProps> = (props: ContactSupportFormProps) => {

    const { profile }: ProfileContextData = useContext(profileContext)

    const [loading, setLoading]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [saveOnSuccess, setSaveOnSuccess]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    useEffect(() => {
        if (!loading && saveOnSuccess) {
            props.onSave.call(null)
        }
    }, [loading, saveOnSuccess, props.onSave])

    const generateRequest: (inputs: ReadonlyArray<FormInputModel>) => FormValue = useCallback((
        inputs: ReadonlyArray<FormInputModel>,
    ): FormValue => {
        const firstName: string
            = formGetInputModel(inputs, ContactSupportFormField.first).value as string
        const lastName: string
            = formGetInputModel(inputs, ContactSupportFormField.last).value as string
        const email: string
            = formGetInputModel(inputs, ContactSupportFormField.email).value as string
        const question: string
            = formGetInputModel(inputs, ContactSupportFormField.question).value as string
        return {
            challengeId: props.workId,
            email,
            firstName,
            isSelfService: !!props.isSelfService,
            lastName,
            question,
        }
    }, [props.isSelfService, props.workId])

    const saveAsync: (request: FormValue) => Promise<void>
        = useCallback(async (request: FormValue): Promise<void> => {
            setLoading(true)
            return contactSupportSubmitRequestAsync(request as unknown as ContactSupportRequest)
                .then(() => {
                    setSaveOnSuccess(true)
                })
                .finally(() => setLoading(false))
        }, [])

    const emailElement: JSX.Element | undefined = !!profile?.email
        ? (
            <>
                &nbsp;at
                {' '}
                <strong>{profile.email}</strong>
            </>
        )
        : undefined

    return (
        <>
            <LoadingSpinner hide={!loading} type='Overlay' />
            <div className={styles['contact-support-intro']}>
                <p>
                    Hi
                    {' '}
                    {profile?.firstName || 'there'}
                    , we&apos;re here to help.
                </p>
                <p>
                    Please describe what you&apos;d like to discuss, and a
                    Topcoder Solutions Expert will email you back
                    {emailElement}
                    &nbsp;within one business day.
                </p>
            </div>

            <Form
                formDef={props.formDef}
                formValues={profile as unknown as FormValue}
                requestGenerator={generateRequest}
                save={saveAsync}
            />
        </>
    )
}

export default ContactSupportForm
