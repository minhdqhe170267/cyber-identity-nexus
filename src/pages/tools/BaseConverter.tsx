import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';

type Base = 'dec' | 'bin' | 'hex' | 'oct';

interface BaseField {
  id: Base;
  label: string;
  base: number;
  prefix: string;
  color: string;
  validate: RegExp;
}

const FIELDS: BaseField[] = [
  { id: 'dec', label: 'DECIMAL', base: 10, prefix: '', color: 'text-primary', validate: /^[0-9]*$/ },
  { id: 'bin', label: 'BINARY', base: 2, prefix: '', color: 'text-secondary', validate: /^[01\s]*$/ },
  { id: 'hex', label: 'HEXADECIMAL', base: 16, prefix: '0x', color: 'text-destructive', validate: /^[0-9a-fA-F\s]*$/ },
  { id: 'oct', label: 'OCTAL', base: 8, prefix: '0o', color: 'text-[hsl(40,100%,60%)]', validate: /^[0-7\s]*$/ },
];

const formatBinary = (bin: string) => {
  const clean = bin.replace(/\s/g, '');
  const padded = clean.padStart(Math.ceil(clean.length / 4) * 4, '0');
  return padded.match(/.{4}/g)?.join(' ') || '';
};

const formatHex = (hex: string) => {
  const clean = hex.replace(/\s/g, '').toUpperCase();
  return clean.match(/.{1,2}/g)?.join(' ') || '';
};

type Op = 'AND' | 'OR' | 'XOR' | 'NOT' | 'LSHIFT' | 'RSHIFT';

const BaseConverter = () => {
  const [values, setValues] = useState<Record<Base, string>>({ dec: '', bin: '', hex: '', oct: '' });
  const [activeField, setActiveField] = useState<Base | null>(null);
  const [error, setError] = useState<Record<Base, boolean>>({ dec: false, bin: false, hex: false, oct: false });
  const [showExtra, setShowExtra] = useState(false);
  const [bitView, setBitView] = useState<8 | 16 | 32 | 64>(8);
  const [showOps, setShowOps] = useState(false);
  const [opA, setOpA] = useState('');
  const [opB, setOpB] = useState('');
  const [op, setOp] = useState<Op>('AND');

  const decimalValue = useMemo(() => {
    const v = values.dec.replace(/\s/g, '');
    return v ? parseInt(v, 10) : NaN;
  }, [values.dec]);

  const updateFromBase = (base: Base, input: string) => {
    const field = FIELDS.find(f => f.id === base)!;
    const clean = input.replace(/\s/g, '');
    
    if (input && !field.validate.test(clean)) {
      setError(prev => ({ ...prev, [base]: true }));
      setValues(prev => ({ ...prev, [base]: input }));
      return;
    }
    setError(prev => ({ ...prev, [base]: false }));

    if (!clean) {
      setValues({ dec: '', bin: '', hex: '', oct: '' });
      return;
    }

    const num = parseInt(clean, field.base);
    if (isNaN(num) || num < 0) {
      setValues(prev => ({ ...prev, [base]: input }));
      return;
    }

    setValues({
      dec: num.toString(10),
      bin: formatBinary(num.toString(2)),
      hex: formatHex(num.toString(16)),
      oct: num.toString(8),
    });
    // Keep original input format for active field
    setValues(prev => ({ ...prev, [base]: input }));
  };

  const bits = useMemo(() => {
    const v = values.dec.replace(/\s/g, '');
    const num = v ? parseInt(v, 10) : 0;
    if (isNaN(num) || num < 0) return Array(bitView).fill(0);
    const binary = (num >>> 0).toString(2).padStart(bitView, '0').slice(-bitView);
    return binary.split('').map(Number);
  }, [values.dec, bitView]);

  const toggleBit = (index: number) => {
    const newBits = [...bits];
    newBits[index] = newBits[index] ? 0 : 1;
    const num = parseInt(newBits.join(''), 2);
    updateFromBase('dec', num.toString(10));
  };

  const hexColor = useMemo(() => {
    const clean = values.hex.replace(/\s/g, '').toUpperCase();
    if (clean.length === 6 && /^[0-9A-F]{6}$/.test(clean)) {
      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);
      return { hex: `#${clean}`, r, g, b };
    }
    return null;
  }, [values.hex]);

  // Extra bases
  const extraBases = useMemo(() => {
    const v = values.dec.replace(/\s/g, '');
    const num = v ? parseInt(v, 10) : NaN;
    if (isNaN(num) || num < 0) return { b32: '', b58: '', b64: '' };
    return {
      b32: num.toString(32).toUpperCase(),
      b58: num.toString(), // simplified
      b64: btoa(num.toString()),
    };
  }, [values.dec]);

  // Operations
  const opResult = useMemo(() => {
    const a = parseInt(opA, 10);
    const b = parseInt(opB, 10);
    if (isNaN(a)) return null;
    let result: number;
    switch (op) {
      case 'AND': result = isNaN(b) ? a : a & b; break;
      case 'OR': result = isNaN(b) ? a : a | b; break;
      case 'XOR': result = isNaN(b) ? a : a ^ b; break;
      case 'NOT': result = ~a; break;
      case 'LSHIFT': result = a << (isNaN(b) ? 1 : b); break;
      case 'RSHIFT': result = a >> (isNaN(b) ? 1 : b); break;
      default: result = 0;
    }
    return {
      dec: result.toString(10),
      bin: formatBinary((result >>> 0).toString(2)),
      hex: formatHex((result >>> 0).toString(16)),
    };
  }, [opA, opB, op]);

  const ops: Op[] = ['AND', 'OR', 'XOR', 'NOT', 'LSHIFT', 'RSHIFT'];

  return (
    <ToolLayout title="> BASE_CONVERTER.exe" subtitle="// Convert numbers between decimal, binary, hex, octal">
      {/* Main converter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {FIELDS.map(field => (
          <div key={field.id} className="glass-card rounded-lg p-4">
            <label className={`font-display text-xs ${field.color} mb-2 block`}>
              {field.label} (base {field.base})
            </label>
            <div className="flex items-center gap-2">
              {field.prefix && <span className="font-mono text-xs text-muted-foreground">{field.prefix}</span>}
              <input
                value={values[field.id]}
                onChange={e => { setActiveField(field.id); updateFromBase(field.id, e.target.value); }}
                onFocus={() => setActiveField(field.id)}
                placeholder="0"
                className={`w-full px-3 py-2 bg-muted/30 border rounded font-mono text-sm text-foreground focus:outline-none transition-colors ${
                  error[field.id] ? 'border-destructive' : activeField === field.id ? 'border-primary/60' : 'border-primary/15'
                }`}
                spellCheck={false}
              />
            </div>
            {error[field.id] && <p className="font-mono text-[10px] text-destructive mt-1">Invalid {field.label.toLowerCase()} input</p>}
            {field.id === 'hex' && hexColor && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-6 h-6 rounded border border-primary/20" style={{ backgroundColor: hexColor.hex }} />
                <span className="font-mono text-[10px] text-muted-foreground">R:{hexColor.r} G:{hexColor.g} B:{hexColor.b}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Extra bases */}
      <button onClick={() => setShowExtra(!showExtra)} className="flex items-center gap-1 font-mono text-xs text-primary mb-4 hover:underline">
        {showExtra ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showExtra ? 'HIDE' : '+ MORE BASES'}
      </button>
      {showExtra && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'BASE 32', value: extraBases.b32 },
            { label: 'BASE 64', value: extraBases.b64 },
          ].map(b => (
            <div key={b.label} className="glass-card rounded-lg p-3">
              <label className="font-mono text-[10px] text-muted-foreground">{b.label}</label>
              <p className="font-mono text-sm text-foreground mt-1 break-all">{b.value || '—'}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Bit visualization */}
      <div className="glass-card rounded-lg p-4 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-mono text-xs text-primary">// BIT VISUALIZATION</h3>
          <div className="flex gap-1">
            {([8, 16, 32] as const).map(v => (
              <button
                key={v}
                onClick={() => setBitView(v)}
                className={`font-mono text-[10px] px-2 py-1 rounded border transition-all ${
                  bitView === v ? 'border-primary bg-primary/10 text-primary' : 'border-primary/15 text-muted-foreground hover:text-primary'
                }`}
              >
                {v}-bit
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {bits.map((bit, i) => (
            <div key={i} className="relative group">
              {i > 0 && i % 8 === 0 && <div className="inline-block w-2" />}
              <button
                onClick={() => toggleBit(i)}
                className={`w-7 h-7 rounded text-[10px] font-mono border transition-all ${
                  bit ? 'bg-primary/20 border-primary text-primary shadow-[0_0_8px_rgba(0,255,156,0.3)]' : 'bg-muted/20 border-primary/10 text-muted-foreground'
                } hover:border-primary/60`}
              >
                {bit}
              </button>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-mono text-[8px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                {bitView - 1 - i}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bit operations */}
      <button onClick={() => setShowOps(!showOps)} className="flex items-center gap-1 font-mono text-xs text-primary mb-4 hover:underline">
        {showOps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showOps ? 'HIDE OPERATIONS' : '+ BIT OPERATIONS'}
      </button>
      {showOps && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="font-mono text-[10px] text-muted-foreground">A (decimal)</label>
              <input
                value={opA}
                onChange={e => setOpA(e.target.value)}
                type="number"
                className="w-28 px-2 py-1.5 bg-muted/30 border border-primary/15 rounded font-mono text-sm text-foreground focus:outline-none focus:border-primary/60"
              />
            </div>
            <div className="flex gap-1">
              {ops.map(o => (
                <button
                  key={o}
                  onClick={() => setOp(o)}
                  className={`font-mono text-[10px] px-2 py-1.5 rounded border transition-all ${
                    op === o ? 'border-primary bg-primary/10 text-primary' : 'border-primary/15 text-muted-foreground hover:text-primary'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
            {op !== 'NOT' && (
              <div>
                <label className="font-mono text-[10px] text-muted-foreground">B</label>
                <input
                  value={opB}
                  onChange={e => setOpB(e.target.value)}
                  type="number"
                  className="w-28 px-2 py-1.5 bg-muted/30 border border-primary/15 rounded font-mono text-sm text-foreground focus:outline-none focus:border-primary/60"
                />
              </div>
            )}
          </div>
          {opResult && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="font-mono text-[10px] text-muted-foreground">DEC</span>
                <p className="font-mono text-sm text-primary">{opResult.dec}</p>
              </div>
              <div>
                <span className="font-mono text-[10px] text-muted-foreground">BIN</span>
                <p className="font-mono text-sm text-secondary break-all">{opResult.bin}</p>
              </div>
              <div>
                <span className="font-mono text-[10px] text-muted-foreground">HEX</span>
                <p className="font-mono text-sm text-destructive">{opResult.hex}</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </ToolLayout>
  );
};

export default BaseConverter;
