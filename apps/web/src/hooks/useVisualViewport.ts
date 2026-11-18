'use client';

import { useState, useEffect, useCallback } from 'react';

export interface VisualViewportState {
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  viewportHeight: number;
  viewportWidth: number;
  scaleFactor: number;
}

/**
 * useVisualViewport
 * Listens to window.visualViewport resize and scroll events to handle
 * mobile on-screen keyboard opening/closing cleanly without pushing UI
 * off-screen.
 */
export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>({
    isKeyboardOpen: false,
    keyboardHeight: 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
    viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 400,
    scaleFactor: 1
  });

  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;
    const windowH = window.innerHeight;
    const windowW = window.innerWidth;

    if (!vv) {
      setState({
        isKeyboardOpen: false,
        keyboardHeight: 0,
        viewportHeight: windowH,
        viewportWidth: windowW,
        scaleFactor: 1
      });
      return;
    }

    const currentH = vv.height;
    const currentW = vv.width;
    const diff = windowH - currentH;
    // On mobile, a difference > 120px typically indicates virtual keyboard
    const isKeyboardOpen = diff > 120;
    const keyboardHeight = isKeyboardOpen ? Math.max(0, diff) : 0;

    // Calculate scale factor: when keyboard is open on small screen (< 640px height),
    // scale down prompts and canvases smoothly to avoid vertical clipping
    let scale = 1;
    if (isKeyboardOpen) {
      if (currentH < 400) {
        scale = 0.7;
      } else if (currentH < 550) {
        scale = 0.82;
      } else {
        scale = 0.9;
      }
    }

    setState({
      isKeyboardOpen,
      keyboardHeight,
      viewportHeight: currentH,
      viewportWidth: currentW,
      scaleFactor: scale
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    handleResize();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleResize);
      vv.addEventListener('scroll', handleResize);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', handleResize);
        vv.removeEventListener('scroll', handleResize);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return state;
}
