'use client';

import React from 'react';
import { BrandLogo, BrandLogoProps } from './BrandLogo';

export interface NeonLogoProps extends BrandLogoProps {}

export function NeonLogo(props: NeonLogoProps) {
  return <BrandLogo {...props} />;
}
