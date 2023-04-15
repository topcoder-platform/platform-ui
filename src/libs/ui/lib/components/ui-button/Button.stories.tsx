import type { Meta, StoryObj } from '@storybook/react'

import Button from './Button'

const meta: Meta<typeof Button> = {
    argTypes: {
        onClick: { action: 'clicked' },
    },
    component: Button,
    tags: ['autodocs'],
    title: 'Simple Button',
}

export default meta

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    args: {
        label: 'Primary Button',
        primary: true,
    },
}

export const Secondary: Story = {
    args: {
        label: 'Secondary Button',
        secondary: true,
    },
}
