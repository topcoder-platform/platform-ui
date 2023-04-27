import { Meta, StoryObj } from '@storybook/react'

import { LoadingSpinner } from '.'

const meta: Meta<typeof LoadingSpinner> = {
    component: LoadingSpinner,
    excludeStories: /.*Decorator$/,
    // tags: ['autodocs'],
    title: 'Components/LoadingSpinner',
}

export default meta

type Story = StoryObj<typeof LoadingSpinner>;

export const Normal: Story = {
    args: {},
}

export const Overlay: Story = {
    args: {
        overlay: true,
    },
}
