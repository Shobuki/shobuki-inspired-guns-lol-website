'use client';
import dynamic from 'next/dynamic';
import type { YouTubeProps as _YouTubeProps } from 'react-youtube';

const YouTube = dynamic(() => import('react-youtube'), { ssr: false }) as unknown as React.ComponentType<_YouTubeProps>;

export type YouTubeProps = _YouTubeProps;
export default YouTube;

