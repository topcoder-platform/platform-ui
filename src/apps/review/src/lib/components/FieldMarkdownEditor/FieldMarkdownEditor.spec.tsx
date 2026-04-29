/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, waitFor } from '@testing-library/react'

import { FieldMarkdownEditor } from './FieldMarkdownEditor'

const mockEasyMDEInstances: any[] = []

jest.mock('~/apps/admin/src/lib/hooks', () => {
    const React: typeof import('react') = jest.requireActual('react')

    return {
        useOnComponentDidMount: (onMounted: () => void): void => {
            React.useEffect(() => {
                onMounted()
            }, [])
        },
    }
}, { virtual: true })

jest.mock('../../contexts', () => {
    const React: typeof import('react') = jest.requireActual('react')

    return {
        ChallengeDetailContext: React.createContext({
            challengeId: 'challenge-id',
        }),
    }
})

jest.mock('../../services', () => ({
    uploadReviewAttachment: jest.fn(),
}))

jest.mock('../../utils', () => ({
    humanFileSize: jest.fn(() => '1 KB'),
}))

jest.mock('easymde', () => {
    class EasyMDEMock {
        constructor(options: any) {
            const wrapper = globalThis.document.createElement('div')
            wrapper.appendChild(globalThis.document.createElement('div'))

            let editorValue = options.initialValue ?? ''
            const imageInput = { value: '' }
            const codemirror = {
                focus: jest.fn(),
                getCursor: jest.fn(() => ({
                    ch: 0,
                    line: 0,
                })),
                getLine: jest.fn(() => ''),
                getSelection: jest.fn(() => ''),
                getTokenAt: jest.fn(() => ({
                    type: '',
                })),
                getValue: jest.fn(() => editorValue),
                getWrapperElement: jest.fn(() => wrapper),
                indexFromPos: jest.fn(() => 0),
                on: jest.fn(),
                replaceRange: jest.fn(),
                replaceSelection: jest.fn(),
                setOption: jest.fn(),
                setSelection: jest.fn(),
            }
            Object.assign(this, {
                codemirror,
                gui: {
                    toolbar: {
                        getElementsByClassName: jest.fn(() => [imageInput]),
                    },
                },
                options,
                updateStatusBar: jest.fn(),
                value: jest.fn((incomingValue?: string) => {
                    if (incomingValue === undefined) {
                        return editorValue
                    }

                    editorValue = incomingValue
                    return undefined
                }),
            })

            mockEasyMDEInstances.push(this)
        }
    }

    Object.assign(EasyMDEMock, {
        drawImage: jest.fn(),
        drawLink: jest.fn(),
        drawTable: jest.fn(),
        drawUploadedImage: jest.fn(),
        toggleBlockquote: jest.fn(),
        toggleCodeBlock: jest.fn(),
        toggleHeading1: jest.fn(),
        toggleHeading2: jest.fn(),
        toggleHeading3: jest.fn(),
        toggleOrderedList: jest.fn(),
        toggleStrikethrough: jest.fn(),
        toggleUnorderedList: jest.fn(),
    })

    return {
        __esModule: true,
        default: EasyMDEMock,
    }
})

describe('FieldMarkdownEditor', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockEasyMDEInstances.length = 0
    })

    it('uses the latest read-only state for the EasyMDE upload callback', async () => {
        const uploadAttachment = jest.fn()
            .mockResolvedValue({
                url: 'https://example.com/uploaded.png',
            })

        const rendered: ReturnType<typeof render> = render(
            <FieldMarkdownEditor uploadAttachment={uploadAttachment} />,
        )

        await waitFor(() => {
            expect(mockEasyMDEInstances)
                .toHaveLength(1)
        })

        const easyMDE = mockEasyMDEInstances[0]
        rendered.rerender(
            <FieldMarkdownEditor
                readOnly
                uploadAttachment={uploadAttachment}
            />,
        )

        await easyMDE.options.imageUploadFunction(
            new File(['image'], 'uploaded.png', { type: 'image/png' }),
        )

        expect(uploadAttachment)
            .not
            .toHaveBeenCalled()
    })

    it('installs EasyMDE upload handlers so editable transitions can upload', async () => {
        render(<FieldMarkdownEditor readOnly />)

        await waitFor(() => {
            expect(mockEasyMDEInstances)
                .toHaveLength(1)
        })

        expect(mockEasyMDEInstances[0].options.uploadImage)
            .toBe(true)
    })
})
