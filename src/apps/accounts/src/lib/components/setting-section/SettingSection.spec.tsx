/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { RenderResult } from '@testing-library/react'
import { render, screen } from '@testing-library/react'

import SettingSection from './SettingSection'

describe('SettingSection', () => {
    it('renders user-provided information as text instead of HTML', () => {
        const unsafeInfo: string = '<img src="invalid" onerror="alert(1)">'
        const view: RenderResult = render(
            <SettingSection title='Software' infoText={unsafeInfo} />,
        )

        expect(screen.getByText(unsafeInfo))
            .toBeInTheDocument()
        expect(view.container.querySelector('img'))
            .not
            .toBeInTheDocument()
    })
})
