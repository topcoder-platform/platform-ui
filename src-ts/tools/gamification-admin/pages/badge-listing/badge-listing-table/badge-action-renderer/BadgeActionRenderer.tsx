import { Button, useCheckIsMobile } from '../../../../../../lib'
import { baseUrl } from '../../../../gamification-admin.routes'
import { Badge } from '../../../../lib/models/badge.model'

import styles from './BadgeActionRenderer.module.scss'

function BadgeActionRenderer(badge: Badge): JSX.Element {
  const isMobile: boolean = useCheckIsMobile()

  return (
    <div className={styles['badge-actions']}>
      <Button buttonStyle='secondary' size={isMobile ? 'xs' : 'sm'} label='View' route={`${baseUrl}/badge-detail/${badge.id}`} />
      <Button buttonStyle='secondary' size={isMobile ? 'xs' : 'sm'} label='Edit' route={`${baseUrl}/badge-detail/${badge.id}#edit`} />
      <Button buttonStyle='secondary' size={isMobile ? 'xs' : 'sm'} label='Award' route={`${baseUrl}/badge-detail/${badge.id}#award`} />
    </div>
  )
}

export default BadgeActionRenderer
