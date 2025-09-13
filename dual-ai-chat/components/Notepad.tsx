
import React, { useState, useMemo } from 'react';
import { MessageSender } from '../types';
import { FileText, Eye, Code, Copy, Check, Maximize, Minimize, Undo2, Redo2, Eraser, Plus, Pencil, Trash2 } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface NotepadProps {
  content: string;
  lastUpdatedBy?: MessageSender | null;
  isLoading: boolean;
  isNotepadFullscreen: boolean;
  onToggleFullscreen: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearHistory: () => void;
  canUndo: boolean;
  canRedo: boolean;
  notepads?: Array<{ id: string; title?: string }>; // for multi-notebook UI
  activeNotepadId?: string;
  onSelectNotepad?: (id: string) => void;
  onAddNotepad?: () => void;
  onRenameNotepad?: (id: string) => void;
  onDeleteNotepad?: (id: string) => void;
}

const Notepad: React.FC<NotepadProps> = ({ 
  content, 
  lastUpdatedBy, 
  isLoading, 
  isNotepadFullscreen, 
  onToggleFullscreen,
  onUndo,
  onRedo,
  onClearHistory,
  canUndo,
  canRedo,
  notepads,
  activeNotepadId,
  onSelectNotepad,
  onAddNotepad,
  onRenameNotepad,
  onDeleteNotepad,
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const processedHtml = useMemo(() => {
    if (isPreviewMode) {
      const rawHtml = marked.parse(content) as string;
      return DOMPurify.sanitize(rawHtml);
    }
    return '';
  }, [content, isPreviewMode]);

  const handleCopyNotepad = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('无法复制记事本内容: ', err);
    }
  };

  const notepadBaseClasses = "h-full flex flex-col bg-gray-50 border-l border-gray-300";
  const fullscreenClasses = "fixed top-0 left-0 w-screen h-screen z-50 shadow-2xl";

  const lines = useMemo(() => content.split('\n'), [content]);
  
  const baseButtonClass = "p-1.5 text-gray-500 hover:text-sky-600 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-500";


  return (
    <div className={`${notepadBaseClasses} ${isNotepadFullscreen ? fullscreenClasses : ''}`}>
      <header className="p-3 border-b border-gray-300 flex items-center justify-between bg-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={20} className="mr-2 text-sky-600" />
          <h2 className="text-lg font-semibold text-sky-700">Notebook</h2>
          {notepads && notepads.length > 0 && (
            <div className="flex items-center gap-1">
              <label htmlFor="notepadSelector" className="sr-only">选择记事本</label>
              <select
                id="notepadSelector"
                value={activeNotepadId}
                onChange={(e) => onSelectNotepad && onSelectNotepad(e.target.value)}
                className="bg-white border border-gray-300 text-gray-800 text-sm rounded-md p-1.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                title="选择记事本"
              >
                {notepads.map((p, idx) => (
                  <option key={p.id} value={p.id}>{p.title || `Notebook ${idx + 1}`}</option>
                ))}
              </select>
              <button
                onClick={() => onAddNotepad && onAddNotepad()}
                className={baseButtonClass}
                title="新建记事本"
                aria-label="Add notepad"
                disabled={isLoading}
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => activeNotepadId && onRenameNotepad && onRenameNotepad(activeNotepadId)}
                className={baseButtonClass}
                title="重命名当前记事本"
                aria-label="Rename notepad"
                disabled={isLoading || !activeNotepadId}
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => activeNotepadId && onDeleteNotepad && onDeleteNotepad(activeNotepadId)}
                className={baseButtonClass}
                title="删除当前记事本"
                aria-label="Delete notepad"
                disabled={isLoading || !activeNotepadId}
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1 md:space-x-1.5">
          {isLoading && !isNotepadFullscreen && <span className="text-xs text-gray-500 italic mr-1">AI 思考中...</span>}
          <button
            onClick={onUndo}
            disabled={!canUndo || isLoading}
            className={baseButtonClass}
            title="撤销记事本更改"
            aria-label="Undo notepad change"
            aria-disabled={!canUndo || isLoading}
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo || isLoading}
            className={baseButtonClass}
            title="重做记事本更改"
            aria-label="Redo notepad change"
            aria-disabled={!canRedo || isLoading}
          >
            <Redo2 size={18} />
          </button>
          <div className="h-4 w-px bg-gray-300 mx-1" aria-hidden="true"></div>
          <button
            onClick={onClearHistory}
            disabled={isLoading}
            className={baseButtonClass}
            title="清除记事本历史 (保留当前内容)"
            aria-label="Clear notepad history"
          >
            <Eraser size={18} />
          </button>
          <div className="h-4 w-px bg-gray-300 mx-1" aria-hidden="true"></div>
          <button
            onClick={onToggleFullscreen}
            className={baseButtonClass}
            title={isNotepadFullscreen ? "退出全屏" : "全屏"}
            aria-label={isNotepadFullscreen ? "Exit fullscreen notepad" : "Enter fullscreen notepad"}
          >
            {isNotepadFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <button
            onClick={handleCopyNotepad}
            className={baseButtonClass}
            title={isCopied ? "已复制!" : "复制记事本内容"}
            aria-label={isCopied ? "已复制记事本内容到剪贴板" : "复制记事本内容"}
          >
            {isCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={baseButtonClass}
            title={isPreviewMode ? "查看原始内容" : "预览 Markdown"}
            aria-label={isPreviewMode ? "Switch to raw text view" : "Switch to Markdown preview"}
          >
            {isPreviewMode ? <Code size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </header>
      <div className="flex-grow overflow-y-auto relative bg-white">
        {isPreviewMode ? (
          <div
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
            aria-label="Markdown 预览"
          />
        ) : (
          <div 
            className="w-full h-full p-3 bg-white text-gray-800 font-mono text-xl leading-relaxed"
            aria-label="共享记事本内容 (原始内容)"
          >
            {lines.map((line, index) => (
              <div key={index} className="flex">
                <span 
                  className="w-10 text-right pr-3 text-gray-400 select-none flex-shrink-0"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="flex-1 whitespace-pre-wrap break-all">{line}</span>
              </div>
            ))}
            {/* Add an empty line with number if content is empty to show the textarea-like behavior */}
            {content === '' && (
                 <div className="flex">
                    <span 
                        className="w-10 text-right pr-3 text-gray-400 select-none flex-shrink-0"
                        aria-hidden="true"
                    >
                        1
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-all"></span>
                 </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notepad;
