import { ReactComponent as DefaultUserAvatar } from '@earn/assets/images/default-user-avatar.svg';
import React from 'react';
import { themr } from 'react-css-super-themr';
import ProtoAvatar from '../ProtoAvatar';

import theme from './style.scss';

function Avatar(props) {
  return <ProtoAvatar DefaultAvatar={DefaultUserAvatar} {...props} />;
}

export default themr('Avatar', theme)(Avatar);