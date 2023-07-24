import { FC } from 'react'

import { BaseModal } from '~/libs/ui'

interface MemberRatingInfoModalProps {
    onClose: () => void
}

const MemberRatingInfoModal: FC<MemberRatingInfoModalProps> = (props: MemberRatingInfoModalProps) => (
    <BaseModal
        onClose={props.onClose}
        open
        title='What are ratings and percentiles'
    >
        <p>
            Topcoder ratings and percentiles are numerical values that change
            depending on how well someone does in coding competitions,
            with higher ratings indicating better performance.
        </p>
    </BaseModal>
)

export default MemberRatingInfoModal
