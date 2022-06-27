import { Dispatch, FC, SetStateAction, useState } from 'react'

import { ContactSupportForm, contactSupportFormDef, ContentLayout, FormDefinition, formOnReset } from '../../lib'

export const toolTitle: string = 'Contact Support'

const ContactSupport: FC<{}> = () => {

    const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...contactSupportFormDef })

    function onSave(): void {
        const updatedForm: FormDefinition = { ...formDef }
        formOnReset(updatedForm.inputs)
        setFormDef(updatedForm)
    }

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
