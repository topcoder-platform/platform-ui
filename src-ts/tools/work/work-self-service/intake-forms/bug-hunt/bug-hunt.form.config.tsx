
import { ReactComponent as BackIcon } from '../../../../../../src/assets/images/icon-back-arrow.svg'
import { FormDefinition } from '../../../../../lib'

import BugDeliveryCheckbox from './bug-delivery-checkbox'

export enum FormInputNames {
    projectTitle = 'projectTitle',
    featuresToTest = 'featuresToTest',
    bugHuntGoals = 'bugHuntGoals',
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
                onClick: () => {},
                type: 'button',
            },
            {
                buttonStyle: 'primary',
                label: 'Complete and pay',
                onClick: () => {},
                type: 'submit',
            },
        ],
        secondaryGroup: [
            {
                buttonStyle: 'icon',
                icon: BackIcon,
                onClick: () => {},
                type: 'button',
            },
        ],
    },
    groups: [
        {
            fields: [
                {
                    events: [
                    {
                        event: () => {},
                        name: 'onBlur',
                    },
                    ],
                    label: 'Project title',
                    name: FormInputNames.projectTitle,
                    placeholder: 'Enter a descriptive title',
                    type: 'text',
                },
            ],
            instructions: 'Enter a title for your website bug hunt project.',
            title: 'Project Title',
        },
        {
            fields: [
                {
                    events: [
                        {
                            event: () => {},
                            name: 'onBlur',
                        },
                    ],
                    label: 'Website URL',
                    name: FormInputNames.websiteURL,
                    placeholder: 'Enter a descriptive title',
                    type: 'text',
                },
            ],
            instructions: 'Enter a title for your website bug hunt project.',
            title: 'Website URL',
        },
        {
            fields: [
                {
                    events: [
                        {
                            event: () => {},
                            name: 'onBlur',
                        },
                    ],
                    label: 'Project title',
                    name: FormInputNames.bugHuntGoals,
                    placeholder: 'Describe your goal',
                    type: 'textarea',
                },
            ],
            instructions: `
                Do you have any specific goals for your website bug hunt? </br>
                For example: find bugs in my online shopping experience
            `,
            title: 'Bug Hunt Goals',
        },
        {
            fields: [
                {
                    events: [
                    {
                        event: () => {},
                        name: 'onBlur',
                    },
                    ],
                    label: 'Features to test (optional)',
                    name: FormInputNames.featuresToTest,
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
            fields: [
                {
                    name: FormInputNames.deliveryType,
                    notTabbable: false,
                    options: [
                        {
                            checked: false,
                            children: <BugDeliveryCheckbox name={'GitHub'} />,
                            id: 'github',
                        },
                        {
                            checked: false,
                            children: <BugDeliveryCheckbox name={'GitLab'} />,
                            id: 'gitlab',
                        },
                    ],
                    type: 'radio',
                    value: 'gitlab',
                },
                {
                    events: [
                        {
                            event: () => {},
                            name: 'onBlur',
                        },
                    ],
                    label: 'Repository Link (Optional)',
                    name: FormInputNames.repositoryLink,
                    placeholder: 'www.example-share-link.com',
                    type: 'text',
                },
            ],
            instructions: 'How do you want your bugs delivered?',
            title: 'Bug Delivery',
        },
    ],
}
