import React, { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

export default function AnimatedCounter({ value, decimals = 2 }) {
  const nodeRef = useRef(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const startValue = parseFloat(node.textContent) || 0;
    const endValue = parseFloat(value) || 0;

    if (startValue === endValue) {
      node.textContent = endValue.toFixed(decimals);
      return;
    }

    const controls = animate(startValue, endValue, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate(val) {
        node.textContent = val.toFixed(decimals);
      },
      onComplete() {
        node.textContent = endValue.toFixed(decimals);
      },
    });

    return () => controls.stop();
  }, [value, decimals]);

  return <span ref={nodeRef}>{(parseFloat(value) || 0).toFixed(decimals)}</span>;
}
