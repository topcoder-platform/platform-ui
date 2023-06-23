/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { Decorator, Meta, StoryObj } from '@storybook/react'
import { PageSubheaderPortalId } from '~/config'

import '../../styles/index.scss'

import { Breadcrumb } from '.'

const meta: Meta<typeof Breadcrumb> = {
    argTypes: {
        renderInline: {
            defaultValue: 'false',
            description: 'Render the breadcrumbs inline, without the use of &lt;Portal&gt;',
        },
    },
    component: Breadcrumb,
    excludeStories: /.*Decorator$/,
    tags: ['autodocs'],
    title: 'Components/Breadcrumb',
}

export default meta

type Story = StoryObj<typeof Breadcrumb>;

const basicDecorator: Decorator = StoryComp => (
    <div>
        <div id={PageSubheaderPortalId} />
        <StoryComp />
    </div>
)

const reactRouterDecorator: Decorator = Story => (
    <MemoryRouter>
        <Routes>
            <Route path='/*' element={<Story />} />
        </Routes>
    </MemoryRouter>
)

export const Primary: Story = {
    args: {
        items: [
            {
                name: 'Home',
                url: '/',
            },
            {
                name: 'Learn',
                url: '/learn',
            },
        ],
        renderInline: true,
    },
    decorators: [basicDecorator, reactRouterDecorator],
}
