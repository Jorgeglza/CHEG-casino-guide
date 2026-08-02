import { useEffect, useRef, useState } from 'react';

interface InfoTipProps {
  text: string;
}

export default function InfoTip({ text }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <span className="info-tip-wrap" ref={wrapRef}>
      <button
        type="button"
        className="info-tip-icon"
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        aria-label="More info"
        aria-expanded={open}
      >
        i
      </button>
      {open && <span className="info-tip-bubble">{text}</span>}
    </span>
  );
}
