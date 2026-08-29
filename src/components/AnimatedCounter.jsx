import React, { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

export default function AnimatedCounter({ value, decimals = 2 }) {
  const nodeRef = useRef(null);
  const prevValueRef = useRef(parseFloat(value) || 0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const startValue = prevValueRef.current;
    const endValue = parseFloat(value) || 0;

    const controls = animate(startValue, endValue, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate(val) {
        node.textContent = val.toFixed(decimals);
      },
    });

    prevValueRef.current = endValue;

    return () => controls.stop();
  }, [value, decimals]);

  return <span ref={nodeRef}>{(parseFloat(value) || 0).toFixed(decimals)}</span>;
}
