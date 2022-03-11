import { FC } from 'react'

import SectionSelector from './section-selector/Section-Selector'
import { SectionsProps } from './sections-props.model'
import styles from './Sections.module.scss'

const Sections: FC<SectionsProps> = (props: SectionsProps) => {

    // if we don't have any sections, hide the entire area
    if (!props.sections.length) {
        return <></>
    }

    const sections: Array<JSX.Element> = props.sections
        .map(section => (
            <SectionSelector
                key={section.sectionRoute.title}
                toolRoute={section.toolRoute}
                sectionRoute={section.sectionRoute}
            ></SectionSelector>
        ))

    return (
        <div className={styles.sections}>
            {sections}
        </div>
    )
}

export default Sections
