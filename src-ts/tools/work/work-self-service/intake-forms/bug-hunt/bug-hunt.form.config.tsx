import {
    BackArrowIcon,
    FormDefinition,
    GithubIcon,
    GitlabIcon,
    RadioButton,
    validatorRequired,
} from '../../../../../lib'
import { ChallengeMetadataName, ChallengeMetadataTitle } from '../../../work-lib'
import { SupportInfoCard } from '../support-info-card'

import BugHuntPricingConfig from './bug-hunt.form.pricing-config'

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
                buttonStyle: 'icon-bordered',
                icon: BackArrowIcon,
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
                    placeholder: 'www.example-share-link.com',
                    type: 'text',
                    validators: [
                        {
                            validator: validatorRequired,
                        },
                    ],
                },
            ],
            instructions: 'Provide the URL to your website.',
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
                For example: I want the new navigation menu to be tested to ensure all navigation works properly.
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
                            children: <RadioButton name="GitHub" icon={<GithubIcon />} isRecommended />,
                            id: 'GitHub',
                        },
                        {
                            checked: false,
                            children: <RadioButton name="GitLab" icon={<GitlabIcon />} />,
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
                    label: 'Repository Link (optional)',
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
                    placeholder: 'Describe additional information',
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
                    cards: BugHuntPricingConfig,
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
