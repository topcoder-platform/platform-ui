import { FC } from 'react'

import activeUp from '../assets/forums/44ba2.svg'
import attachment from '../assets/forums/e203d.svg'
import author from '../assets/forums/1bd8b.svg'
import bold from '../assets/forums/8f583.svg'
import center from '../assets/forums/714f6.svg'
import code from '../assets/forums/c7811.svg'
import deleteIcon from '../assets/forums/41360.svg'
import down from '../assets/forums/1e461.svg'
import downVote from '../assets/forums/54374.svg'
import edit from '../assets/forums/bad71.svg'
import expand from '../assets/forums/84bb6.svg'
import h1 from '../assets/forums/0f9e6.svg'
import h2 from '../assets/forums/b697d.svg'
import h3 from '../assets/forums/90f38.svg'
import image from '../assets/forums/94f98.svg'
import info from '../assets/forums/3faa9.svg'
import italic from '../assets/forums/7f1bc.svg'
import left from '../assets/forums/381ef.svg'
import link from '../assets/forums/42478.svg'
import mention from '../assets/forums/9064c.svg'
import ordered from '../assets/forums/f14f0.svg'
import posts from '../assets/forums/bfe3c.svg'
import quote from '../assets/forums/1a172.svg'
import quoteAction from '../assets/forums/f163b.svg'
import reply from '../assets/forums/3e0fd.svg'
import right from '../assets/forums/baad6.svg'
import star from '../assets/forums/076a6.svg'
import strike from '../assets/forums/476e5.svg'
import table from '../assets/forums/07c9e.svg'
import underline from '../assets/forums/1eecc.svg'
import unordered from '../assets/forums/8ce62.svg'
import up from '../assets/forums/5f27f.svg'
import views from '../assets/forums/0a628.svg'
import watch from '../assets/forums/74494.svg'
import watched from '../assets/forums/watched.svg'

const icons = {
    activeUp,
    attachment,
    author,
    bold,
    center,
    code,
    delete: deleteIcon,
    down,
    downVote,
    edit,
    expand,
    h1,
    h2,
    h3,
    image,
    info,
    italic,
    left,
    link,
    mention,
    ordered,
    posts,
    quote,
    quoteAction,
    reply,
    right,
    star,
    strike,
    table,
    underline,
    unordered,
    up,
    views,
    watch,
    watched,
}

/** Displays an original Figma forum icon at its intrinsic size (`watched` is the filled eye for active watches).
 * @param props Named action icon. @returns Decorative image; the parent supplies its accessible label.
 * @throws Never.
 */
export const ForumIcon: FC<{ name: keyof typeof icons }> = props => (
    <img alt='' src={icons[props.name]} />
)
