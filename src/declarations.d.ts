declare module 'tc-auth-lib'

declare module '*.svg' {
    import * as React from 'react'

    export const ReactComponent: React.FunctionComponent<React.SVGProps<
        SVGSVGElement
    > & { title?: string }>

    const src: string
    export default src
}

declare module '*.scss' {
    const content: Record<string, string>;
    export default content;
}