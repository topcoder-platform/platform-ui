import { FC, memo, MutableRefObject, useEffect, useRef } from 'react'

import { EnvironmentConfig } from '../../../../config'
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
    onFccLessonComplete: () => void
}

const FccFrame: FC<FccFrameProps> = (props: FccFrameProps) => {

    const frameRef: MutableRefObject<HTMLElement | any> = useRef()
    const frameIsReady: MutableRefObject<boolean> = useRef<boolean>(false)
    const { onFccLastLessonNavigation, onFccLessonChange, onFccLessonComplete }: FccFrameProps = props
    const lessonUrl: string | undefined = props.lesson?.lessonUrl

    useEffect(() => {
        if (!frameRef.current || !props.lesson) {
            return
        }

        if (!frameIsReady.current) {
            Object.assign(frameRef.current, { src: `${EnvironmentConfig.LEARN_SRC}/${props.lesson.lessonUrl}` })
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
            return
        }
        const handleEvent: (event: any) => void = (event: any) => {
            const { data: jsonData, origin }: { data: string, origin: string } = event

            if (origin.indexOf(EnvironmentConfig.LEARN_SRC) === -1) {
                return
            }

            const { event: eventName, data }: { data: { path: string }, event: string } = JSON.parse(jsonData)

            if (eventName === 'fcc:nav:last-challenge') {
                onFccLastLessonNavigation()
            }

            if (eventName === 'fcc:challenge:completed') {
                onFccLessonComplete()
            }

            if (eventName === 'fcc:challenge:ready') {
                frameIsReady.current = true
                onFccLessonChange(data.path)
            }
        }

        window.addEventListener('message', handleEvent, false)
        return () => {
            window.removeEventListener('message', handleEvent, false)
        }
    }, [
        frameRef,
        onFccLastLessonNavigation,
        onFccLessonChange,
        onFccLessonComplete,
    ])

    return (
        <FreecodecampIfr frameRef={frameRef} />
    )
}

export default FccFrame
