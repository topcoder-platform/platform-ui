import { FC, SVGProps } from 'react'

export interface SectionSelectorProps {
    icon: FC<SVGProps<SVGSVGElement> & { title?: string | undefined }>
    rootRoute: string
    route: string
    title: string
}
