import React, { useState } from 'react';
import { X, Trash2, Clock, MessageSquare } from 'lucide-react';
import { ChatConversation } from '../types';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ChatConversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onDeleteAll: () => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
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
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>('');

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

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="chat-history-modal-title">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <header className="p-4 border-b border-gray-300 flex items-center justify-between sticky top-0 bg-gray-50 rounded-t-lg z-10">
          <h2 id="chat-history-modal-title" className="text-lg font-semibold text-gray-800">聊天历史</h2>
          <div className="flex items-center gap-2">
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

