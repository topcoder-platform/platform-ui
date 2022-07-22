
import { ReactComponent as BackIcon } from '../../../../../../src/assets/images/icon-back-arrow.svg'
import { FormDefinition, GithubIcon, GitlabIcon, RadioButton, validatorRequired } from '../../../../../lib'
import { ChallengeMetadataName, ChallengeMetadataTitle } from '../../../work-lib'
import { SupportInfoCard } from '../support-info-card'

export const BugHuntFormConfig: FormDefinition = {
    buttons: {
        primaryGroup: [
            {
                buttonStyle: 'secondary',
                label: 'Save for later',
                onClick: () => { },
                type: 'submit',
            },
            {
                buttonStyle: 'primary',
                isSubmit: true,
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
                    name: ChallengeMetadataName.projectTitle,
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
            title: ChallengeMetadataTitle.projectTitle,
        },
        {
            inputs: [
                {
                    hideInlineErrors: true,
                    label: 'Website URL',
                    name: ChallengeMetadataName.websiteURL,
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
            title: ChallengeMetadataTitle.websiteURL,
        },
        {
            inputs: [
                {
                    hideInlineErrors: true,
                    label: 'Bug hunt goals',
                    name: ChallengeMetadataName.goals,
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
            title: ChallengeMetadataTitle.bugHuntGoals,
        },
        {
            inputs: [
                {
                    label: 'Features to test (optional)',
                    name: ChallengeMetadataName.featuresToTest,
                    placeholder: 'List the specific features',
                    type: 'textarea',
                },
            ],
            instructions: `
                Are there specific features we should focus on testing? </br>
                For example: [An example not used above]
            `,
            title: ChallengeMetadataTitle.featuresToTest,
        },
        {
            inputs: [
                {
                    hideInlineErrors: true,
                    name: ChallengeMetadataName.deliveryType,
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
                    name: ChallengeMetadataName.repositoryLink,
                    placeholder: 'www.example-share-link.com',
                    type: 'text',
                },
            ],
            instructions: 'How do you want your bugs delivered?',
            title: ChallengeMetadataTitle.bugDeliveryType,
        },
        {
            inputs: [
                {
                    label: 'Additional information (optional)',
                    name: ChallengeMetadataName.additionalInformation,
                    placeholder: '[Suggestion text]',
                    type: 'textarea',
                },
            ],
            instructions: `
                Is there anything else we should know about testing your website?
            `,
            title: ChallengeMetadataTitle.additionalInformation,
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
                    name: ChallengeMetadataName.packageType,
                    notTabbable: false,
                    type: 'card-set',
                },
            ],
            instructions: 'Select your bug hunt package.',
            title: ChallengeMetadataTitle.bugHuntPackage,
        },
        {
            element: <SupportInfoCard />,
        },
    ],
}
