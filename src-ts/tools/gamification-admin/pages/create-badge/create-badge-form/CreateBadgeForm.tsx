import { FC, useContext } from 'react'

import { Form, FormDefinition, formGetInputModel, FormInputModel, profileContext, ProfileContextData } from '../../../../../lib'

import { CreateBadgeFormField } from './create-badge-form.config'
import { CreateBadgeRequest } from './create-badge-functions'
import { createBadgeSubmitRequestAsync } from './create-badge-functions/create-badge-store'
import styles from './CreateBadgeForm.module.scss'

export interface CreateBadgeFormProps {
    formDef: FormDefinition
    onSave: () => void
}

const CreateBadgeForm: FC<CreateBadgeFormProps> = (props: CreateBadgeFormProps) => {

    const { profile }: ProfileContextData = useContext(profileContext)

    function generateRequest(inputs: ReadonlyArray<FormInputModel>): CreateBadgeRequest {
        const badgeName: string = formGetInputModel(inputs, CreateBadgeFormField.badgeName).value as string
        const badgeDesc: string = formGetInputModel(inputs, CreateBadgeFormField.badgeDesc).value as string
        const badgeActive: string = formGetInputModel(inputs, CreateBadgeFormField.badgeActive).value as string
        return {
          badgeActive,
          badgeName,
          badgeDesc,
        }
    }

    async function saveAsync(request: CreateBadgeRequest): Promise<void> {
        return createBadgeSubmitRequestAsync(request)
            .then(() => {
                props.onSave()
            })
    }

    return (
        <>
            <Form
                formDef={props.formDef}
                formValues={profile}
                requestGenerator={generateRequest}
                save={saveAsync}
            />
        </>
    )
}

export default CreateBadgeForm
