import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react'

import {
    ContactSupportForm,
    contactSupportFormDef,
    ContentLayout,
    FormDefinition,
    formGetInputFields,
    formOnReset,
} from '../../lib'

import { toolTitle } from './contact-support.routes'

const ContactSupport: FC<{}> = () => {

    const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...contactSupportFormDef })

    const onSave = useCallback((): void => {
        const updatedForm: FormDefinition = { ...formDef }
        formOnReset(formGetInputFields(updatedForm.groups || []))
        setFormDef(updatedForm)
    }, [formDef])

    return (
        <ContentLayout title={toolTitle}>
            <ContactSupportForm
                formDef={formDef}
                onSave={onSave}
            />
        </ContentLayout>
    )
}

export default ContactSupport
