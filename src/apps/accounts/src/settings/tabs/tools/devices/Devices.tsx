import { FC } from 'react'
import { bind, compact } from 'lodash'

import { UserProfile, UserTrait } from '~/libs/core'
import { Button, Collapsible, IconOutline } from '~/libs/ui'
import {
    ConsoleIcon,
    DesktopIncon,
    LaptopIcon,
    OtherDeviceIcon,
    SettingSection,
    SmartphoneIcon,
    TabletIcon,
    WearableIcon,
} from '~/apps/accounts/src/lib'

import styles from './Devices.module.scss'

interface DevicesProps {
    devicesTrait: UserTrait | undefined
    profile: UserProfile
}

const Devices: FC<DevicesProps> = (props: DevicesProps) => {
    console.log('Devices', props.devicesTrait, props.profile)

    function handleEditBtnClick(trait: UserTrait): void {
        console.log('handleCTABtnClick', trait)
    }

    function handleTrashBtnClick(trait: UserTrait): void {
        console.log('handleTrashBtnClick', trait)
    }

    function renderDeviceImage(trait: UserTrait): JSX.Element {
        switch (trait.deviceType) {
            case 'Console': return <ConsoleIcon />
            case 'Desktop': return <DesktopIncon />
            case 'Laptop': return <LaptopIcon />
            case 'Smartphone': return <SmartphoneIcon />
            case 'Tablet': return <TabletIcon />
            case 'Wearable': return <WearableIcon />
            default: return <OtherDeviceIcon />
        }
    }

    return (
        <Collapsible
            header={<h3>YOUR DEVICES</h3>}
            containerClass={styles.container}
            contentClass={styles.content}
        >
            {
                props.devicesTrait?.traits.data.map((trait: UserTrait) => (
                    <SettingSection
                        key={`${trait.model}-${trait.manufacturer}-${trait.operatingSystem}-${trait.deviceType}`}
                        leftElement={(
                            <div className={styles.imageWrap}>
                                {renderDeviceImage(trait)}
                            </div>
                        )}
                        title={trait.model}
                        infoText={
                            compact([
                                trait.manufacturer, trait.operatingSystem, trait.deviceType,
                            ])
                                .join(' | ')
                        }
                        actionElement={(
                            <div className={styles.actionElements}>
                                <Button
                                    className={styles.ctaBtn}
                                    icon={IconOutline.PencilIcon}
                                    onClick={bind(handleEditBtnClick, this, trait)}
                                    size='lg'
                                />
                                <Button
                                    className={styles.ctaBtn}
                                    icon={IconOutline.TrashIcon}
                                    onClick={bind(handleTrashBtnClick, this, trait)}
                                    size='lg'
                                />
                            </div>
                        )}
                    />
                ))
            }

            <div className={styles.deviceForm}>
                <p>Add a new device to your devices list</p>

            </div>
        </Collapsible>
    )
}

export default Devices
