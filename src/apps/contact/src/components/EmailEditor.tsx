import { FC, useEffect, useRef } from 'react'
import grapesjs, { Editor, ProjectData } from 'grapesjs'
import newsletter from 'grapesjs-preset-newsletter'
import 'grapesjs/dist/css/grapes.min.css'

import { sanitizeEditorDesign } from '../editor-design'

export const STARTER_EMAIL = `<table role="presentation" style="width:100%;background:#f4f5f6;padding:24px">
<tr><td><table role="presentation" style="max-width:600px;width:100%;margin:auto;background:#fff">
<tr><td style="padding:28px;color:#137d60;font:700 28px Arial">TOPCODER</td></tr>
<tr><td style="padding:0 28px;color:#666;font:14px Arial">{{date}}</td></tr>
<tr><td style="padding:28px;color:#202a30;font:16px/1.6 Arial">
<h1 style="font-size:28px">Your next opportunity starts here</h1>
<p>Hi {{firstName|there}},</p><p>Share something useful with the Topcoder community.</p>
<a href="https://www.topcoder.com" style="background:#137d60;color:#fff;padding:12px 24px;
display:inline-block;text-decoration:none;border-radius:4px">Explore Topcoder</a>
</td></tr></table></td></tr></table>`

interface Props {
    html: string
    design?: Record<string, unknown>
    onChange: (html: string, design: Record<string, unknown>) => void
}

/**
 * Mounts the locally bundled BSD-licensed GrapesJS newsletter editor with email-safe layout blocks.
 * @param props initial HTML/design and callback receiving inline-CSS HTML plus editable project state.
 * @returns the visual editor canvas; its instance is destroyed when the composer is unmounted.
 * @throws GrapesJS initialization errors propagate to the platform error boundary.
 */
export const EmailEditor: FC<Props> = props => {
    // React DOM refs use null until the container mounts.
    // eslint-disable-next-line unicorn/no-null
    const container = useRef<HTMLDivElement>(null)
    const editorRef = useRef<Editor>()
    const onChange = useRef(props.onChange)
    const initial = useRef({ design: props.design, html: props.html })
    onChange.current = props.onChange

    useEffect(() => {
        if (!container.current) return undefined
        const editor = grapesjs.init({
            canvas: { scripts: [], styles: [] },
            components: initial.current.html,
            container: container.current,
            height: '640px',
            noticeOnUnload: false,
            parser: { optionsHtml: { allowScripts: false, allowUnsafeAttr: false, allowUnsafeAttrValue: false } },
            plugins: [newsletter],
            storageManager: false,
        })
        editorRef.current = editor
        if (initial.current.design && Object.keys(initial.current.design).length) {
            editor.loadProjectData(sanitizeEditorDesign(initial.current.design) as ProjectData)
        }

        editor.Blocks.add('contact-social', {
            category: 'Content',
            content:
                '<p style="text-align:center"><a href="https://www.linkedin.com/company/topcoder">'
                + 'LinkedIn</a> &nbsp; <a href="https://www.youtube.com/topcoder">YouTube</a></p>',
            label: 'Social links',
        })
        editor.Blocks.add('contact-video', {
            category: 'Content',
            content:
                '<a href="https://www.youtube.com/topcoder" style="display:block;padding:24px;'
                + 'background:#e7f4ee;text-align:center">▶ Watch the video</a>',
            label: 'Video link',
        })
        editor.Blocks.add('contact-greeting', {
            category: 'Content',
            content: '<p>Hi {{firstName|there}},</p>',
            label: 'Personal greeting',
        })
        editor.on('update', () => {
            const html = editor.runCommand('gjs-get-inlined-html') as string
            onChange.current(html, editor.getProjectData() as Record<string, unknown>)
        })
        return () => {
            editor.destroy()
            editorRef.current = undefined
        }
    }, [])

    return <div ref={container} aria-label='Email visual editor' />
}
