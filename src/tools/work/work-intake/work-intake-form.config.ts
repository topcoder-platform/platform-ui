import {
    FormDefinition,
    inputOptional,
    validatorRequired,
    validatorSslUrl,
} from '../../../lib'

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
            instructions: 'Give your project a descriptive title. This is what the engineers will see when looking for your work.',
            label: 'Project Title',
            name: 'title',
            placeholder: 'Enter a descriptive title',
            title: 'Project Title',
            type: 'text',
            validateOnChange: [
                validatorRequired,
            ],
        },
        {
            instructions: `Add links (separate multiple links with commas) or upload your data files here. Not ready or able to share? No problem, we'll work with you on that later.`,
            label: 'Shareable URL Link(s)',
            name: 'data',
            placeholder: 'https://www.example.com/share/link',
            title: `Share your data ${inputOptional}`,
            type: 'text',
            validateOnChange: [
                validatorSslUrl, // TODO: permit multiple
            ],
        },
        // TODO: upload data files
        {
            instructions: 'Describe your data and what you would like to learn about it. If you have a formal problem statement, please share it.',
            label: 'Goals & Data Description',
            name: 'description',
            placeholder: 'Enter your goals and descriptions here',
            title: 'What would you like to learn',
            type: 'textarea',
            validateOnChange: [
                validatorRequired,
            ],
        },
    ],
}
