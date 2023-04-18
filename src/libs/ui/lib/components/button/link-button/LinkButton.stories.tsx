/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable react-hooks/rules-of-hooks */
import { FC } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { Decorator, Meta, StoryObj } from '@storybook/react'

import { IconButtonProps } from '../icon-button'
import { BaseButtonProps } from '../base-button'
import { IconSolid } from '../../svgs'

import LinkButton, { LinkButtonProps } from './LinkButton'

const categories: any = {
    anchor: { table: { category: 'Anchor related props' } },
    link: { table: { category: 'Link related props' } },
}

const meta: Meta<FC<LinkButtonProps & IconButtonProps & BaseButtonProps>> = {
    argTypes: {
        download: categories.anchor,
        media: categories.anchor,
        ping: categories.anchor,
        preventScrollReset: categories.link,
        referrerPolicy: categories.anchor,
        rel: categories.anchor,
        relative: categories.link,
        reloadDocument: categories.link,
        replace: categories.link,
        state: categories.link,
        target: categories.anchor,
        to: categories.link,
    },
    component: LinkButton,
    excludeStories: /.*Decorator$/,
    title: 'Components/LinkButton',
}

export default meta

type Story = StoryObj<typeof LinkButton>;

const reactRouterDecorator: Decorator = Story => (
    <MemoryRouter>
        <Routes>
            <Route path='/*' element={<Story />} />
        </Routes>
    </MemoryRouter>
)

export const _hidden_Primary: Story = {
    args: {
        label: 'Primary Button',
        primary: true,
        to: '/test',
    },
    decorators: [reactRouterDecorator],
}

export const _hidden_Secondary: Story = {
    args: {
        label: 'Secondary Button',
        secondary: true,
        to: '/test',
    },
    decorators: [reactRouterDecorator],
}

export const _hidden_Link: Story = {
    args: {
        label: 'Link Button',
        link: true,
        to: '/test',
    },
    decorators: [reactRouterDecorator],
}

export const _hidden_ExternalLink: Story = {
    args: {
        icon: IconSolid.ExternalLinkIcon,
        iconToRight: true,
        label: 'External Link',
        link: true,
        to: 'https://www.topcoder.com',
    },
    decorators: [reactRouterDecorator],
}
