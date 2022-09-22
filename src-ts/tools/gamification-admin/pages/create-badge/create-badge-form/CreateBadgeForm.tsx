import { FC } from 'react'

import { Form, FormDefinition, formGetInputModel, FormInputModel } from '../../../../../lib'

import { CreateBadgeFormField } from './create-badge-form.config'
import { CreateBadgeRequest } from './create-badge-functions'
import { createBadgeSubmitRequestAsync } from './create-badge-functions/create-badge-store'

export interface CreateBadgeFormProps {
    formDef: FormDefinition
    onSave: () => void
}

const CreateBadgeForm: FC<CreateBadgeFormProps> = (props: CreateBadgeFormProps) => {

    function generateRequest(inputs: ReadonlyArray<FormInputModel>): CreateBadgeRequest {
        const badgeName: string = formGetInputModel(inputs, CreateBadgeFormField.badgeName).value as string
        const badgeDesc: string = formGetInputModel(inputs, CreateBadgeFormField.badgeDesc).value as string
        const badgeActive: boolean = formGetInputModel(inputs, CreateBadgeFormField.badgeActive).value as boolean
        const files: FileList = formGetInputModel(inputs, CreateBadgeFormField.file).value as FileList

        return {
            badgeActive,
            badgeDesc,
            badgeName,
            file: files[0],
        }
    }

    async function saveAsync(request: CreateBadgeRequest): Promise<void> {
        console.log('saveAsync', request)

        return createBadgeSubmitRequestAsync(request)
            .then(() => {
                props.onSave()
            })
    }

    return (
        <Form
            formDef={props.formDef}
            requestGenerator={generateRequest}
            save={saveAsync}
        />
    )
}

export default CreateBadgeForm
