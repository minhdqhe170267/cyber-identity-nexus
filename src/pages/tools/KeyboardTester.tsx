import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import ToolLayout from '@/components/ToolLayout';
import { Progress } from '@/components/ui/progress';


// Key definitions for QWERTY layout
type KeyDef = { code: string; label: string; width?: number };

const ROW_FUNCTION: KeyDef[] = [
  { code: 'Escape', label: 'Esc', width: 1.5 },
  { code: 'F1', label: 'F1' }, { code: 'F2', label: 'F2' }, { code: 'F3', label: 'F3' }, { code: 'F4', label: 'F4' },
  { code: 'F5', label: 'F5' }, { code: 'F6', label: 'F6' }, { code: 'F7', label: 'F7' }, { code: 'F8', label: 'F8' },
  { code: 'F9', label: 'F9' }, { code: 'F10', label: 'F10' }, { code: 'F11', label: 'F11' }, { code: 'F12', label: 'F12' },
  { code: 'PrintScreen', label: 'PrtSc' }, { code: 'ScrollLock', label: 'ScrLk' }, { code: 'Pause', label: 'Pause' },
];

const ROW_NUMBER: KeyDef[] = [
  { code: 'Backquote', label: '`' },
  { code: 'Digit1', label: '1' }, { code: 'Digit2', label: '2' }, { code: 'Digit3', label: '3' },
  { code: 'Digit4', label: '4' }, { code: 'Digit5', label: '5' }, { code: 'Digit6', label: '6' },
  { code: 'Digit7', label: '7' }, { code: 'Digit8', label: '8' }, { code: 'Digit9', label: '9' },
  { code: 'Digit0', label: '0' }, { code: 'Minus', label: '-' }, { code: 'Equal', label: '=' },
  { code: 'Backspace', label: '⌫ Bksp', width: 2 },
];

const ROW_TOP: KeyDef[] = [
  { code: 'Tab', label: 'Tab', width: 1.5 },
  { code: 'KeyQ', label: 'Q' }, { code: 'KeyW', label: 'W' }, { code: 'KeyE', label: 'E' },
  { code: 'KeyR', label: 'R' }, { code: 'KeyT', label: 'T' }, { code: 'KeyY', label: 'Y' },
  { code: 'KeyU', label: 'U' }, { code: 'KeyI', label: 'I' }, { code: 'KeyO', label: 'O' },
  { code: 'KeyP', label: 'P' }, { code: 'BracketLeft', label: '[' }, { code: 'BracketRight', label: ']' },
  { code: 'Backslash', label: '\\', width: 1.5 },
];

const ROW_HOME: KeyDef[] = [
  { code: 'CapsLock', label: 'Caps', width: 1.75 },
  { code: 'KeyA', label: 'A' }, { code: 'KeyS', label: 'S' }, { code: 'KeyD', label: 'D' },
  { code: 'KeyF', label: 'F' }, { code: 'KeyG', label: 'G' }, { code: 'KeyH', label: 'H' },
  { code: 'KeyJ', label: 'J' }, { code: 'KeyK', label: 'K' }, { code: 'KeyL', label: 'L' },
  { code: 'Semicolon', label: ';' }, { code: 'Quote', label: "'" },
  { code: 'Enter', label: 'Enter', width: 2.25 },
];

const ROW_BOTTOM: KeyDef[] = [
  { code: 'ShiftLeft', label: 'Shift', width: 2.25 },
  { code: 'KeyZ', label: 'Z' }, { code: 'KeyX', label: 'X' }, { code: 'KeyC', label: 'C' },
  { code: 'KeyV', label: 'V' }, { code: 'KeyB', label: 'B' }, { code: 'KeyN', label: 'N' },
  { code: 'KeyM', label: 'M' }, { code: 'Comma', label: ',' }, { code: 'Period', label: '.' },
  { code: 'Slash', label: '/' },
  { code: 'ShiftRight', label: 'Shift', width: 2.75 },
];

const ROW_SPACE: KeyDef[] = [
  { code: 'ControlLeft', label: 'Ctrl', width: 1.25 },
  { code: 'MetaLeft', label: 'Win', width: 1.25 },
  { code: 'AltLeft', label: 'Alt', width: 1.25 },
  { code: 'Space', label: 'Space', width: 6.25 },
  { code: 'AltRight', label: 'Alt', width: 1.25 },
  { code: 'ContextMenu', label: 'Menu', width: 1.25 },
  { code: 'ControlRight', label: 'Ctrl', width: 1.25 },
];

const ARROW_KEYS: KeyDef[] = [
  { code: 'ArrowUp', label: '↑' },
  { code: 'ArrowLeft', label: '←' },
  { code: 'ArrowDown', label: '↓' },
  { code: 'ArrowRight', label: '→' },
];

const NUMPAD_KEYS: KeyDef[] = [
  { code: 'NumLock', label: 'Num' }, { code: 'NumpadDivide', label: '/' }, { code: 'NumpadMultiply', label: '*' }, { code: 'NumpadSubtract', label: '-' },
  { code: 'Numpad7', label: '7' }, { code: 'Numpad8', label: '8' }, { code: 'Numpad9', label: '9' }, { code: 'NumpadAdd', label: '+' },
  { code: 'Numpad4', label: '4' }, { code: 'Numpad5', label: '5' }, { code: 'Numpad6', label: '' },
  { code: 'Numpad1', label: '1' }, { code: 'Numpad2', label: '2' }, { code: 'Numpad3', label: '' },
  { code: 'Numpad0', label: '0', width: 2 }, { code: 'NumpadDecimal', label: '.' }, { code: 'NumpadEnter', label: '↵' },
];

const ALL_KEYS = [
  ...ROW_FUNCTION, ...ROW_NUMBER, ...ROW_TOP, ...ROW_HOME, ...ROW_BOTTOM, ...ROW_SPACE,
  ...ARROW_KEYS, ...NUMPAD_KEYS,
];

const BLOCKED_KEYS = new Set([
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
  'Tab', 'PrintScreen', 'ScrollLock', 'Pause',
]);

const KeyboardTester = () => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [testedKeys, setTestedKeys] = useState<Set<string>>(new Set());
  const [lastKey, setLastKey] = useState<{ key: string; code: string; keyCode: number; ctrl: boolean; alt: boolean; shift: boolean; meta: boolean } | null>(null);
  const [showNumpad, setShowNumpad] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent default for problematic keys
    if (BLOCKED_KEYS.has(e.code) || e.ctrlKey || e.altKey || e.metaKey) {
      e.preventDefault();
    }

    setPressedKeys(prev => new Set(prev).add(e.code));
    setTestedKeys(prev => new Set(prev).add(e.code));
    setLastKey({
      key: e.key,
      code: e.code,
      keyCode: e.keyCode,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey,
    });
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.delete(e.code);
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const totalKeys = ALL_KEYS.length;
  const testedCount = ALL_KEYS.filter(k => testedKeys.has(k.code)).length;
  const progress = (testedCount / totalKeys) * 100;

  const renderKey = (k: KeyDef) => {
    const isPressed = pressedKeys.has(k.code);
    const isTested = testedKeys.has(k.code);
    const w = k.width || 1;

    return (
      <button
        key={k.code}
        className={`
          relative font-mono text-[10px] sm:text-xs rounded border transition-all duration-100 select-none
          flex items-center justify-center
          ${isPressed
            ? 'bg-primary text-primary-foreground border-primary scale-95 shadow-[0_0_12px_hsl(var(--primary)/0.6)]'
            : isTested
              ? 'bg-muted/30 text-secondary border-secondary/60 shadow-[0_0_6px_hsl(var(--secondary)/0.2)]'
              : 'bg-muted/20 text-muted-foreground border-primary/20 hover:border-primary/40'
          }
        `}
        style={{
          width: `${w * 2.8}rem`,
          height: '2.4rem',
          minWidth: `${w * 2.4}rem`,
        }}
        tabIndex={-1}
      >
        {k.label}
      </button>
    );
  };

  const renderRow = (keys: KeyDef[]) => (
    <div className="flex gap-1 justify-center">{keys.map(renderKey)}</div>
  );

  return (
    <ToolLayout title='> KEYBOARD_TEST.exe' subtitle="// Press any key to test your keyboard">
      <div className="space-y-6">
        {/* Held keys display */}
        <div className="flex items-center gap-2 flex-wrap min-h-[2rem]">
          <span className="font-mono text-xs text-muted-foreground">HOLDING:</span>
          {pressedKeys.size === 0 && <span className="font-mono text-xs text-muted-foreground/50">// none</span>}
          {[...pressedKeys].map(code => (
            <span key={code} className="font-mono text-[10px] px-2 py-0.5 rounded border border-primary bg-primary/20 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]">
              {code}
            </span>
          ))}
          {pressedKeys.size > 1 && (
            <span className="font-mono text-[10px] text-secondary ml-2">
              // {pressedKeys.size} KEYS HELD SIMULTANEOUSLY
            </span>
          )}
        </div>

        {/* Keyboard layout */}
        <div className="glass-card rounded-lg p-3 sm:p-4 space-y-1 overflow-x-auto">
          {renderRow(ROW_FUNCTION)}
          <div className="h-2" />
          {renderRow(ROW_NUMBER)}
          {renderRow(ROW_TOP)}
          {renderRow(ROW_HOME)}
          {renderRow(ROW_BOTTOM)}
          {renderRow(ROW_SPACE)}

          {/* Arrow keys */}
          <div className="flex justify-center gap-1 pt-2">
            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-1">{renderKey(ARROW_KEYS[0])}</div>
              <div className="flex gap-1">
                {renderKey(ARROW_KEYS[1])}
                {renderKey(ARROW_KEYS[2])}
                {renderKey(ARROW_KEYS[3])}
              </div>
            </div>
          </div>
        </div>

        {/* Numpad toggle */}
        <div>
          <button
            onClick={() => setShowNumpad(!showNumpad)}
            className="font-mono text-xs text-primary border border-primary/30 px-3 py-1.5 rounded hover:bg-primary/10 transition-colors"
          >
            {showNumpad ? '[_HIDE NUMPAD]' : '[_SHOW NUMPAD]'}
          </button>
          {showNumpad && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="glass-card rounded-lg p-4 mt-3"
            >
              <div className="grid grid-cols-4 gap-1 max-w-[12rem] mx-auto">
                {NUMPAD_KEYS.map(renderKey)}
              </div>
            </motion.div>
          )}
        </div>

        {/* Key info panel */}
        {lastKey && (
          <motion.div
            key={lastKey.code + lastKey.keyCode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-lg p-4"
          >
            <p className="font-display text-sm text-primary mb-3">
              KEY DETECTED: {lastKey.key.toUpperCase()}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="font-mono text-[10px] px-2 py-1 rounded border border-primary/30 text-foreground">
                Code: <span className="text-primary">{lastKey.code}</span>
              </span>
              <span className="font-mono text-[10px] px-2 py-1 rounded border border-primary/30 text-foreground">
                KeyCode: <span className="text-secondary">{lastKey.keyCode}</span>
              </span>
              <span className={`font-mono text-[10px] px-2 py-1 rounded border ${lastKey.ctrl ? 'border-primary bg-primary/20 text-primary' : 'border-muted text-muted-foreground'}`}>
                Ctrl={String(lastKey.ctrl)}
              </span>
              <span className={`font-mono text-[10px] px-2 py-1 rounded border ${lastKey.alt ? 'border-primary bg-primary/20 text-primary' : 'border-muted text-muted-foreground'}`}>
                Alt={String(lastKey.alt)}
              </span>
              <span className={`font-mono text-[10px] px-2 py-1 rounded border ${lastKey.shift ? 'border-primary bg-primary/20 text-primary' : 'border-muted text-muted-foreground'}`}>
                Shift={String(lastKey.shift)}
              </span>
              <span className={`font-mono text-[10px] px-2 py-1 rounded border ${lastKey.meta ? 'border-primary bg-primary/20 text-primary' : 'border-muted text-muted-foreground'}`}>
                Meta={String(lastKey.meta)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Stats bar */}
        <div className="glass-card rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">
              // {testedCount} / {totalKeys} KEYS TESTED
            </span>
            <button
              onClick={() => { setTestedKeys(new Set()); setLastKey(null); }}
              className="font-mono text-xs text-destructive border border-destructive/30 px-3 py-1 rounded hover:bg-destructive/10 transition-colors"
            >
              [_RESET ALL]
            </button>
          </div>
          <Progress value={progress} className="h-2 bg-muted/30" />
        </div>

        <p className="font-mono text-[10px] text-muted-foreground/50 text-center">
          // Some keys (F5, Ctrl+W) are blocked by browser — capture may vary
        </p>
      </div>
    </ToolLayout>
  );
};

export default KeyboardTester;
