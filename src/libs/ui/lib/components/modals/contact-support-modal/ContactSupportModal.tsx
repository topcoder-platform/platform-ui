import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react'

import { ContactSupportForm, contactSupportFormDef } from '../../contact-support-form'
import { FormDefinition, formGetInputFields, formOnReset } from '../../form'
import { BaseModal } from '../base-modal'

export interface ContactSupportModalProps {
    isOpen: boolean
    isSelfService?: boolean
    onClose: () => void
    workId?: string
}

const ContactSupportModal: FC<ContactSupportModalProps> = (props: ContactSupportModalProps) => {

    const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...contactSupportFormDef })

    const onClose: () => void = useCallback(() => {
        const updatedForm: FormDefinition = { ...formDef }
        formOnReset(formGetInputFields(updatedForm.groups || []))
        setFormDef(updatedForm)
        props.onClose()
    }, [formDef, props])

    return (
        <BaseModal
            onClose={onClose}
            open={props.isOpen}
            size='md'
            title={'We\'re Here to Help'}
        >
            <ContactSupportForm
                formDef={formDef}
                isSelfService={props.isSelfService}
                onSave={onClose}
                workId={props.workId}
            />
        </BaseModal>
    )
}

export default ContactSupportModal
