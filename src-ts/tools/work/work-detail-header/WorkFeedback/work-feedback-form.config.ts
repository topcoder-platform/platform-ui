import { FormDefinition, inputOptional, validatorRequired } from '../../../../lib'

export const workFeedbackFormDef: FormDefinition = {
    buttons: [
        {
            buttonStyle: 'primary',
            isSave: true,
            label: 'Mark as done',
            size: 'xl',
            type: 'submit',
        },
    ],
    inputs: [
        {
            instructions: 'How happy are you with the quality of work?',
            name: 'question-1',
            type: 'rating',
            validators: [
                {
                    validator: validatorRequired,
                },
            ],
        },
        {
            instructions: 'How easy was the platform to use?',
            name: 'question-2',
            type: 'rating',
            validators: [
                {
                    validator: validatorRequired,
                },
            ],
        },
        {
            instructions: 'How likely are you to recommend Topcoder?',
            name: 'question-3',
            type: 'rating',
            validators: [
                {
                    validator: validatorRequired,
                },
            ],
        },
        {
            hint: inputOptional,
            label: 'What can we do to make your experience better?',
            name: 'question-4',
            placeholder: 'Add your comments here...',
            spellCheck: true,
            type: 'textarea',
        },
    ],
    subtitle: 'To mark this work as done, please provide feedback on your experience.',
    successMessage: 'Your feedback has been submitted. If your changes do not appear immediately, please reload the page.',
}
