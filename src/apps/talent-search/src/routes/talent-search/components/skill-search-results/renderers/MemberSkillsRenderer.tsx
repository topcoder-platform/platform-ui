import { useState, Dispatch } from 'react'

import Member from '@talentSearch/lib/models/Member'
import MemberEmsiSkill from '@talentSearch/lib/models/MemberEmsiSkill'
import styles from './MemberSkillsRenderer.module.scss'
import TagList from '@earn/components/TagList'
import SkillTag from './SkillTag'
const MemberSkillsRenderer: (member:Member) => JSX.Element
= (member:Member): JSX.Element => {
    let tags:Array<MemberEmsiSkill>=[]
    if(member && member.emsiSkills){
        tags=member.emsiSkills
    }
    else{
        tags=[]
    }
    return (
      <div className={styles["skills"]}>
        <TagList
          maxTagCount={3}
          renderTag={renderTag}
          tags={tags}
        />
      </div>
    )
}

  
interface RenderTagProps {
    className?: string,
    onClickTag?: () => void,
    tag: MemberEmsiSkill
}

const renderTag = ({ className = "", onClickTag, tag }: RenderTagProps): JSX.Element => (
    <SkillTag
        skill={tag}
    />
);

export default MemberSkillsRenderer
