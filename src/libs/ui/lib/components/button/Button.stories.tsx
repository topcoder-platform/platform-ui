/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import { FC } from 'react'

import { Decorator, Meta, StoryObj } from '@storybook/react'

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
        light: categories.variation,
        link: categories.variation,
        loading: categories.state,
        onClick: { action: 'clicked', ...categories.actions },
        primary: categories.variation,
        secondary: categories.variation,
        size: categories.layout,
        variant: categories.variation,
    },
    component: Button,
    excludeStories: /.*Decorator$/,
    // tags: ['autodocs'],
    title: 'Components/Button',
}

export default meta

type Story = StoryObj<typeof Button>;

const LightButtonDecorator: Decorator = StoryComp => (
    <div style={{ background: 'gray', padding: '8px' }}>
        <StoryComp />
    </div>
)

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

/**
 * Button sizes
 * Hidden from the storybook sidebar
 */

export const _hidden_PrimarySmSize: Story = {
    args: {
        label: 'Small (sm) Button',
        primary: true,
        size: 'sm',
    },
    parameters: {
        status: { type: 'hidden' },
    },
}
export const _hidden_PrimaryMdSize: Story = {
    args: {
        label: 'Medium (md) Button',
        primary: true,
        size: 'md',
    },
}
export const _hidden_PrimaryLgSize: Story = {
    args: {
        label: 'Large (lg) Button',
        primary: true,
        size: 'lg',
    },
}
export const _hidden_PrimaryXlSize: Story = {
    args: {
        label: 'Extra Large (xl) Button',
        primary: true,
        size: 'xl',
    },
}

/**
 * Button Variants
 * Hidden from the storybook sidebar
 */

export const _hidden_LightPrimary: Story = {
    args: {
        label: 'Light Primary Button',
        light: true,
        primary: true,
    },
    decorators: [LightButtonDecorator],
}

export const _hidden_LightSecondary: Story = {
    args: {
        label: 'Light Secondary Button',
        light: true,
        secondary: true,
    },
    decorators: [LightButtonDecorator],
}

export const _hidden_LightLink: Story = {
    args: {
        label: 'Light Link Button',
        light: true,
        link: true,
    },
    decorators: [LightButtonDecorator],
}

export const _hidden_PrimaryDanger: Story = {
    args: {
        label: 'Danger Primary Button',
        primary: true,
        variant: 'danger',
    },
}

export const _hidden_SecondaryDanger: Story = {
    args: {
        label: 'Danger Secondary Button',
        secondary: true,
        variant: 'danger',
    },
}

export const _hidden_LinkDanger: Story = {
    args: {
        label: 'Danger Link Button',
        link: true,
        variant: 'danger',
    },
}
