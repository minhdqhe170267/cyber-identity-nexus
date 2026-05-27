import { useEffect, useState } from 'react';

const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'textarea',
  'select',
  'summary',
  '[role="button"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;

  const element = target.closest(INTERACTIVE_SELECTOR);
  if (!element) return false;

  return !element.hasAttribute('disabled') && element.getAttribute('aria-disabled') !== 'true';
};

const CustomCursor = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [interactive, setInteractive] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const setInteractiveState = (next: boolean) => {
      setInteractive(next);
      document.body.classList.toggle('is-hovering-clickable', next);
    };
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setInteractiveState(isInteractiveTarget(e.target));
    };
    const over = (e: PointerEvent) => setInteractiveState(isInteractiveTarget(e.target));
    const out = (e: PointerEvent) => {
      const next = e.relatedTarget;
      setInteractiveState(isInteractiveTarget(next));
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);

    window.addEventListener('mousemove', move);
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerout', out);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    window.addEventListener('mouseleave', up);

    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerout', out);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mouseleave', up);
      document.body.classList.remove('is-hovering-clickable');
    };
  }, []);

  return (
    <div
      className={`custom-cursor hidden md:block${interactive ? ' custom-cursor--interactive' : ''}${pressed ? ' custom-cursor--pressed' : ''}`}
      style={{ left: pos.x, top: pos.y }}
    />
  );
};

export default CustomCursor;
