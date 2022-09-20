import { Dispatch, FC, SetStateAction, useState } from 'react'

import { Form, FormDefinition, formGetInputModel, FormInputModel } from '../../../../../lib'

import { CreateBadgeFormField } from './create-badge-form.config'
import { CreateBadgeRequest } from './create-badge-functions'
import { createBadgeSubmitRequestAsync } from './create-badge-functions/create-badge-store'
import { createBadgeFormDef } from './create-badge-form.config'

import styles from './CreateBadgeForm.module.scss'

export interface CreateBadgeFormProps {
    formDef: FormDefinition
    onSave: () => void
}

const CreateBadgeForm: FC<CreateBadgeFormProps> = (props: CreateBadgeFormProps) => {
                
    // createBadgeFormDef.buttons.primaryGroup[0].onClick = (e) => { console.log('save btn click', e); e.preventDefault() }


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
        console.log('saveAsync', request)

        return createBadgeSubmitRequestAsync(request)
            .then(() => {
                props.onSave()
            })
    }

    return (
        <>
            <Form
                formDef={props.formDef}
                requestGenerator={generateRequest}
                save={saveAsync}
            />
        </>
    )
}

export default CreateBadgeForm
