import {
    FormDefinition,
    textInputOptionalHint,
    validatorRequired,
} from '../../lib'

export const workIntakeTitle: string = 'Define your work'

export const workIntakeDef: FormDefinition = {
    buttons: [
        {
            buttonStyle: 'secondary',
            isSave: true,
            label: 'Submit',
            order: 1,
            size: 'xl',
            tabIndex: 4,
            type: 'submit',
        },
    ],
    inputs: [
        {
            label: 'Project Title',
            name: 'title',
            order: 1,
            tabIndex: 1,
            type: 'text',
            validators: [
                validatorRequired,
            ],
        },
        {
            hint: textInputOptionalHint,
            label: 'Share your data',
            name: 'data',
            order: 2,
            placeholder: 'Paste a link',
            tabIndex: 2,
            type: 'text',
            validators: [],
        },
        {
            label: 'What would you like to learn?',
            name: 'learn',
            order: 3,
            tabIndex: 3,
            type: 'text',
            validators: [
                validatorRequired,
            ],
        },
    ],
    title: workIntakeTitle,
}
