import { noop } from 'lodash'
import { ReactNode } from 'react'

import { TCACertificationProviderData, useGetTCACertification } from '..'

import TCACertificationCompletedModal from './TCACertificationCompletedModal'

export function useTcaCertificationModal(certificationName?: string, onClose: () => void = noop): ReactNode {

    const { certification: tcaCertification }: TCACertificationProviderData = useGetTCACertification(
        certificationName ?? '',
        { enabled: !!certificationName },
    )

    return (
        <TCACertificationCompletedModal
            certification={tcaCertification}
            isOpen={!!tcaCertification}
            onClose={onClose}
        />
    )
}
