import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react'

import { ToolTitle } from '../../config'
import {
    ContactSupportForm,
    contactSupportFormDef,
    ContentLayout,
    FormDefinition,
    formGetInputFields,
    formOnReset,
} from '../../lib'

const ContactSupport: FC<{}> = () => {

    const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...contactSupportFormDef })

    const onSave: () => void = useCallback((): void => {
        const updatedForm: FormDefinition = { ...formDef }
        formOnReset(formGetInputFields(updatedForm.groups || []))
        setFormDef(updatedForm)
    }, [formDef])

    return (
        <ContentLayout title={ToolTitle.support}>
            <ContactSupportForm
                formDef={formDef}
                onSave={onSave}
            />
        </ContentLayout>
    )
}

export default ContactSupport
