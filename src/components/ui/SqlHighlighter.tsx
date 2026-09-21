import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/validation';

interface SqlHighlighterProps {
  code: string;
  maxLines?: number;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  className?: string;
  headerTitle?: string;
}

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS', 'FULL',
  'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'INTO', 'VALUES',
  'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW',
  'AS', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'ILIKE', 'IS', 'NULL', 'TRUE', 'FALSE',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'UNION', 'ALL', 'DISTINCT', 'WITH', 'EXISTS',
  'ASC', 'DESC', 'OVER', 'PARTITION', 'WINDOW', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'DEFAULT', 'CHECK', 'UNIQUE', 'CONSTRAINT', 'CASCADE', 'RETURNING'
]);

const SQL_FUNCTIONS = new Set([
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'COALESCE', 'DATE_FORMAT', 'CURDATE',
  'NOW', 'DATE', 'CONCAT', 'SUBSTRING', 'UPPER', 'LOWER', 'TRIM', 'IFNULL', 'CAST',
  'TO_CHAR', 'TO_DATE', 'EXTRACT', 'DATE_TRUNC', 'GEN_RANDOM_UUID', 'AUTH'
]);

export const SqlHighlighter: React.FC<SqlHighlighterProps> = ({
  code,
  maxLines,
  showLineNumbers = false,
  showCopyButton = true,
  className = '',
  headerTitle
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper to syntax-highlight a single line of SQL
  const highlightLine = (line: string): React.ReactNode => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('--')) {
      const leadingSpaces = line.length - trimmed.length;
      return (
        <span>
          {' '.repeat(leadingSpaces)}
          <span className="text-slate-400 italic font-normal">{trimmed}</span>
        </span>
      );
    }

    const regex = /(--.*$)|('[^']*'|"[^"]*")|(\b[a-zA-Z_][a-zA-Z0-9_]*\b)|(\b\d+(\.\d+)?\b)|(\s+|[^\s\w'"]+)/g;
    const elements: React.ReactNode[] = [];
    let match: RegExpExecArray | null;
    let keyIdx = 0;

    while ((match = regex.exec(line)) !== null) {
      const [fullMatch, comment, str, word, number] = match;

      if (comment) {
        elements.push(
          <span key={keyIdx++} className="text-slate-400 italic">
            {comment}
          </span>
        );
      } else if (str) {
        elements.push(
          <span key={keyIdx++} className="text-emerald-400">
            {str}
          </span>
        );
      } else if (word) {
        const upper = word.toUpperCase();
        if (SQL_KEYWORDS.has(upper)) {
          elements.push(
            <span key={keyIdx++} className="text-indigo-400 font-semibold">
              {word}
            </span>
          );
        } else if (SQL_FUNCTIONS.has(upper)) {
          elements.push(
            <span key={keyIdx++} className="text-amber-300 font-medium">
              {word}
            </span>
          );
        } else {
          elements.push(
            <span key={keyIdx++} className="text-slate-200">
              {word}
            </span>
          );
        }
      } else if (number) {
        elements.push(
          <span key={keyIdx++} className="text-cyan-300 font-mono">
            {number}
          </span>
        );
      } else {
        elements.push(
          <span key={keyIdx++} className="text-slate-300">
            {fullMatch}
          </span>
        );
      }
    }

    return elements.length > 0 ? elements : <span>{line || ' '}</span>;
  };

  const lines = code ? code.split('\n') : [''];
  const displayedLines = maxLines ? lines.slice(0, maxLines) : lines;
  const isTruncated = maxLines ? lines.length > maxLines : false;

  return (
    <div className={`relative bg-slate-950 rounded-xl border border-slate-800/80 shadow-inner overflow-hidden font-mono text-xs ${className}`}>
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800/80 text-slate-400 select-none">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          {headerTitle && (
            <span className="text-[11px] font-medium text-slate-400 ml-1.5 font-sans">
              {headerTitle}
            </span>
          )}
        </div>

        {showCopyButton && (
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-sans font-medium transition-all ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Copy SQL Query"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Code Body */}
      <div className="p-3.5 overflow-x-auto leading-relaxed">
        <pre className="font-mono text-xs text-slate-200">
          {displayedLines.map((line, idx) => (
            <div key={idx} className="flex group hover:bg-slate-900/50 -mx-3.5 px-3.5 rounded">
              {showLineNumbers && (
                <span className="w-7 mr-3 text-right text-slate-600 select-none flex-shrink-0 group-hover:text-slate-500 font-mono">
                  {idx + 1}
                </span>
              )}
              <span className="flex-1 whitespace-pre">{highlightLine(line)}</span>
            </div>
          ))}
          {isTruncated && (
            <div className="text-slate-500 italic mt-1 select-none">
              ... +{lines.length - maxLines} more lines
            </div>
          )}
        </pre>
      </div>
    </div>
  );
};
