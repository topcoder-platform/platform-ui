import { Dispatch, FC, SetStateAction, useState } from 'react'

import { ContactSupportForm, contactSupportFormDef } from '../../contact-support-form'
import { FormDefinition, formOnReset } from '../../form'
import { BaseModal } from '../base-modal'

export interface ContactSupportModal {
    isOpen: boolean
    onClose: () => void
    workId?: string
}

const ContactSupportModal: FC<ContactSupportModal> = (props: ContactSupportModal) => {

    const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>] = useState<FormDefinition>({ ...contactSupportFormDef })

    function onClose(): void {
        const updatedForm: FormDefinition = { ...formDef }
        formOnReset(updatedForm.inputs)
        setFormDef(updatedForm)
        props.onClose()
    }

    return (
        <BaseModal
            onClose={onClose}
            open={props.isOpen}
            size='md'
            title={`We're Here to Help`}
        >
            <ContactSupportForm
                formDef={formDef}
                onSave={onClose}
            />
        </BaseModal>
    )
}

export default ContactSupportModal
