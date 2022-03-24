import {
    FormDefinition,
    inputTextOptionalHint,
    validatorRequired,
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
            validators: [
                validatorRequired,
            ],
        },
        {
            hint: inputTextOptionalHint,
            label: 'Share your data',
            name: 'data',
            placeholder: 'Paste a link',
            type: 'text',
            validators: [],
        },
        {
            label: 'What would you like to learn?',
            name: 'description',
            type: 'text',
            validators: [
                validatorRequired,
            ],
        },
    ],
    title: workIntakeTitle,
}
