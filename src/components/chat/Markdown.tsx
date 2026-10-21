import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

function CodeBlock({ children, className }: { children?: ReactNode; className?: string }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const lang = /language-([\w+-]+)/.exec(className ?? "")?.[1] ?? "code";
  const copy = async () => {
    await navigator.clipboard.writeText(ref.current?.innerText ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border bg-background/80">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{lang}</span>
        <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Copy code">
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      <pre ref={ref} className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-x">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const isBlock = /language-/.test(className ?? "") || String(children).includes("\n");
            return isBlock ? <CodeBlock className={className ?? ""}>{children}</CodeBlock> : <code>{children}</code>;
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
