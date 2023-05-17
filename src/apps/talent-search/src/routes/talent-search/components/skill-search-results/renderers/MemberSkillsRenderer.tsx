import { useState, Dispatch } from 'react'

import Member from '@talentSearch/lib/models/Member'

import styles from './MemberSkillsRenderer.module.scss'

import SkillDisplayModal from '../modal/SkillDisplayModal'

const MemberSkillsRenderer: (member:Member) => JSX.Element
= (member:Member): JSX.Element => {
    const [isSkillPopupOpen, setIsSkillPopupOpen]: [boolean, Dispatch<boolean>]
    = useState<boolean>(false)

    let style="score-low"

    function handlePopupLink(): void {
        console.log("Opening popup")
        setIsSkillPopupOpen(true)
    }

    function hideSkillModal(): void {
        setIsSkillPopupOpen(false)
    }

    if(member.searchedSkillScore>50){
        style = "score-high"
    }
    else if(member.searchedSkillScore>20){
        style = "score-medium"
    }
    else{
        style = "score-low"
    }
    return (
        
        <div className={styles.score}>
            <SkillDisplayModal
                    isOpen={isSkillPopupOpen}
                    onClose={hideSkillModal}
                    member={member}
            />
            <a onClick={handlePopupLink} className={styles[style]}>{member.searchedSkillScore}</a>
        </div>
    )
}

export default MemberSkillsRenderer
