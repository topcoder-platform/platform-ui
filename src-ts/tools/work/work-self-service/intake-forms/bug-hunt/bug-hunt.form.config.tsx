
import { ReactComponent as BackIcon } from '../../../../../../src/assets/images/icon-back-arrow.svg'
import { FormDefinition } from '../../../../../lib'

export const BugHuntFormConfig: FormDefinition = {
    buttons: {
        left: [
            {
                buttonStyle: 'icon',
                icon: BackIcon,
                onClick: () => {},
                type: 'button',
            },
        ],
        right: [
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
    },
    groups: [
        {
            description: 'Enter a title for your website bug hunt project.',
            fields: [
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
            title: 'Project Title',
        },
        {
            description: 'Enter a title for your website bug hunt project.',
            fields: [
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
            title: 'Website URL',
        },
        {
            description: `
                Do you have any specific goals for your website bug hunt? </br>
                For example: find bugs in my online shopping experience
            `,
            fields: [
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
            title: 'Bug Hunt Goals',
        },
        {
            description: `
                Are there specific features we should focus on testing? </br>
                For example: [An example not used above]
            `,
            fields: [
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
            title: 'Features to test',
        },
        {
            description: 'How do you want your bugs delivered?',
            fields: [
                {
                    name: 'delivery-type',
                    notTabbable: false,
                    onChange: () => {},
                    options: [
                        {
                            checked: false,
                            children: () => (<div>Option 1</div>),
                            id: 'github',
                        },
                        {
                            checked: false,
                            children: () => (<div>Option 2</div>),
                            id: 'gitlab',
                        },
                    ],
                    type: 'checkbox',
                    value: true,
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
            title: 'Bug Delivery',
        },
    ],
}
