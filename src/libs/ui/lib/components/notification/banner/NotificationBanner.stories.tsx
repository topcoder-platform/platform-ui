import { Meta, StoryObj } from '@storybook/react'

import NotificationBanner from './NotificationBanner'

const meta: Meta<typeof NotificationBanner> = {
    argTypes: {
        content: {
            description: 'Content displayed inside the tooltip',
        },
        persistent: {
            defaultValue: false,
            description: 'Set to true to allow clicks inside the tooltip',
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
        content: 'Help tooltip',
    },
}
