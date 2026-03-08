import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, History, ChevronRight, ChevronLeft, ArrowRightLeft } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { Button } from '@/components/ui/button';
import { evaluate, pi, e as euler } from 'mathjs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface HistoryItem {
  expression: string;
  result: string;
}

const UNIT_CATEGORIES: Record<string, { units: string[]; convert: (val: number, from: string, to: string) => number }> = {
  Length: {
    units: ['m', 'km', 'cm', 'mm', 'in', 'ft', 'yd', 'mi'],
    convert: (v, f, t) => {
      const toM: Record<string, number> = { m: 1, km: 1000, cm: 0.01, mm: 0.001, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 };
      return v * toM[f] / toM[t];
    }
  },
  Weight: {
    units: ['kg', 'g', 'mg', 'lb', 'oz', 'ton'],
    convert: (v, f, t) => {
      const toKg: Record<string, number> = { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, ton: 1000 };
      return v * toKg[f] / toKg[t];
    }
  },
  Temperature: {
    units: ['°C', '°F', 'K'],
    convert: (v, f, t) => {
      let c = f === '°C' ? v : f === '°F' ? (v - 32) * 5 / 9 : v - 273.15;
      return t === '°C' ? c : t === '°F' ? c * 9 / 5 + 32 : c + 273.15;
    }
  },
  Speed: {
    units: ['m/s', 'km/h', 'mph', 'knots'],
    convert: (v, f, t) => {
      const toMs: Record<string, number> = { 'm/s': 1, 'km/h': 1 / 3.6, 'mph': 0.44704, 'knots': 0.514444 };
      return v * toMs[f] / toMs[t];
    }
  },
  Area: {
    units: ['m²', 'km²', 'cm²', 'ft²', 'acre', 'ha'],
    convert: (v, f, t) => {
      const toM2: Record<string, number> = { 'm²': 1, 'km²': 1e6, 'cm²': 1e-4, 'ft²': 0.092903, acre: 4046.86, ha: 10000 };
      return v * toM2[f] / toM2[t];
    }
  },
  Volume: {
    units: ['L', 'mL', 'gal', 'qt', 'pt', 'cup', 'fl oz', 'm³'],
    convert: (v, f, t) => {
      const toL: Record<string, number> = { L: 1, mL: 0.001, gal: 3.78541, qt: 0.946353, pt: 0.473176, cup: 0.236588, 'fl oz': 0.0295735, 'm³': 1000 };
      return v * toL[f] / toL[t];
    }
  },
};

const Calculator = () => {
  const [expression, setExpression] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [mode, setMode] = useState<'calc' | 'convert'>('calc');

  // Unit converter state
  const [unitCat, setUnitCat] = useState('Length');
  const [unitFrom, setUnitFrom] = useState('m');
  const [unitTo, setUnitTo] = useState('km');
  const [unitVal, setUnitVal] = useState('1');
  const [unitResult, setUnitResult] = useState('');

  const tryEvaluate = useCallback((expr: string) => {
    if (!expr.trim()) { setPreview(''); setError(''); return; }
    try {
      const result = evaluate(expr);
      setPreview(`= ${result}`);
      setError('');
    } catch {
      setPreview('');
      setError('SYNTAX ERROR');
    }
  }, []);

  useEffect(() => { tryEvaluate(expression); }, [expression, tryEvaluate]);

  useEffect(() => {
    const cat = UNIT_CATEGORIES[unitCat];
    if (!cat || !unitVal) { setUnitResult(''); return; }
    try {
      const val = parseFloat(unitVal);
      if (isNaN(val)) { setUnitResult(''); return; }
      setUnitResult(cat.convert(val, unitFrom, unitTo).toPrecision(10).replace(/\.?0+$/, ''));
    } catch { setUnitResult('ERR'); }
  }, [unitCat, unitFrom, unitTo, unitVal]);

  const calculate = () => {
    if (!expression.trim()) return;
    try {
      const result = evaluate(expression);
      setHistory(prev => [{ expression, result: String(result) }, ...prev].slice(0, 20));
      setExpression(String(result));
    } catch {
      setError('SYNTAX ERROR');
    }
  };

  const append = (val: string) => {
    const special: Record<string, string> = {
      'π': 'pi', 'e': 'e', '√': 'sqrt(', 'x²': '^2', 'x³': '^3', '1/x': '1/',
      '÷': '/', '×': '*', '−': '-', 'mod': '%', 'x^y': '^', 'EE': 'e', '±': '-',
      'sin': 'sin(', 'cos': 'cos(', 'tan': 'tan(', 'log': 'log10(', 'ln': 'log(',
      'asin': 'asin(', 'acos': 'acos(', 'atan': 'atan(', 'log2': 'log2(', 'abs': 'abs(', '!': '!',
    };
    setExpression(prev => prev + (special[val] || val));
  };

  const clear = () => { setExpression(''); setPreview(''); setError(''); };
  const clearEntry = () => setExpression(prev => prev.slice(0, -1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (mode !== 'calc') return;
      if (e.key === 'Enter') { e.preventDefault(); calculate(); }
      else if (e.key === 'Escape') clear();
      else if (e.key === 'Backspace') clearEntry();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [expression, mode]);

  const btnClass = (type: 'num' | 'op' | 'fn' | 'eq' | 'clear') => {
    const base = 'font-mono text-sm rounded-lg border transition-all active:scale-95 h-12 ';
    switch (type) {
      case 'num': return base + 'bg-muted/30 border-primary/10 text-foreground hover:bg-muted/50';
      case 'op': return base + 'bg-muted/20 border-secondary/20 text-secondary hover:bg-muted/40';
      case 'fn': return base + 'bg-muted/10 border-primary/15 text-primary hover:bg-primary/10';
      case 'eq': return base + 'bg-primary border-primary text-primary-foreground hover:bg-primary/90 row-span-2';
      case 'clear': return base + 'bg-muted/20 border-destructive/20 text-destructive hover:bg-destructive/10';
    }
  };

  const swapUnits = () => { setUnitFrom(unitTo); setUnitTo(unitFrom); };

  return (
    <ToolLayout title="> CALCULATOR.exe" subtitle="// Scientific calculator with expression history">
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'calc' | 'convert')}>
        <TabsList className="bg-muted/30 border border-primary/15 mb-6">
          <TabsTrigger value="calc" className="font-mono text-xs data-[state=active]:text-primary">CALCULATOR</TabsTrigger>
          <TabsTrigger value="convert" className="font-mono text-xs data-[state=active]:text-primary">CONVERTER</TabsTrigger>
        </TabsList>

        <TabsContent value="calc">
          <div className="flex gap-4 max-w-3xl">
            {/* Calculator */}
            <div className="flex-1 space-y-4">
              {/* Display */}
              <div className="glass-card rounded-lg p-4 border border-primary/20">
                <div className="text-right">
                  <input
                    value={expression}
                    onChange={e => setExpression(e.target.value)}
                    className="w-full bg-transparent text-right font-mono text-xl text-foreground focus:outline-none"
                    placeholder="0"
                  />
                  <div className={`font-mono text-sm h-6 text-right ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {error || preview}
                  </div>
                </div>
              </div>

              {/* Functions row 1 */}
              <div className="grid grid-cols-6 gap-1.5">
                {['sin', 'cos', 'tan', 'log', 'ln', '√'].map(b => (
                  <button key={b} onClick={() => append(b)} className={btnClass('fn')}>{b}</button>
                ))}
              </div>
              {/* Functions row 2 */}
              <div className="grid grid-cols-6 gap-1.5">
                {['asin', 'acos', 'atan', 'log2', 'abs', '!'].map(b => (
                  <button key={b} onClick={() => append(b)} className={btnClass('fn')}>{b}</button>
                ))}
              </div>
              {/* Row 3 */}
              <div className="grid grid-cols-6 gap-1.5">
                {['π', 'e', '^', 'x²', 'x³', '1/x'].map(b => (
                  <button key={b} onClick={() => append(b)} className={btnClass('fn')}>{b}</button>
                ))}
              </div>
              {/* Row 4 */}
              <div className="grid grid-cols-6 gap-1.5">
                {['(', ')', '%'].map(b => (
                  <button key={b} onClick={() => append(b)} className={btnClass('op')}>{b}</button>
                ))}
                <button onClick={clearEntry} className={btnClass('clear')}>CE</button>
                <button onClick={clear} className={btnClass('clear')}>C</button>
                <button onClick={clearEntry} className={btnClass('clear')}>⌫</button>
              </div>
              {/* Number pad + operators */}
              <div className="grid grid-cols-5 gap-1.5">
                {['7','8','9'].map(b => <button key={b} onClick={() => append(b)} className={btnClass('num')}>{b}</button>)}
                <button onClick={() => append('÷')} className={btnClass('op')}>÷</button>
                <button onClick={() => append('mod')} className={btnClass('op')}>mod</button>

                {['4','5','6'].map(b => <button key={b} onClick={() => append(b)} className={btnClass('num')}>{b}</button>)}
                <button onClick={() => append('×')} className={btnClass('op')}>×</button>
                <button onClick={() => append('x^y')} className={btnClass('op')}>x^y</button>

                {['1','2','3'].map(b => <button key={b} onClick={() => append(b)} className={btnClass('num')}>{b}</button>)}
                <button onClick={() => append('−')} className={btnClass('op')}>−</button>
                <button onClick={() => append('EE')} className={btnClass('op')}>EE</button>

                <button onClick={() => append('±')} className={btnClass('num')}>±</button>
                <button onClick={() => append('0')} className={btnClass('num')}>0</button>
                <button onClick={() => append('.')} className={btnClass('num')}>.</button>
                <button onClick={() => append('+')} className={btnClass('op')}>+</button>
                <button onClick={calculate} className={btnClass('eq')}>=</button>
              </div>
            </div>

            {/* History panel */}
            <div className={`transition-all ${showHistory ? 'w-64' : 'w-8'}`}>
              <button onClick={() => setShowHistory(!showHistory)} className="mb-2 text-muted-foreground hover:text-primary">
                {showHistory ? <ChevronRight size={16} /> : <History size={16} />}
              </button>
              {showHistory && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-primary">// HISTORY</span>
                    <button onClick={() => setHistory([])} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                  </div>
                  {history.length === 0 && <p className="font-mono text-[10px] text-muted-foreground">No history yet</p>}
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setExpression(h.expression)}
                      className="w-full text-left p-2 rounded hover:bg-muted/30 transition-colors"
                    >
                      <p className="font-mono text-[10px] text-muted-foreground truncate">{h.expression}</p>
                      <p className="font-mono text-xs text-primary truncate">= {h.result}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="convert">
          <div className="max-w-lg space-y-6">
            {/* Category */}
            <div className="flex flex-wrap gap-2">
              {Object.keys(UNIT_CATEGORIES).map(cat => (
                <button
                  key={cat}
                  onClick={() => { setUnitCat(cat); const u = UNIT_CATEGORIES[cat].units; setUnitFrom(u[0]); setUnitTo(u[1]); }}
                  className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${
                    unitCat === cat ? 'border-primary bg-primary/10 text-primary' : 'border-primary/15 text-muted-foreground hover:text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* From */}
            <div className="glass-card rounded-lg p-4 space-y-3">
              <div className="flex gap-3">
                <input
                  type="number"
                  value={unitVal}
                  onChange={e => setUnitVal(e.target.value)}
                  className="flex-1 px-3 py-2 bg-muted/50 border border-primary/15 rounded font-mono text-lg text-foreground focus:outline-none focus:border-primary/60"
                />
                <select
                  value={unitFrom}
                  onChange={e => setUnitFrom(e.target.value)}
                  className="px-3 py-2 bg-muted/50 border border-primary/15 rounded font-mono text-sm text-foreground focus:outline-none"
                >
                  {UNIT_CATEGORIES[unitCat]?.units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="flex justify-center">
                <button onClick={swapUnits} className="p-2 rounded-full border border-primary/20 text-primary hover:bg-primary/10 transition-colors">
                  <ArrowRightLeft size={16} />
                </button>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 px-3 py-2 bg-muted/30 border border-primary/20 rounded font-mono text-lg text-primary min-h-[44px]">
                  {unitResult || '—'}
                </div>
                <select
                  value={unitTo}
                  onChange={e => setUnitTo(e.target.value)}
                  className="px-3 py-2 bg-muted/50 border border-primary/15 rounded font-mono text-sm text-foreground focus:outline-none"
                >
                  {UNIT_CATEGORIES[unitCat]?.units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </ToolLayout>
  );
};

export default Calculator;
