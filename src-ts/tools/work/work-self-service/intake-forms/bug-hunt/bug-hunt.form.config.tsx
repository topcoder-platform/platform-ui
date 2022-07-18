
import { ReactComponent as BackIcon } from '../../../../../../src/assets/images/icon-back-arrow.svg'
import { FormDefinition, GithubIcon, GitlabIcon, RadioButton, validatorRequired } from '../../../../../lib'

export enum FormInputNames {
    additionalInformation = 'additionalInformation',
    title = 'projectTitle',
    features = 'featuresToTest',
    goals = 'goals',
    deliveryType = 'deliveryType',
    repositoryLink = 'repositoryLink',
    websiteURL = 'websiteURL',
}

export const BugHuntFormConfig: FormDefinition = {
    buttons: {
        primaryGroup: [
            {
                buttonStyle: 'secondary',
                label: 'Save for later',
                onClick: () => { },
                type: 'button',
            },
            {
                buttonStyle: 'primary',
                label: 'Complete and pay',
                onClick: () => { },
                type: 'submit',
            },
        ],
        secondaryGroup: [
            {
                buttonStyle: 'icon',
                icon: BackIcon,
                onClick: () => { },
                type: 'button',
            },
        ],
    },
    groups: [
        {
            inputs: [
                {
                    hideInlineErrors: true,
                    label: 'Project title',
                    name: FormInputNames.title,
                    placeholder: 'Enter a descriptive title',
                    type: 'text',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
            ],
            instructions: 'Enter a title for your website bug hunt project.',
            title: 'Project Title',
        },
        {
            inputs: [
                {
                    hideInlineErrors: true,
                    label: 'Website URL',
                    name: FormInputNames.websiteURL,
                    placeholder: 'Enter a descriptive title',
                    type: 'text',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
            ],
            instructions: 'Enter a title for your website bug hunt project.',
            title: 'Website URL',
        },
        {
            inputs: [
                {
                    hideInlineErrors: true,
                    label: 'Project title',
                    name: FormInputNames.goals,
                    placeholder: 'Describe your goal',
                    type: 'textarea',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
            ],
            instructions: `
                Do you have any specific goals for your website bug hunt? </br>
                For example: find bugs in my online shopping experience
            `,
            title: 'Bug Hunt Goals',
        },
        {
            inputs: [
                {
                    label: 'Features to test (optional)',
                    name: FormInputNames.features,
                    placeholder: 'List the sepcific features',
                    type: 'textarea',
                },
            ],
            instructions: `
                Are there specific features we should focus on testing? </br>
                For example: [An example not used above]
            `,
            title: 'Features to test',
        },
        {
            inputs: [
                {
                    hideInlineErrors: true,
                    name: FormInputNames.deliveryType,
                    notTabbable: false,
                    options: [
                        {
                            checked: false,
                            children: <RadioButton name={'GitHub'} icon={<GithubIcon />} />,
                            id: 'GitHub',
                        },
                        {
                            checked: false,
                            children: <RadioButton name={'GitLab'} icon={<GitlabIcon />} />,
                            id: 'GitLab',
                        },
                    ],
                    type: 'radio',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
                {
                    label: 'Repository Link (Optional)',
                    name: FormInputNames.repositoryLink,
                    placeholder: 'www.example-share-link.com',
                    type: 'text',
                },
            ],
            instructions: 'How do you want your bugs delivered?',
            title: 'Bug Delivery',
        },
        {
            inputs: [
                {
                    label: 'Additional information (optional)',
                    name: FormInputNames.additionalInformation,
                    placeholder: '[Suggestion text]',
                    type: 'textarea',
                },
            ],
            instructions: `
                Is there anything else we should know about testing your website?
            `,
            title: 'Additional Information',
        },
    ],
}
