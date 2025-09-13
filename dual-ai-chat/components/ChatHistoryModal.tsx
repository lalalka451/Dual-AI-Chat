import React, { useState } from 'react';
import { X, Trash2, Clock, MessageSquare } from 'lucide-react';
import { ChatConversation } from '../types';
import {
  formatConversationAsJSON,
  formatConversationAsText,
  formatConversationAsHTML,
  formatAllConversationsAsJSON,
  formatAllConversationsAsText,
  formatAllConversationsAsHTML,
  downloadText,
  sanitizeFilename,
} from '../utils/exportUtils';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ChatConversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onDeleteAll: () => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  onImportConversations?: (convs: ChatConversation[]) => void; // Merge/import handler
}

const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onDeleteAll,
  onRenameConversation,
  onImportConversations,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [exporting, setExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const startEdit = (conv: ChatConversation) => {
    setEditingId(conv.id);
    setDraftTitle(conv.title);
  };

  const commitEdit = (conv: ChatConversation) => {
    if (onRenameConversation && draftTitle.trim() && draftTitle !== conv.title) {
      onRenameConversation(conv.id, draftTitle.trim());
    }
    setEditingId(null);
  };

  const sorted = [...conversations].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  type ExportFormat = 'json' | 'txt' | 'html';

  const tsPart = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  };

  const exportConversation = async (conv: ChatConversation, format: ExportFormat) => {
    try {
      setExporting(true);
      const base = sanitizeFilename(conv.title || 'conversation');
      const suffix = conv.id ? `_${conv.id.slice(-6)}` : '';
      const filename = `${base}${suffix}_${tsPart()}.${format}`;
      if (format === 'json') {
        downloadText(filename, 'application/json', formatConversationAsJSON(conv));
      } else if (format === 'txt') {
        downloadText(filename, 'text/plain', formatConversationAsText(conv));
      } else {
        downloadText(filename, 'text/html', formatConversationAsHTML(conv));
      }
    } finally {
      setExporting(false);
    }
  };

  const exportAll = async (format: ExportFormat) => {
    try {
      setExporting(true);
      const filename = `DualAIChat_All_${tsPart()}.${format}`;
      if (format === 'json') {
        downloadText(filename, 'application/json', formatAllConversationsAsJSON(sorted));
      } else if (format === 'txt') {
        downloadText(filename, 'text/plain', formatAllConversationsAsText(sorted));
      } else {
        downloadText(filename, 'text/html', formatAllConversationsAsHTML(sorted));
      }
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      if (!input.files || input.files.length === 0) return;
      const file = input.files[0];
      try {
        setExporting(true);
        const text = await file.text();
        const data = JSON.parse(text);
        const normalize = (raw: any): ChatConversation | null => {
          try {
            const id = String(raw.id || '') || crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const title = String(raw.title || '导入会话');
            const createdAt = raw.createdAt ? String(raw.createdAt) : new Date().toISOString();
            const updatedAt = raw.updatedAt ? String(raw.updatedAt) : createdAt;
            const notepad = typeof raw.notepad === 'string' ? raw.notepad : '';
            const notepadHistory = Array.isArray(raw.notepadHistory) ? raw.notepadHistory.map((x: any) => String(x)) : undefined;
            const notepadHistoryIndex = typeof raw.notepadHistoryIndex === 'number' ? raw.notepadHistoryIndex : (notepadHistory ? notepadHistory.length - 1 : undefined);
            const messages = Array.isArray(raw.messages) ? raw.messages.map((m: any) => ({
              id: String(m.id || `${Math.random().toString(36).slice(2)}`),
              text: String(m.text || ''),
              sender: m.sender,
              purpose: m.purpose,
              timestamp: String(m.timestamp || new Date().toISOString()),
              durationMs: typeof m.durationMs === 'number' ? m.durationMs : undefined,
              image: m.image && m.image.dataUrl ? { dataUrl: String(m.image.dataUrl), name: String(m.image.name || ''), type: String(m.image.type || '') } : undefined,
              textAttachment: m.textAttachment && m.textAttachment.content ? { name: String(m.textAttachment.name || '附件.txt'), content: String(m.textAttachment.content) } : undefined,
            })) : [];
            return { id, title, createdAt, updatedAt, messages, notepad, notepadHistory, notepadHistoryIndex } as ChatConversation;
          } catch {
            return null;
          }
        };
        let imported: ChatConversation[] = [];
        if (Array.isArray(data)) {
          imported = data.map(normalize).filter((x: any) => !!x) as ChatConversation[];
        } else {
          const single = normalize(data);
          if (single) imported = [single];
        }
        if (imported.length > 0 && onImportConversations) onImportConversations(imported);
      } catch (e) {
        console.error('导入失败:', e);
        alert('导入失败：不是有效的 JSON 或结构不正确');
      } finally {
        setExporting(false);
      }
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="chat-history-modal-title">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <header className="p-4 border-b border-gray-300 flex items-center justify-between sticky top-0 bg-gray-50 rounded-t-lg z-10">
          <h2 id="chat-history-modal-title" className="text-lg font-semibold text-gray-800">聊天历史</h2>
          <div className="flex items-center gap-2">
            {conversations.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600 mr-1">导出全部:</span>
                <button
                  onClick={() => exportAll('json')}
                  disabled={exporting}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  title="导出全部为 JSON"
                >JSON</button>
                <button
                  onClick={() => exportAll('txt')}
                  disabled={exporting}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  title="导出全部为 TXT"
                >TXT</button>
                <button
                  onClick={() => exportAll('html')}
                  disabled={exporting}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  title="导出全部为 HTML"
                >HTML</button>
              </div>
            )}
            <button
              onClick={handleImportClick}
              className="px-2 py-1 text-sm bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-md hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="导入会话"
              title="从 JSON 导入会话"
            >
              导入
            </button>
            {conversations.length > 0 && (
              <button
                onClick={onDeleteAll}
                className="px-2 py-1 text-sm bg-red-100 text-red-700 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="清空所有会话"
                title="清空所有会话"
              >
                清空
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-red-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="关闭历史面板" title="关闭">
              <X size={22} />
            </button>
          </div>
        </header>

        <div className="p-4 overflow-y-auto space-y-3">
          {sorted.length === 0 ? (
            <p className="text-sm text-gray-600">暂无历史记录。开始新的对话以自动保存。</p>
          ) : (
            sorted.map((conv) => {
              const isActive = conv.id === currentConversationId;
              const updated = new Date(conv.updatedAt).toLocaleString();
              const count = conv.messages.length;
              return (
                <div key={conv.id} className={`p-3 border rounded-md flex items-center justify-between ${isActive ? 'bg-sky-50 border-sky-300' : 'bg-white border-gray-200'}`}>
                  <div className="flex-1 min-w-0 mr-3">
                    {editingId === conv.id ? (
                      <input
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onBlur={() => commitEdit(conv)}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(conv); if (e.key === 'Escape') setEditingId(null); }}
                        className="w-full p-1.5 border border-gray-300 rounded-md text-sm"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          className="text-left font-medium text-gray-800 hover:text-sky-700 truncate"
                          title={conv.title}
                          onClick={() => onSelectConversation(conv.id)}
                        >
                          {conv.title}
                        </button>
                        <span className="text-xs text-gray-500 flex items-center" title={`消息数: ${count}`}>
                          <MessageSquare size={14} className="mr-1" /> {count}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center" title={`更新时间: ${updated}`}>
                          <Clock size={14} className="mx-1" /> {updated}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {editingId !== conv.id && (
                      <button onClick={() => startEdit(conv)} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500">重命名</button>
                    )}
                    <div className="flex items-center gap-1">
                      <button onClick={() => exportConversation(conv, 'json')} disabled={exporting} className="px-2 py-1 text-xs bg-gray-50 text-gray-700 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500" title="导出 JSON">JSON</button>
                      <button onClick={() => exportConversation(conv, 'txt')} disabled={exporting} className="px-2 py-1 text-xs bg-gray-50 text-gray-700 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500" title="导出 TXT">TXT</button>
                      <button onClick={() => exportConversation(conv, 'html')} disabled={exporting} className="px-2 py-1 text-xs bg-gray-50 text-gray-700 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500" title="导出 HTML">HTML</button>
                    </div>
                    <button onClick={() => onDeleteConversation(conv.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="删除会话" title="删除会话">
                      <Trash2 size={18} />
                    </button>
                    {!isActive && (
                      <button onClick={() => onSelectConversation(conv.id)} className="px-2 py-1 text-xs bg-sky-600 text-white rounded hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500">加载</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryModal;
