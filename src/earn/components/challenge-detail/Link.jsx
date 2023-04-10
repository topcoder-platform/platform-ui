/**
 * The Link wraps around React Router's Link component, to automatically replace
 * it by the regular <a> element when:
 * - The target reference points to another domain;
 * - User opts to open the reference in a new tab;
 * - User explicitely opts to use <a>.
 */

 import React from 'react';
 import { Link as RrLink } from 'react-router-dom';
 
 import GenericLink from './GenericLink';
 
 export default function Link(props) {
   return <GenericLink {...props} routerLinkType={RrLink} />;
 }