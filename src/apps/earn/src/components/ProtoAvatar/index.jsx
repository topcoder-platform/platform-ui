/**
 * The standard ProtoAvatar component.
 * To use it you will have to properly wrap it with react-css-super-themr,
 * the component provided here takes care about the code interface and logic
 * only.
 */

 import PT from 'prop-types';
 import React from 'react';
 
 export default function ProtoAvatar({ DefaultAvatar, theme, url }) {
   return url
     ? <img alt="Avatar" src={url} className={theme.avatar} />
     : <DefaultAvatar className={theme.avatar} />;
 }
 
 ProtoAvatar.defaultProps = {
   url: null,
 };
 
 ProtoAvatar.propTypes = {
   DefaultAvatar: PT.func.isRequired,
   theme: PT.shape({
     avatar: PT.string.isRequired,
   }).isRequired,
   url: PT.string,
 };