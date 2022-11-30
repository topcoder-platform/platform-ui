declare module '@cypress/code-coverage/task'

declare module '*.html' {
    const htmlFile: string
    export = htmlFile
}

declare module '*.pdf'

declare module '*.svg' {
    import * as React from 'react'

    export const ReactComponent: React.FunctionComponent<React.SVGProps<
        SVGSVGElement
    > & { title?: string }>

    const src: string
    export default src
}

declare module 'tc-auth-lib'

declare module '*.md' {
    const value: string
    export default value
}

declare module '*.txt' {
    const value: string
    export default value
}
