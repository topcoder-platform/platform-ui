import { FC } from 'react'

import { Form, FormDefinition, formGetInputModel, FormInputModel } from '../../../../../lib'
import { GamificationConfig } from '../../../game-config'
import { GameBadge } from '../../../game-lib'

import { CreateBadgeFormField } from './create-badge-form.config'
import { CreateBadgeRequest } from './create-badge-functions'
import { createBadgeSubmitRequestAsync } from './create-badge-functions/create-badge-store'

export interface CreateBadgeFormProps {
    formDef: FormDefinition
    onSave: (createdBadge: GameBadge) => void
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
            badgeStatus: 'Active', // not used currently thus fixed field
            files,
            orgID: GamificationConfig.ORG_ID,
        }
    }

    async function saveAsync(request: CreateBadgeRequest): Promise<void> {
        return createBadgeSubmitRequestAsync(request)
            .then((createdBadge: GameBadge) => {
                props.onSave(createdBadge)
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
