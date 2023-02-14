import {
    FormDefinition,
    formGetInputModel,
    FormInputModel,
    validatorEmail,
    validatorRequired,
} from '../../../../../lib'

export enum EnrollmentFormFields {
    email = 'email'
}

export interface EnrollmentFormValue {
    email: string
}

export function generateEnrollmentFormRequest(inputs: ReadonlyArray<FormInputModel>): EnrollmentFormValue {
    const email: string = formGetInputModel(inputs, EnrollmentFormFields.email).value as string

    return { email }
}

export const enrollmentFormDef: FormDefinition = {
    buttons: {
        primaryGroup: [
            {
                buttonStyle: 'primary',
                isSubmit: true,
                label: 'Enroll Now',
                size: 'lg',
                type: 'submit',
            },
        ],
    },
    groups: [
        {
            inputs: [
                {
                    label: 'Email',
                    name: EnrollmentFormFields.email,
                    type: 'text',
                    validators: [
                        {
                            validator: validatorEmail,
                        },
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
            ],
        },
    ],
    successMessage: false,
}
