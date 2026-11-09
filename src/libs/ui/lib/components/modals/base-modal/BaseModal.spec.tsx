/* eslint-disable ordered-imports/ordered-imports */
import { act, fireEvent, render } from '@testing-library/react'
import { notifyUploadPicker } from '../upload-picker-event'
import BaseModal from './BaseModal'

jest.mock('./use-fetch-modal-content', () => ({ useFetchModalContent: () => ({}) }))
jest.mock('../../loading-spinner', () => ({ LoadingSpinner: () => null }))
jest.mock('../../svgs', () => ({ IconOutline: { XIcon: () => null } }))

it('keeps the parent modal open on Escape while an upload picker owns keyboard focus', () => {
    const onClose = jest.fn()
    render(<BaseModal open onClose={onClose}><button type='button'>Attach file</button></BaseModal>)
    act(() => notifyUploadPicker(true))
    fireEvent.keyDown(document, { key: 'Escape', keyCode: 27 })
    expect(onClose).not.toHaveBeenCalled()
    act(() => notifyUploadPicker(false))
    fireEvent.keyDown(document, { key: 'Escape', keyCode: 27 })
    expect(onClose).toHaveBeenCalledTimes(1)
})
