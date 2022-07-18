
import { ReactComponent as BackIcon } from '../../../../../../src/assets/images/icon-back-arrow.svg'
import { FormDefinition, GithubIcon, GitlabIcon, RadioButton } from '../../../../../lib'

export enum FormInputNames {
    title = 'projectTitle',
    features = 'featuresToTest',
    goals = 'bugHuntGoals',
    deliveryType = 'deliveryType',
    packageType = 'packageType',
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
            inputs: [
                {
                    events: [
                    {
                        event: () => {},
                        name: 'onBlur',
                    },
                    ],
                    label: 'Project title',
                    name: FormInputNames.title,
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
            inputs: [
                {
                    events: [
                        {
                            event: () => {},
                            name: 'onBlur',
                        },
                    ],
                    label: 'Project title',
                    name: FormInputNames.goals,
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
                    name: FormInputNames.deliveryType,
                    notTabbable: false,
                    options: [
                        {
                            checked: false,
                            children: <RadioButton name={'GitHub'} icon={<GithubIcon />} />,
                            id: 'github',
                        },
                        {
                            checked: false,
                            children: <RadioButton name={'GitLab'} icon={<GitlabIcon />} />,
                            id: 'gitlab',
                        },
                    ],
                    type: 'radio',
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
        {
            inputs: [
                {
                    cards: [
                        {
                            id: 'standard',
                            price: 1499,
                            sections: [
                                {
                                    rows: [
                                        {
                                            icon: 'clock',
                                            label: 'Hunt Duration',
                                            text: 'Up to 24h',
                                        },
                                        {
                                            icon: 'exclamation',
                                            label: 'Number of Bugs',
                                            text: 'Up to 50',
                                        },
                                        {
                                            icon: 'user-group',
                                            label: 'Potential Testers',
                                            text: 'Up to 10',
                                        },
                                    ],
                                },
                                {
                                    rows: [
                                        {
                                            label: 'Form Factor',
                                        },
                                        {
                                            icon: 'desktop-computer',
                                            label: 'Desktop Testing',
                                            text: 'Yes',
                                        },
                                        {
                                            icon: 'device-mobile',
                                            label: 'Mobile Testing',
                                            text: '-',
                                        },
                                        {
                                            icon: 'device-tablet',
                                            label: 'Tablet Testing',
                                            text: '-',
                                        },
                                    ],
                                },
                                {
                                    rows: [
                                        {
                                            icon: 'check',
                                            text: 'Latest Browser Testing',
                                        },
                                        {
                                            icon: 'check',
                                            text: 'Detailed Bug Reporting',
                                        },
                                        {
                                            icon: 'check',
                                            text: 'Expert Verification',
                                        },
                                    ],
                                },
                            ],
                            title: 'Standard',
                        },
                        {
                            id: 'advanced',
                            price: 1899,
                            sections: [
                                {
                                    rows: [
                                        {
                                            icon: 'clock',
                                            label: 'Hunt Duration',
                                            text: 'Up to 48h',
                                        },
                                        {
                                            icon: 'exclamation',
                                            label: 'Number of Bugs',
                                            text: 'Up to 100',
                                        },
                                        {
                                            icon: 'user-group',
                                            label: 'Potential Testers',
                                            text: 'Up to 25',
                                        },
                                    ],
                                },
                                {
                                    rows: [
                                        {
                                            label: 'Form Factor',
                                        },
                                        {
                                            icon: 'desktop-computer',
                                            label: 'Desktop Testing',
                                            text: 'Yes',
                                        },
                                        {
                                            icon: 'device-mobile',
                                            label: 'Mobile Testing',
                                            text: 'Yes',
                                        },
                                        {
                                            icon: 'device-tablet',
                                            label: 'Tablet Testing',
                                            text: '-',
                                        },
                                    ],
                                },
                                {
                                    rows: [
                                        {
                                            icon: 'check',
                                            text: 'Latest Browser Testing',
                                        },
                                        {
                                            icon: 'check',
                                            text: 'Detailed Bug Reporting',
                                        },
                                        {
                                            icon: 'check',
                                            text: 'Expert Verification',
                                        },
                                    ],
                                },
                            ],
                            title: 'Advanced',
                        },
                        {
                            id: 'premium',
                            price: 2299,
                            sections: [
                                {
                                    rows: [
                                        {
                                            icon: 'clock',
                                            label: 'Hunt Duration',
                                            text: 'Up to 72h',
                                        },
                                        {
                                            icon: 'exclamation',
                                            label: 'Number of Bugs',
                                            text: 'Up to 200',
                                        },
                                        {
                                            icon: 'user-group',
                                            label: 'Potential Testers',
                                            text: 'Up to 50',
                                        },
                                    ],
                                },
                                {
                                    rows: [
                                        {
                                            label: 'Form Factor',
                                        },
                                        {
                                            icon: 'desktop-computer',
                                            label: 'Desktop Testing',
                                            text: 'Yes',
                                        },
                                        {
                                            icon: 'device-mobile',
                                            label: 'Mobile Testing',
                                            text: 'Yes',
                                        },
                                        {
                                            icon: 'device-tablet',
                                            label: 'Tablet Testing',
                                            text: 'Yes',
                                        },
                                    ],
                                },
                                {
                                    rows: [
                                        {
                                            icon: 'check',
                                            text: 'Latest Browser Testing',
                                        },
                                        {
                                            icon: 'check',
                                            text: 'Detailed Bug Reporting',
                                        },
                                        {
                                            icon: 'check',
                                            text: 'Expert Verification',
                                        },
                                    ],
                                },
                            ],
                            title: 'Premium',
                        },
                    ],
                    name: FormInputNames.packageType,
                    notTabbable: false,
                    type: 'card-set',
                },
            ],
            instructions: 'Select your bug hunt package.',
            title: 'Bug Hunt Package',
        },
    ],
}
