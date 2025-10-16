/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */

import { Meta, StoryObj } from '@storybook/react'

import NotificationBanner from './NotificationBanner'

const meta: Meta<typeof NotificationBanner> = {
    argTypes: {
        persistent: {
            defaultValue: false,
            description: 'Set to true to allow clicks inside the tooltip',
        },
        content: {
            description: 'Content displayed inside the tooltip',
        },
    },
    component: NotificationBanner,
    excludeStories: /.*Decorator$/,
    tags: ['autodocs'],
    title: 'Components/NotificationBanner',
}

export default meta

type Story = StoryObj<typeof NotificationBanner>;

export const Primary: Story = {
    args: {
        // children: <IconOutline.QuestionMarkCircleIcon width='35' />,
        content: 'Help tooltip',
    },
}
