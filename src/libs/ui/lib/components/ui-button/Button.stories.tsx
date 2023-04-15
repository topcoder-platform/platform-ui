import { FC } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { IconSolid } from '../svgs'

import { IconButtonProps } from './icon-button'
import { BaseButtonProps } from './base-button'
import Button, { ButtonProps } from './Button'

const meta: Meta<FC<ButtonProps & IconButtonProps & BaseButtonProps>> = {
    argTypes: {
        onClick: { action: 'clicked' },
    },
    component: Button,
    tags: ['autodocs'],
    title: 'Button',
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
export const Danger: Story = {
    args: {
        label: 'Secondary Button',
        primary: true,
        variant: 'danger',
    },
}
export const Warning: Story = {
    args: {
        label: 'Secondary Button',
        primary: true,
        variant: 'warning',
    },
}

export const WithIconLeft: Story = {
    args: {
        icon: IconSolid.ArrowLeftIcon,
        label: 'Button',
        primary: true,
    },
}
export const WithIconRight: Story = {
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
