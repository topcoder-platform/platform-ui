import PT from 'prop-types';
import React from 'react';
import cn from 'classnames';

import { ReactComponent as DefaultUserAvatar } from '@earn/assets/images/default-user-avatar.svg';

import styles from './Avatar.module.scss';

export default function Avatar({ className, url }) {
    const classNames = cn(className, styles.avatar)

    return url
        ? <img alt="Avatar" src={url} className={classNames} />
        : <DefaultUserAvatar className={classNames} />;
}

Avatar.defaultProps = {
    className: null,
    url: null,
};

Avatar.propTypes = {
    className: PT.string,
    url: PT.string,
};