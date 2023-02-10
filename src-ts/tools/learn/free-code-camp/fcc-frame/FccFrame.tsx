import { noop } from 'lodash'
import { FC, memo, MutableRefObject, useEffect, useRef } from 'react'

import { LearnConfig } from '../../learn-config'
import { LearnLessonMeta } from '../../learn-lib'

import styles from './FccFrame.module.scss'

const FreecodecampIfr: FC<any> = memo((params: any) => (
    <iframe
        className={styles.iframe}
        ref={params.frameRef}
        title='FreeCodeCamp.org Course'
    />
))

interface FccFrameProps {
    lesson?: LearnLessonMeta
    onFccLastLessonNavigation: () => void
    onFccLessonChange: (path: string) => void
    onFccLessonComplete: (challengeUuid: string) => void
}

const FccFrame: FC<FccFrameProps> = (props: FccFrameProps) => {

    const frameRef: MutableRefObject<HTMLElement | any> = useRef()
    const frameIsReady: MutableRefObject<boolean> = useRef<boolean>(false)
    const lessonUrl: string | undefined = props.lesson?.lessonUrl

    useEffect(() => {
        if (!frameRef.current || !props.lesson) {
            return
        }

        if (!frameIsReady.current) {
            Object.assign(frameRef.current, { src: `${LearnConfig.CLIENT}/${props.lesson.lessonUrl}` })
        } else {
            frameRef.current.contentWindow.postMessage(JSON.stringify({
                data: { path: `/${lessonUrl}` },
                event: 'fcc:url:update',
            }), '*')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        lessonUrl,
    ])

    useEffect(() => {
        if (!frameRef) {
            return noop
        }

        const handleEvent: (event: any) => void = (event: any) => {
            const { data: jsonData, origin }: { data: string, origin: string } = event

            if (origin.indexOf(LearnConfig.CLIENT) === -1) {
                return
            }

            const { event: eventName, data }: {
                data: {
                    meta: { id: string },
                    path: string,
                },
                event: string,
             } = JSON.parse(jsonData)

            if (eventName === 'fcc:nav:last-challenge') {
                props.onFccLastLessonNavigation.call(undefined)
            }

            if (eventName === 'fcc:challenge:completed') {
                props.onFccLessonComplete.call(undefined, data?.meta?.id)
            }

            if (eventName === 'fcc:challenge:ready') {
                frameIsReady.current = true
                props.onFccLessonChange.call(undefined, data.path)
            }
        }

        window.addEventListener('message', handleEvent, false)
        return (): void => {
            window.removeEventListener('message', handleEvent, false)
        }
    }, [
        frameRef,
        props.onFccLastLessonNavigation,
        props.onFccLessonChange,
        props.onFccLessonComplete,
    ])

    return (
        <FreecodecampIfr frameRef={frameRef} />
    )
}

export default FccFrame
