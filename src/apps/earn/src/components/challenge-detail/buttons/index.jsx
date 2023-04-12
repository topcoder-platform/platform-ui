/**
 * Standard themed buttons for TC UI Kit.
 */

import { themr } from 'react-css-super-themr';
import { default as ProtoButton } from '../Button';

import dangerTheme from './themes/danger.scss';
import defaultTheme from './themes/default.scss';
import ghostTheme from './themes/ghost.scss';
import primaryTheme from './themes/primary.scss';
import secondaryTheme from './themes/secondary.scss';

export const Button = themr('DefaultButton', defaultTheme)(ProtoButton);
export const DangerButton = themr('DangerButton', dangerTheme)(ProtoButton);
export const GhostButton = themr('GhostButton', ghostTheme)(ProtoButton);
export const PrimaryButton = themr('PrimaryButton', primaryTheme)(ProtoButton);

export const SecondaryButton = themr('SecondaryButton', secondaryTheme)(ProtoButton);
