import { FC } from 'react'

import { ContentLayout } from '../../lib'

import styles from './Profile.module.scss'

export const utilTitle: string = 'Profile'

const Profile: FC<{}> = () => <ContentLayout classNames={styles.home} title={utilTitle} />

export default Profile
