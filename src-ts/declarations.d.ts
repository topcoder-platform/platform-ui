declare module '*.html' {
    const htmlFile: string
    export = htmlFile
}

declare module '*.scss' {
    const scssFile: { [style: string]: any }
    export = scssFile
}

declare module '*.svg' {
    import * as React from 'react'

    export const ReactComponent: React.FunctionComponent<React.SVGProps<
        SVGSVGElement
    > & { title?: string }>

    const src: string
    export default src
}

declare module '@topcoder/mfe-header'

declare module 'tc-auth-lib'
