import { FC } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { IconSolid } from '../svgs'

import { IconButtonProps } from './icon-button'
import { BaseButtonProps } from './base-button'
import Button, { ButtonProps } from './Button'

const categories: any = {
    actions: { table: { category: 'Action' } },
    content: { table: { category: 'Content' } },
    icon: { table: { category: 'Icon' } },
    layout: { table: { category: 'Layout' } },
    state: { table: { category: 'State' } },
    variation: { table: { category: 'Variation' } },
}

const meta: Meta<FC<ButtonProps & IconButtonProps & BaseButtonProps>> = {
    argTypes: {
        children: categories.content,
        className: categories.layout,
        disabled: categories.state,
        fullWidth: categories.layout,
        icon: categories.icon,
        iconToLeft: categories.icon,
        iconToRight: categories.icon,
        label: categories.content,
        link: categories.variation,
        loading: categories.state,
        negative: categories.variation,
        onClick: { action: 'clicked', ...categories.actions },
        primary: categories.variation,
        secondary: categories.variation,
        size: categories.layout,
        variant: categories.variation,
    },
    component: Button,
    // excludeStories: /.*Size$/,
    // tags: ['autodocs'],
    title: 'Components/Button',
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

export const Link: Story = {
    args: {
        label: 'Link Button',
        link: true,
    },
}

export const PrimarySmSize: Story = {
    args: {
        label: 'Small (sm) Button',
        primary: true,
        size: 'sm',
    },
    parameters: {
        status: { type: 'hidden' },
    },
}
export const PrimaryMdSize: Story = {
    args: {
        label: 'Medium (md) Button',
        primary: true,
        size: 'md',
    },
}
export const PrimaryLgSize: Story = {
    args: {
        label: 'Large (lg) Button',
        primary: true,
        size: 'lg',
    },
}
export const PrimaryXlSize: Story = {
    args: {
        label: 'Extra Large (xl) Button',
        primary: true,
        size: 'xl',
    },
}

export const PrimaryDanger: Story = {
    args: {
        label: 'Danger Primary Button',
        primary: true,
        variant: 'danger',
    },
}

export const PrimaryWarning: Story = {
    args: {
        label: 'Warning Primary Button',
        primary: true,
        variant: 'warning',
    },
}

export const SecondaryDanger: Story = {
    args: {
        label: 'Danger Secondary Button',
        secondary: true,
        variant: 'danger',
    },
}

export const SecondaryWarning: Story = {
    args: {
        label: 'Warning Secondary Button',
        secondary: true,
        variant: 'warning',
    },
}

export const LinkDanger: Story = {
    args: {
        label: 'Danger Link Button',
        link: true,
        variant: 'danger',
    },
}

export const LinkWarning: Story = {
    args: {
        label: 'Warning Link Button',
        link: true,
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
