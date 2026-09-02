/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render } from '@testing-library/react'

import {
    MAX_SUPPORT_ATTACHMENT_BYTES,
    SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES,
    uploadSupportAttachment,
} from '../../services'
import { SupportMarkdownEditor } from './SupportMarkdownEditor'

let mockEditorProps: {
    acceptedUploadTypes?: readonly string[]
    maxUploadSize?: number
    uploadAttachment?: typeof uploadSupportAttachment
} = {}

jest.mock('~/apps/review/src/lib/components/FieldMarkdownEditor', () => ({
    FieldMarkdownEditor: (props: typeof mockEditorProps): JSX.Element => {
        mockEditorProps = props
        return <div data-testid='field-markdown-editor' />
    },
}), { virtual: true })

jest.mock('../../services', () => ({
    MAX_SUPPORT_ATTACHMENT_BYTES: 2 * 1024 * 1024,
    SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES: ['.png', 'image/png'],
    uploadSupportAttachment: jest.fn(),
}))

const mockedUpload = uploadSupportAttachment as jest.MockedFunction<typeof uploadSupportAttachment>

describe('SupportMarkdownEditor', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockEditorProps = {}
        mockedUpload.mockResolvedValue({
            filename: 'screenshot.png',
            handle: 'hosted-handle',
            url: 'https://cdn.filestackcontent.com/hosted-handle',
        })
    })

    it('delegates to the Support uploader and exposes its two-megabyte limit', async () => {
        render(
            <SupportMarkdownEditor
                editorId='support-reply'
                label='Reply'
                onChange={jest.fn()}
                value=''
            />,
        )
        const file = new File(['image'], 'screenshot.png', { type: 'image/png' })
        const onProgress = jest.fn()

        await mockEditorProps.uploadAttachment?.(file, { onProgress })

        expect(mockEditorProps.maxUploadSize)
            .toBe(MAX_SUPPORT_ATTACHMENT_BYTES)
        expect(mockEditorProps.acceptedUploadTypes)
            .toBe(SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES)
        expect(mockedUpload)
            .toHaveBeenCalledWith(file, { onProgress })
    })
})
