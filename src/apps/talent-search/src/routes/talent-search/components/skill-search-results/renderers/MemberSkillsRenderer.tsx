/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable ordered-imports/ordered-imports */
import Member from '@talentSearch/lib/models/Member'
import MemberEmsiSkill from '@talentSearch/lib/models/MemberEmsiSkill'
import TagList from '@earn/components/TagList'
import SkillTag from './SkillTag'
import styles from './MemberSkillsRenderer.module.scss'

interface RenderTagProps {
    className?: string,
    onClickTag?: () => void,
    tag: MemberEmsiSkill
}

const renderTag = ({ className = '', onClickTag, tag }: RenderTagProps): JSX.Element => (
    <SkillTag
        skill={tag}
    />
)

const MemberSkillsRenderer: (member:Member) => JSX.Element
= (member:Member): JSX.Element => {
    let tags:Array<MemberEmsiSkill> = []
    if (member && member.emsiSkills) {
        tags = member.emsiSkills
    } else {
        tags = []
    }

    return (
        <div className={styles.skills}>
            <TagList
                maxTagCount={3}
                renderTag={renderTag}
                tags={tags}
            />
        </div>
    )
}

export default MemberSkillsRenderer
