/**
 * Field Markdown Editor.
 */
import { FC, useCallback, useContext, useEffect, useRef, useState } from 'react'
import _ from 'lodash'
import CodeMirror, { EditorChangeCancellable } from 'codemirror'
import EasyMDE from 'easymde'
import classNames from 'classnames'
import 'easymde/dist/easymde.min.css'

import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'

import {
    IconBold,
    IconCode,
    IconHeading1,
    IconHeading2,
    IconHeading3,
    IconImage,
    IconItalic,
    IconLink,
    IconMentions,
    IconOrderedList,
    IconQuote,
    IconStrikethrough,
    IconTable,
    IconUnorderedList,
    IconUploadFile,
} from '../../assets/icons'
import { humanFileSize } from '../../utils'
import { ChallengeDetailContext } from '../../contexts'
import type { ChallengeDetailContextModel } from '../../models'
import { uploadReviewAttachment } from '../../services'

import styles from './FieldMarkdownEditor.module.scss'

interface Props {
    className?: string
    placeholder?: string
    initialValue?: string
    onChange?: (value: string) => void
    onBlur?: () => void
    error?: string
    showBorder?: boolean
    disabled?: boolean
    uploadCategory?: string
    maxCharactersAllowed?: number
}
const errorMessages = {
    fileTooLarge:
        'Uploading #image_name# was failed. The file is too big (#image_size#).\n'
        + 'Maximum file size is #image_max_size#.',
    importError:
        'Uploading #image_name# was failed. Something went wrong when uploading the file.',
    noFileGiven: 'Select a file.',
    typeNotAllowed:
        'Uploading #image_name# was failed. The file type (#image_type#) is not supported.',
}
const maxUploadSize = 40 * 1024 * 1024
const imageExtensions = ['gif', 'png', 'jpeg', 'jpg', 'bmp', 'svg']
const allowedImageExtensions = [
    ...imageExtensions,
    ...imageExtensions.map(key => `image/${key}`),
]
const allowedOtherExtensions = [
    'application/zip',
    'zip',
    'application/octet-stream',
    'application/x-zip-compressed',
    'multipart/x-zip',
    'text/plain',
    'txt',
    'mov',
    'video/mpeg',
    'mp4',
    'video/mp4',
    'webm',
    'video/webm',
    'doc',
    'docx',
    'pdf',
    'application/pdf',
    'csv',
    'text/csv',
    'htm',
    'html',
    'text/html',
    'js',
    'json',
    'application/json',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'xls',
    'xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt',
    'application/vnd.ms-powerpoint',
    'pptx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

const stateStrategy = {
    atom: (ret: any) => {
        ret.quote = true
    },
    comment: (ret: any) => {
        ret.code = true
    },
    em: (ret: any) => {
        ret.italic = true
    },
    link: (ret: any) => {
        ret.link = true
    },
    quote: (ret: any) => {
        ret.quote = true
    },
    strikethrough: (ret: any) => {
        ret.strikethrough = true
    },
    strong: (ret: any) => {
        ret.bold = true
    },
    tag: (ret: any) => {
        ret.image = true
    },
}

const toggleStrategy = {
    bold: (start: any, end: any) => {
        const startType = start.replace(/(\*\*|__)(?![\s\S]*(\*\*|__))/, '')
        const endType = end.replace(/(\*\*|__)/, '')
        return { endType, startType }
    },
    italic: (start: any, end: any) => {
        const startType = start.replace(/(\*|_)(?![\s\S]*(\*|_))/, '')
        const endType = end.replace(/(\*|_)/g, '')
        return { endType, startType }
    },
    strikethrough: (start: any, end: any) => {
        const startType = start.replace(/(\*\*|~~)(?![\s\S]*(\*\*|~~))/, '')
        const endType = end.replace(/(\*\*|~~)/, '')
        return { endType, startType }
    },
}

type CodeMirrorType = keyof typeof stateStrategy | 'variable-2'

export const FieldMarkdownEditor: FC<Props> = (props: Props) => {
    const elementRef = useRef<HTMLTextAreaElement>(null)
    const easyMDE = useRef<any>(null)
    const [remainingCharacters, setRemainingCharacters] = useState(
        (props.maxCharactersAllowed || 0) - (props.initialValue?.length || 0),
    )
    const { challengeId }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const uploadCategory: string = props.uploadCategory ?? 'general'

    /**
     * The state of CodeMirror at the given position.
     */
    const getState = useCallback(
        (cm: CodeMirror.Editor, posInput?: CodeMirror.Position | undefined) => {
            const pos = posInput || cm.getCursor('start')
            const stat = cm.getTokenAt(pos)
            if (!stat.type) return {}

            const types = stat.type.split(' ')

            const ret: any = {}

            let data: CodeMirrorType
            let text
            for (let i = 0; i < types.length; i++) {
                data = types[i] as CodeMirrorType
                if (data === 'variable-2') {
                    text = cm.getLine(pos.line)
                    if (/^\s*\d+\.\s/.test(text)) {
                        ret['ordered-list'] = true
                    } else {
                        ret['unordered-list'] = true
                    }
                } else if (data.match(/^header(-[1-6])?$/)) {
                    ret[data.replace('header', 'heading')] = true
                } else if (data in stateStrategy) {
                    stateStrategy[data](ret)
                }
            }

            return ret
        },
        [],
    )

    /**
     * Handle toggle block
     */
    const toggleBlock = useCallback(
        (editor: any, type: string, startChars: any, endCharsInput?: any) => {
            if (
                /editor-preview-active/.test(
                    editor.codemirror.getWrapperElement().lastChild.className,
                )
            ) {
                return
            }

            const endChars = typeof endCharsInput === 'undefined' ? startChars : endCharsInput
            const cm = editor.codemirror
            const stat = getState(cm)

            let text = ''
            let start = startChars
            let end = endChars

            const startPoint = cm.getCursor('start')
            const endPoint = cm.getCursor('end')

            if (stat[type]) {
                text = cm.getLine(startPoint.line)
                start = text.slice(0, startPoint.ch)
                end = text.slice(startPoint.ch)
                toggleStrategy[type as keyof typeof toggleStrategy](start, end)

                cm.replaceRange(
                    start + end,
                    {
                        ch: 0,
                        line: startPoint.line,
                    },
                    {
                        ch: 99999999999999,
                        line: startPoint.line,
                    },
                )

                if (type === 'bold' || type === 'strikethrough') {
                    startPoint.ch -= 2
                    if (startPoint !== endPoint) {
                        endPoint.ch -= 2
                    }
                } else if (type === 'italic') {
                    startPoint.ch -= 1
                    if (startPoint !== endPoint) {
                        endPoint.ch -= 1
                    }
                }
            } else {
                text = cm.getSelection()
                let trimText = text.trim()
                let lastSpaces = ''
                for (let i = trimText.length; i < text.length; i++) {
                    lastSpaces += text[i]
                }

                if (type === 'bold') {
                    trimText = trimText.split('**')
                        .join('')
                } else if (type === 'italic') {
                    trimText = trimText.split('*')
                        .join('')
                } else if (type === 'strikethrough') {
                    trimText = trimText.split('~~')
                        .join('')
                }

                cm.replaceSelection(start + trimText + end + lastSpaces)

                startPoint.ch += startChars.length
                endPoint.ch = startPoint.ch + text.length
            }

            cm.setSelection(startPoint, endPoint)
            cm.focus()
        },
        [getState],
    )

    /**
     *  Show hint after '@'
     */
    const completeAfter = useCallback((cm: CodeMirror.Editor) => {
        if (!cm.state.completionActive) {
            if (cm.getCursor().ch === 0) {
                cm.replaceSelection('@')
            } else {
                const from = {
                    ch: 0,
                    line: cm.getCursor().line,
                }
                const to = cm.getCursor()
                const line = cm.getRange(from, to)
                const lastIndexOf = line.lastIndexOf(' ')
                const tokenIndex = lastIndexOf > -1 ? lastIndexOf + 1 : 0
                cm.replaceRange('@', {
                    ch: tokenIndex,
                    line: cm.getCursor().line,
                })
            }
        }

        return CodeMirror.Pass
    }, [])

    /**
     * Update file tag
     */
    const updateFileTag = useCallback(
        (cm: CodeMirror.Editor, position: any, startEnd: any, data: any) => {
            if (
                /editor-preview-active/.test(
                    (cm.getWrapperElement()?.lastChild as any)?.className,
                )
            ) {
                return
            }

            let start = startEnd[0]
            let end = startEnd[1]
            const startPoint: any = {}
            const endPoint: any = {}
            if (data && (data.url || data.name)) {
                start = start.replace('#name#', data.name) // url is in start for upload-image
                start = start.replace('#url#', data.url) // url is in start for upload-image
                end = end.replace('#name#', data.name)
                end = end.replace('#url#', data.url)
            }

            Object.assign(startPoint, {
                ch: position.start.ch,
                line: position.start.line,
            })
            Object.assign(endPoint, {
                ch: position.end.ch,
                line: position.end.line,
            })
            cm.replaceRange(start + end, startPoint, endPoint)

            const selectionPosition = {
                ch: start.length + end.length,
                line: position.start.line,
            }
            cm.setSelection(selectionPosition, selectionPosition)
            cm.focus()
        },
        [],
    )

    /**
     * After file uploaded
     */
    const afterFileUploaded = useCallback((jsonData: any, position: any) => {
        const editor = easyMDE.current
        const cm = editor.codemirror
        const options = editor.options
        const imageName = jsonData.name
        const ext = imageName.substring(imageName.lastIndexOf('.') + 1)

        // Check if file type is an image
        if (allowedImageExtensions.includes(ext)) {
            updateFileTag(
                cm,
                position,
                options.insertTexts.uploadedImage,
                jsonData,
            )
        } else {
            updateFileTag(
                cm,
                position,
                options.insertTexts.uploadedFile,
                jsonData,
            )
        }

        // show uploaded image filename for 1000ms
        editor.updateStatusBar(
            'upload-image',
            editor.options.imageTexts.sbOnUploaded.replace(
                '#image_name#',
                imageName,
            ),
        )
        setTimeout(() => {
            editor.updateStatusBar(
                'upload-image',
                editor.options.imageTexts.sbInit,
            )
        }, 1000)
    }, [updateFileTag])

    /**
     * Reset file input
     */
    const resetFileInput = useCallback(() => {
        const imageInput
            = easyMDE.current.gui.toolbar.getElementsByClassName('imageInput')[0]
        imageInput.value = ''
    }, [])

    /**
     * Replace selection
     */
    const replaceSelection = useCallback(
        (
            cm: CodeMirror.Editor,
            active: boolean,
            startEnd: string[],
            data: any,
            onPosition: any,
        ) => {
            if (
                /editor-preview-active/.test(
                    (cm.getWrapperElement()?.lastChild as any)?.className,
                )
            ) {
                return
            }

            let text
            let start = startEnd[0]
            let end = startEnd[1]
            const startPoint: any = {}
            const endPoint: any = {}
            const currentPosition = cm.getCursor()

            // Start uploading from a new line
            if (currentPosition.ch !== 0) {
                cm.replaceSelection('\n')
            }

            Object.assign(startPoint, cm.getCursor('start'))
            Object.assign(endPoint, cm.getCursor('end'))
            if (data && data.name) {
                start = start.replace('#name#', data.name)
                end = end.replace('#name#', data.name)
            }

            const initStartPosition = {
                ch: startPoint.ch,
                line: startPoint.line,
            }

            if (active) {
                text = cm.getLine(startPoint.line)
                start = text.slice(0, startPoint.ch)
                end = text.slice(startPoint.ch)
                cm.replaceRange(start + end, {
                    ch: 0,
                    line: startPoint.line,
                })
            } else {
                text = cm.getSelection()
                cm.replaceSelection(start + text + end)
                startPoint.ch += start.length
                if (startPoint !== endPoint) {
                    endPoint.ch += start.length
                }
            }

            onPosition(initStartPosition, endPoint)

            const line = cm.getLine(cm.getCursor().line)
            const appendedTextLength = start.length + text.length + end.length
            if (line.length > appendedTextLength) {
                cm.replaceSelection('\n')
                cm.setSelection(
                    {
                        ch: line.length - appendedTextLength,
                        line: startPoint.line + 1,
                    },
                    {
                        ch: line.length - appendedTextLength,
                        line: startPoint.line + 1,
                    },
                )
            } else {
                // Set a cursor at the end of line
                cm.setSelection(startPoint, endPoint)
            }

            cm.focus()
        },
        [],
    )

    /**
     * Before uploading file
     */
    const beforeUploadingFile = useCallback((file: File, onPosition: any) => {
        const editor = easyMDE.current
        const cm = editor.codemirror
        const stat = getState(cm)
        const options = editor.options
        const fileName = file.name
        const extensionIndex = fileName.lastIndexOf('.') + 1
        const rawExtension = fileName.slice(extensionIndex)
        const ext = rawExtension.toLowerCase()
        // Check if file type is an image
        if (allowedImageExtensions.includes(ext)) {
            replaceSelection(
                cm,
                stat.image,
                options.insertTexts.uploadingImage,
                { name: fileName },
                onPosition,
            )
        } else {
            replaceSelection(
                cm,
                stat.link,
                options.insertTexts.uploadingFile,
                { name: fileName },
                onPosition,
            )
        }
    }, [getState, replaceSelection])

    /**
     * Upload image
     */
    const customUploadImage = useCallback(async (file: File) => {
        const editor = easyMDE.current
        if (!editor) {
            return
        }

        const position: any = {}

        const updateStatusBar = (message: string): void => {
            editor.updateStatusBar('upload-image', message)
        }

        const onSuccess = (jsonData: { name: string; url: string }): void => {
            afterFileUploaded(jsonData, position)
            resetFileInput()
        }

        const onError = (): void => {
            if (position && position.start && position.end) {
                editor.codemirror.replaceRange(
                    '',
                    position.start,
                    position.end,
                )
            }

            resetFileInput()
        }

        const onErrorSup = (errorMessage: string, error?: unknown): void => {
            updateStatusBar(editor.options.imageTexts.sbInit)

            if (error) {
                // eslint-disable-next-line no-console
                console.error(error)
            }

            onError()
            editor.options.errorCallback(errorMessage)
        }

        const getFileType = (): string => {
            if (file.type) {
                return file.type.toLowerCase()
            }

            const extensionIndex = file.name.lastIndexOf('.') + 1
            const rawExtension = file.name.slice(extensionIndex)
            return rawExtension.toLowerCase()
        }

        const fillErrorMessage = (errorMessage: string): string => {
            const units = editor.options.imageTexts.sizeUnits.split(',')

            const error = errorMessage
                .replace('#image_type#', getFileType())
                .replace('#image_name#', file.name)
                .replace('#image_size#', humanFileSize(file.size, units))
                .replace(
                    '#image_max_size#',
                    humanFileSize(editor.options.imageMaxSize, units),
                )

            return `<div class="Messages Errors"><ul><li>${error}</li></ul></div>`
        }

        const onPosition = (start: any, end: any): void => {
            position.start = start
            position.end = end
        }

        if (!editor.options.imageAccept.includes(getFileType())) {
            onErrorSup(
                fillErrorMessage(editor.options.errorMessages.typeNotAllowed),
            )
            return
        }

        if (file.size > editor.options.imageMaxSize) {
            onErrorSup(
                fillErrorMessage(editor.options.errorMessages.fileTooLarge),
            )
            return
        }

        beforeUploadingFile(file, onPosition)

        updateStatusBar(
            editor.options.imageTexts.sbOnDrop.replace('#images_names#', file.name),
        )

        try {
            const result = await uploadReviewAttachment(file, {
                category: uploadCategory,
                challengeId,
                onProgress: percent => {
                    const percentValue = Number.isFinite(percent)
                        ? Math.max(0, Math.min(100, Math.round(percent)))
                        : 0
                    updateStatusBar(
                        editor.options.imageTexts.sbProgress
                            .replace('#file_name#', file.name)
                            .replace('#progress#', `${percentValue}`),
                    )
                },
            })

            onSuccess({
                name: file.name,
                url: result.url,
            })
        } catch (error) {
            onErrorSup(
                fillErrorMessage(editor.options.errorMessages.importError),
                error,
            )
        }
    }, [
        afterFileUploaded,
        beforeUploadingFile,
        challengeId,
        resetFileInput,
        uploadCategory,
    ])

    useOnComponentDidMount(() => {
        easyMDE.current = new EasyMDE({
            autofocus: false,
            element: elementRef.current as HTMLElement,
            errorCallback: _.noop, // A callback function used to define how to display an error message.
            errorMessages,
            forceSync: true, // true, force text changes made in EasyMDE to be immediately stored in original text area.
            hideIcons: ['guide', 'heading', 'preview', 'side-by-side'],
            imageAccept: [
                ...allowedImageExtensions,
                ...allowedOtherExtensions,
            ].join(', '), // A comma-separated list of mime-types and extensions
            imageMaxSize: maxUploadSize, // Maximum image size in bytes
            imageTexts: {
                sbInit: 'Attach files by dragging & dropping, selecting or pasting them.',
                sbOnDragEnter: 'Drop file to upload it.',
                sbOnDrop: 'Uploading file #images_names#...',
                sbOnUploaded: 'Uploaded #image_name#',
                sbProgress: 'Uploading #file_name#: #progress#%',
                sizeUnits: ' B, KB, MB',
            },
            imageUploadFunction: file => customUploadImage(file),
            initialValue: props.initialValue ?? '',
            insertTexts: {
                file: ['[](', '#url#)'],
                horizontalRule: ['', '\n\n-----\n\n'],
                image: ['![](', '#url#)'],
                link: ['[', '](#url#)'],
                table: [
                    '',
                    // eslint-disable-next-line max-len
                    '\n\n| Column 1 | Column 2 | Column 3 |\n|'
                    + '-------- | -------- | -------- |\n|'
                    + ' Text     | Text      | Text     |\n\n',
                ],
                uploadedFile: ['[#name#](#url#)', ''],
                uploadedImage: ['![#name#](#url#)', ''],
                uploadingFile: ['[Uploading #name#]()', ''],
                uploadingImage: ['![Uploading #name#]()', ''],
            } as any,
            placeholder: '',
            shortcuts: {
                toggleHeading1: '',
                toggleHeading2: '',
                toggleHeading3: '',
            },
            status: [
                {
                    className: 'message',
                    defaultValue: el => {
                        el.innerHTML = ''
                    },
                    onUpdate: el => {
                        el.innerHTML = ''
                    },
                },
                'upload-image',
            ],
            toolbar: [
                {
                    action: (editor: any) => {
                        toggleBlock(
                            editor,
                            'bold',
                            editor.options.blockStyles.bold,
                        )
                    },
                    className: 'fa fa-bold',
                    icon: IconBold,
                    name: 'toggleBold',
                    title: 'Bold',
                },
                {
                    action: (editor: any) => {
                        toggleBlock(
                            editor,
                            'italic',
                            editor.options.blockStyles.italic,
                        )
                    },
                    className: 'fa fa-italic',
                    icon: IconItalic,
                    name: 'toggleItalic',
                    title: 'Italic',
                },
                {
                    action: EasyMDE.toggleStrikethrough,
                    className: 'fa fa-bold',
                    icon: IconStrikethrough,
                    name: 'strikethrough',
                    title: 'Strikethrough',
                },
                '|',
                {
                    action: EasyMDE.toggleHeading1,
                    className: 'fa fa-bold',
                    icon: IconHeading1,
                    name: 'heading-1',
                    title: 'Big Heading',
                },
                {
                    action: EasyMDE.toggleHeading2,
                    className: 'fa fa-bold',
                    icon: IconHeading2,
                    name: 'heading-2',
                    title: 'Medium Heading',
                },
                {
                    action: EasyMDE.toggleHeading3,
                    className: 'fa fa-bold',
                    icon: IconHeading3,
                    name: 'heading-3',
                    title: 'Small Heading',
                },
                '|',
                {
                    action: EasyMDE.toggleOrderedList,
                    className: 'fa fa-bold',
                    icon: IconOrderedList,
                    name: 'ordered-list',
                    title: 'Numbered List',
                },
                {
                    action: EasyMDE.toggleUnorderedList,
                    className: 'fa fa-bold',
                    icon: IconUnorderedList,
                    name: 'unordered-list',
                    title: 'Generic List',
                },
                '|',
                {
                    action: EasyMDE.drawLink,
                    className: 'fa fa-bold',
                    icon: IconLink,
                    name: 'link',
                    title: 'Create Link',
                },
                {
                    action: EasyMDE.drawUploadedImage,
                    className: 'fa fa-upload',
                    icon: IconUploadFile,
                    name: 'upload-image',
                    title: 'Upload a file',
                },
                {
                    action: EasyMDE.drawImage,
                    className: 'fa fa-bold',
                    icon: IconImage,
                    name: 'image',
                    title: 'Insert Image',
                },
                {
                    action: EasyMDE.toggleCodeBlock,
                    className: 'fa fa-bold',
                    icon: IconCode,
                    name: 'code',
                    title: 'Code',
                },
                {
                    action: EasyMDE.drawTable,
                    className: 'fa fa-bold',
                    icon: IconTable,
                    name: 'table',
                    title: 'Insert Table',
                },
                {
                    action: function mentions(editor: EasyMDE) {
                        completeAfter(editor.codemirror)
                    },
                    className: 'fa fa-at',
                    icon: IconMentions,
                    name: 'mentions',
                    title: 'Mention a Topcoder User',
                },
                {
                    action: EasyMDE.toggleBlockquote,
                    className: 'fa fa-bold',
                    icon: IconQuote,
                    name: 'quote',
                    title: 'Quote',
                },
            ],
            uploadImage: true,
        })

        easyMDE.current.codemirror.on('beforeChange', (cm: CodeMirror.Editor, change: EditorChangeCancellable) => {
            if (change.update) {
                const current = cm.getValue().length
                const incoming = change.text.join('\n').length
                const replaced = cm.indexFromPos(change.to) - cm.indexFromPos(change.from)

                const newLength = current + incoming - replaced

                if (props.maxCharactersAllowed) {
                    if (newLength > props.maxCharactersAllowed) {
                        change.cancel()
                    }
                }
            }
        })

        easyMDE.current.codemirror.on('change', (cm: CodeMirror.Editor) => {
            if (props.maxCharactersAllowed) {
                const remaining = (props.maxCharactersAllowed || 0) - cm.getValue().length
                setRemainingCharacters(remaining)
                props.onChange?.(cm.getValue())
            } else {
                props.onChange?.(cm.getValue())
            }
        })

        easyMDE.current.codemirror.on('blur', () => {
            props.onBlur?.()
        })
    })

    useEffect(() => {
        if (!easyMDE.current) {
            return
        }

        const incomingValue = props.initialValue ?? ''
        const editorValue = easyMDE.current.value()

        if (incomingValue !== editorValue) {
            easyMDE.current.value(incomingValue)
        }
    }, [props.initialValue])

    return (
        <div
            className={classNames(styles.container, props.className, {
                [styles.isError]: !!props.error,
                [styles.disabled]: !!props.disabled,
                [styles.showBorder]: !!props.showBorder,
            })}
        >
            <textarea ref={elementRef} placeholder={props.placeholder} />
            {props.maxCharactersAllowed && (
                <div className={styles.remainingCharacters}>
                    {remainingCharacters}
                    {' '}
                    characters remaining
                </div>
            )}
            {props.error && (
                <div className={classNames(styles.error, 'errorMessage')}>
                    {props.error}
                </div>
            )}
        </div>
    )
}

export default FieldMarkdownEditor
