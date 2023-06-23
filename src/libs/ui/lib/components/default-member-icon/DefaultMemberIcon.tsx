/* eslint-disable max-len */
import { FC } from 'react'

const DefaultMemberIcon: FC = () => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        xmlnsXlink='http://www.w3.org/1999/xlink'
        width='141'
        height='141'
        viewBox='0 0 141 141'
    >
        <defs>
            <rect
                id='path-1'
                width='140'
                height='140'
                x='0.8'
                y='0.5'
                rx='306'
            />
        </defs>
        <g fill='none' fillRule='evenodd' stroke='none' strokeWidth='1'>
            <g transform='translate(-205 -203) translate(205 203)'>
                <mask id='mask-2' fill='#fff'>
                    <use xlinkHref='#path-1' />
                </mask>
                <use fill='#F0F0F0' xlinkHref='#path-1' />
                <path
                    fill='#A3A3AE'
                    stroke='#A3A3AE'
                    strokeWidth='3'
                    d='M118 137.143c0 4.345-3.501 7.857-7.833 7.857H31.833C27.51 145 24 141.488 24 137.143c0-15.714 15.142-30.376 30.62-36.174-8.937-5.54-14.953-15.377-14.953-26.683v-7.857C39.667 49.072 53.697 35 71 35c17.304 0 31.333 14.072 31.333 31.429v7.857c0 11.306-6.016 21.143-14.946 26.683 15.471 5.798 30.613 20.46 30.613 36.174h0z'
                    mask='url(#mask-2)'
                    opacity='0.2'
                />
            </g>
        </g>
    </svg>
)

export default DefaultMemberIcon
