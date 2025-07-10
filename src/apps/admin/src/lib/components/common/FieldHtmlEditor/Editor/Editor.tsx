/**
 * Field Markdown Editor.
 */
import { FC, useCallback, useEffect, useRef } from 'react'
import _ from 'lodash'
import CodeMirror from 'codemirror'
import EasyMDE from 'easymde'
import classNames from 'classnames'
import 'easymde/dist/easymde.min.css'

import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'

import styles from './Editor.module.scss'

interface Props {
    className?: string
    placeholder?: string
    initialValue?: string
    onChange?: (value: string) => void
    onBlur?: (event: any) => void
    error?: string
    showBorder?: boolean
    disabled?: boolean
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
        const endType = end.replace(/(\*|_)/, '')
        return { endType, startType }
    },
    strikethrough: (start: any, end: any) => {
        const startType = start.replace(/(\*\*|~~)(?![\s\S]*(\*\*|~~))/, '')
        const endType = end.replace(/(\*\*|~~)/, '')
        return { endType, startType }
    },
}

type CodeMirrorType = keyof typeof stateStrategy | 'variable-2'

export const Editor: FC<Props> = (props: Props) => {
    const elementRef = useRef<HTMLTextAreaElement>(null)
    const easyMDE = useRef<any>(null)

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

            const endChars
                = typeof endCharsInput === 'undefined'
                    ? startChars
                    : endCharsInput
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
                sbInit: '',
                sbOnDragEnter: 'Drop file to upload it.',
                sbOnDrop: 'Uploading file #images_names#...',
                sbOnUploaded: 'Uploaded #image_name#',
                sbProgress: 'Uploading #file_name#: #progress#%',
                sizeUnits: ' B, KB, MB',
            },
            imageUploadFunction: _.noop,
            initialValue: props.initialValue,
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
                    action: function format(editor: any) {
                        toggleBlock(
                            editor,
                            'bold',
                            editor.options.blockStyles.bold,
                        )
                    },
                    className: 'fa fa-bold',
                    name: 'bold',
                    title: 'Bold',
                },
                {
                    action: function format(editor: any) {
                        toggleBlock(
                            editor,
                            'italic',
                            editor.options.blockStyles.italic,
                        )
                    },
                    className: 'fa fa-italic',
                    name: 'italic',
                    title: 'Italic',
                },
                'strikethrough',
                '|',
                'heading-1',
                'heading-2',
                'heading-3',
                '|',
                'code',
                'quote',
                '|',
                'unordered-list',
                'ordered-list',
                'clean-block',
                '|',
                {
                    action: function mentions(editor: EasyMDE) {
                        completeAfter(editor.codemirror)
                    },
                    className: 'fa fa-at',
                    name: 'mentions',
                    title: 'Mention a Topcoder User',
                },
                'link',
                'image',
                'table',
                'horizontal-rule',
                '|',
                'fullscreen',
                '|',
                'guide',
            ],
            uploadImage: false,
        })

        easyMDE.current.codemirror.on('change', (cm: CodeMirror.Editor) => {
            props.onChange?.(cm.getValue())
        })

        easyMDE.current.codemirror.on('blur', (event: any) => {
            props.onBlur?.(event)
        })
    })

    useEffect(() => {
        easyMDE.current?.value(props.initialValue)
    }, [props.initialValue])

    return (
        <div
            className={classNames(styles.container, props.className, {
                [styles.isError]: !!props.error,
                [styles.showBorder]: !!props.showBorder,
                [styles.disabled]: !!props.disabled,
            })}
        >
            <textarea ref={elementRef} placeholder={props.placeholder} />
        </div>
    )
}

export default Editor
