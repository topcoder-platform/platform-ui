import React from 'react'

const DragIcon: React.FC = () => (
    <svg
        width='32'
        height='32'
        viewBox='0 0 32 32'
        fill='currentColor'
        xmlns='http://www.w3.org/2000/svg'
        role='img'
        aria-label='Drag handle'
        style={{ cursor: 'grab' }}
    >
        <title>Draggable</title>
        <rect x='10' y='6' width='4' height='4' />
        <rect x='18' y='6' width='4' height='4' />
        <rect x='10' y='14' width='4' height='4' />
        <rect x='18' y='14' width='4' height='4' />
        <rect x='10' y='22' width='4' height='4' />
        <rect x='18' y='22' width='4' height='4' />
    </svg>
)

export default DragIcon
