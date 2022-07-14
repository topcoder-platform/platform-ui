
import { ReactComponent as BackIcon } from '../../../../../../src/assets/images/icon-back-arrow.svg'
import { FormDefinition } from '../../../../../lib'

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
                type: 'button',
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
            inputs: [
                {
                    events: [
                    {
                        event: () => {},
                        name: 'onBlur',
                    },
                    ],
                    label: 'Project title',
                    name: 'Project title',
                    placeholder: 'Enter a descriptive title',
                    type: 'text',
                },
            ],
            instructions: 'Enter a title for your website bug hunt project.',
            title: 'Project Title',
        },
        {
            inputs: [
                {
                    events: [
                        {
                            event: () => {},
                            name: 'onBlur',
                        },
                    ],
                    label: 'Project title',
                    name: 'Project title',
                    placeholder: 'Enter a descriptive title',
                    type: 'text',
                },
            ],
            instructions: 'Enter a title for your website bug hunt project.',
            title: 'Website URL',
        },
        {
            inputs: [
                {
                    events: [
                        {
                            event: () => {},
                            name: 'onBlur',
                        },
                    ],
                    label: 'Project title',
                    name: 'bug-hunt-goals',
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
            inputs: [
                {
                    events: [
                    {
                        event: () => {},
                        name: 'onBlur',
                    },
                    ],
                    label: 'Features to test (optional)',
                    name: 'bug-hunt-goals',
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
                    name: 'delivery-type',
                    notTabbable: false,
                    options: [
                        {
                            checked: false,
                            children: <div>Option 1</div>,
                            id: 'github',
                        },
                        {
                            checked: false,
                            children: <div>Option 2</div>,
                            id: 'gitlab',
                        },
                    ],
                    type: 'checkbox',
                    value: 'github',
                },
                {
                    events: [
                        {
                            event: () => {},
                            name: 'onBlur',
                        },
                    ],
                    label: 'Repository Link (Optional)',
                    name: 'repository-link',
                    placeholder: 'www.example-share-link.com',
                    type: 'text',
                },
            ],
            instructions: 'How do you want your bugs delivered?',
            title: 'Bug Delivery',
        },
    ],
}