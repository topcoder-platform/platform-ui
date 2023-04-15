import type { Meta, StoryObj } from '@storybook/react'

import { IconSolid } from '../../svgs'

import IconButton from './IconButton'

const meta: Meta<typeof IconButton> = {
    argTypes: {
        icon: {
            control: undefined,
        },
        onClick: { action: 'clicked' },
    },
    component: IconButton,
    tags: ['autodocs'],
    title: 'Button With Icon',
}

export default meta

type Story = StoryObj<typeof IconButton>;

export const LeftIcon: Story = {
    args: {
        icon: IconSolid.ArrowLeftIcon,
        label: 'Button',
        primary: true,
    },
}
export const RightIcon: Story = {
    args: {
        icon: IconSolid.ArrowRightIcon,
        iconToRight: true,
        label: 'Button',
        primary: true,
    },
}
export const OnlyIcon: Story = {
    args: {
        icon: IconSolid.CheckIcon,
        primary: true,
    },
}
