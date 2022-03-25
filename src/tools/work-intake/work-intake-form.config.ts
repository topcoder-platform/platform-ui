import {
    FormDefinition,
    inputOptionalHint,
    validatorRequired,
    validatorSslUrl,
} from '../../lib'

export const workIntakeTitle: string = 'Define your work'

export const workIntakeDef: FormDefinition = {
    buttons: [
        {
            buttonStyle: 'secondary',
            isSave: true,
            label: 'Submit',
            size: 'xl',
            type: 'submit',
        },
    ],
    inputs: [
        {
            label: 'Project Title',
            name: 'title',
            type: 'text',
            validateOnChange: [
                validatorRequired,
            ],
        },
        {
            hint: inputOptionalHint,
            label: 'Share your data',
            name: 'data',
            placeholder: 'https://...',
            type: 'text',
            validateOnChange: [
                validatorSslUrl,
            ],
        },
        {
            label: 'What would you like to learn?',
            name: 'description',
            type: 'textarea',
            validateOnChange: [
                validatorRequired,
            ],
        },
    ],
    title: workIntakeTitle,
}
