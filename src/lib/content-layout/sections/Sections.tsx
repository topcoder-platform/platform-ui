import { FC } from 'react'

import SectionSelector from './section-selector/Section-Selector'
import { SectionsProps } from './sections-props.interface'
import styles from './Sections.module.scss'

const Sections: FC<SectionsProps> = (props: SectionsProps) => {

    // if we don't have any sections, hide the entire area
    if (!props.sections.length) {
        return <></>
    }

    const sections: Array<JSX.Element> = props.sections
        .map(section => (
            <SectionSelector
                icon={section.icon}
                key={section.title}
                route={section.route}
                title={section.title}
            ></SectionSelector>
        ))

    return (
        <div className={styles.sections}>
            {sections}
        </div>
    )
}

export default Sections
