import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Download, Bold, Italic, Strikethrough, Code, Link2, Image, Table, Quote, Minus } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { useCopy } from '@/lib/copy';

const INITIAL = `# Hello World

This is a **Markdown** editor with *live preview*.

## Features
- Real-time rendering
- Syntax highlighting for code blocks
- Tables, blockquotes, and more

\`\`\`javascript
const greeting = "Hello, Developer!";
console.log(greeting);
\`\`\`

> "Code is poetry" — Unknown

| Feature | Status |
|---------|--------|
| Bold    | ✅     |
| Tables  | ✅     |
| Links   | ✅     |

[Visit GitHub](https://github.com)
`;

type ViewMode = 'SPLIT' | 'EDIT' | 'PREVIEW';

const MarkdownEditor = () => {
  const [md, setMd] = useState(INITIAL);
  const [view, setView] = useState<ViewMode>('SPLIT');
  const copyMd = useCopy();
  const copyHtml = useCopy();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    const raw = marked.parse(md, { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [md]);

  const wordCount = useMemo(() => md.trim().split(/\s+/).filter(Boolean).length, [md]);
  const charCount = md.length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const insert = useCallback((before: string, after = '') => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = md.slice(start, end);
    const newText = md.slice(0, start) + before + selected + after + md.slice(end);
    setMd(newText);
    setTimeout(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = start + before.length + selected.length;
    }, 0);
  }, [md]);

  const download = () => {
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.download = 'document.md';
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Sync scroll
  const handleEditorScroll = () => {
    if (!editorRef.current || !previewRef.current || view !== 'SPLIT') return;
    const ratio = editorRef.current.scrollTop / (editorRef.current.scrollHeight - editorRef.current.clientHeight || 1);
    previewRef.current.scrollTop = ratio * (previewRef.current.scrollHeight - previewRef.current.clientHeight);
  };

  const ToolBtn = ({ icon: Icon, onClick, label }: { icon: React.ElementType; onClick: () => void; label: string }) => (
    <button onClick={onClick} title={label} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
      <Icon size={14} />
    </button>
  );

  return (
    <ToolLayout title='> MARKDOWN_EDITOR.exe' subtitle="// Write & preview Markdown in real-time">
      {/* Toolbar */}
      <div className="glass-card rounded-t-lg px-3 py-2 flex items-center gap-1 border-b border-primary/15 flex-wrap">
        <ToolBtn icon={Bold} onClick={() => insert('**', '**')} label="Bold" />
        <ToolBtn icon={Italic} onClick={() => insert('*', '*')} label="Italic" />
        <ToolBtn icon={Strikethrough} onClick={() => insert('~~', '~~')} label="Strikethrough" />
        <ToolBtn icon={Code} onClick={() => insert('`', '`')} label="Code" />
        <ToolBtn icon={Link2} onClick={() => insert('[', '](url)')} label="Link" />
        <ToolBtn icon={Image} onClick={() => insert('![alt](', ')')} label="Image" />
        <ToolBtn icon={Table} onClick={() => insert('\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n')} label="Table" />
        <ToolBtn icon={Quote} onClick={() => insert('> ')} label="Blockquote" />
        <ToolBtn icon={Minus} onClick={() => insert('\n---\n')} label="Horizontal Rule" />
        <div className="flex-1" />
        <div className="flex gap-1">
          {(['SPLIT', 'EDIT', 'PREVIEW'] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`font-mono text-[10px] px-2 py-1 rounded border ${view === v ? 'border-primary text-primary' : 'border-primary/15 text-muted-foreground'}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className={`flex ${view === 'SPLIT' ? '' : ''} glass-card rounded-b-lg overflow-hidden`} style={{ minHeight: '500px' }}>
        {(view === 'SPLIT' || view === 'EDIT') && (
          <div className={`${view === 'SPLIT' ? 'w-1/2 border-r border-primary/15' : 'w-full'} relative`}>
            <textarea
              ref={editorRef}
              value={md}
              onChange={(e) => setMd(e.target.value)}
              onScroll={handleEditorScroll}
              className="w-full h-[500px] p-4 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
              spellCheck={false}
            />
          </div>
        )}
        {(view === 'SPLIT' || view === 'PREVIEW') && (
          <div ref={previewRef} className={`${view === 'SPLIT' ? 'w-1/2' : 'w-full'} h-[500px] overflow-auto p-6`}>
            <div
              className="prose prose-invert max-w-none
                [&_h1]:font-display [&_h1]:text-primary [&_h1]:neon-text-green
                [&_h2]:font-display [&_h2]:text-primary
                [&_h3]:font-display [&_h3]:text-foreground
                [&_code]:bg-muted [&_code]:text-primary [&_code]:px-1 [&_code]:rounded
                [&_pre]:bg-muted/80 [&_pre]:border [&_pre]:border-primary/15
                [&_pre_code]:bg-transparent
                [&_blockquote]:border-l-accent [&_blockquote]:border-l-2 [&_blockquote]:text-muted-foreground
                [&_a]:text-secondary [&_a]:no-underline hover:[&_a]:underline
                [&_table]:border-primary/20
                [&_th]:border-primary/20 [&_th]:text-primary
                [&_td]:border-primary/20
              "
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between mt-3 gap-2">
        <span className="font-mono text-xs text-muted-foreground">
          // {wordCount} words · {charCount} chars · {readTime} min read
        </span>
        <div className="flex gap-2">
          <button onClick={() => copyMd.copy(md)} className="font-mono text-[10px] text-muted-foreground hover:text-primary">{copyMd.copied ? '[✓ COPIED]' : '[_COPY MARKDOWN]'}</button>
          <button onClick={() => copyHtml.copy(html)} className="font-mono text-[10px] text-muted-foreground hover:text-primary">{copyHtml.copied ? '[✓ COPIED]' : '[_COPY HTML]'}</button>
          <button onClick={download} className="font-mono text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"><Download size={10} />[_DOWNLOAD .md]</button>
        </div>
      </div>
    </ToolLayout>
  );
};

export default MarkdownEditor;
