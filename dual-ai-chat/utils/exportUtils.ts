import { ChatConversation, StoredChatMessage } from '../types';

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatTimestamp = (iso: string) => {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

const formatMessageLine = (m: StoredChatMessage) => {
  const ts = formatTimestamp(m.timestamp);
  const attachmentInfo = m.textAttachment?.name ? ` [附件: ${m.textAttachment.name}]` : '';
  const imageInfo = m.image?.name ? ` [图片: ${m.image.name}]` : '';
  return `[${ts}] ${m.sender} (${m.purpose})${attachmentInfo}${imageInfo}:\n${m.text}`;
};

export const formatConversationAsText = (conv: ChatConversation): string => {
  const lines: string[] = [];
  lines.push(`# 会话: ${conv.title}`);
  lines.push(`ID: ${conv.id}`);
  lines.push(`创建时间: ${formatTimestamp(conv.createdAt)}`);
  lines.push(`更新时间: ${formatTimestamp(conv.updatedAt)}`);
  lines.push('');
  lines.push('--- 消息记录 ---');
  conv.messages.forEach((m) => {
    lines.push(formatMessageLine(m));
    lines.push('');
  });
  lines.push('--- 记事本 (当前) ---');
  lines.push(conv.notepad ?? '');
  if (conv.notepadHistory && conv.notepadHistory.length > 0) {
    lines.push('');
    lines.push(`(记事本历史共 ${conv.notepadHistory.length} 个状态，当前索引 ${typeof conv.notepadHistoryIndex === 'number' ? conv.notepadHistoryIndex : conv.notepadHistory.length - 1})`);
  }
  return lines.join('\n');
};

export const formatAllConversationsAsText = (convs: ChatConversation[]): string => {
  const sections: string[] = [];
  convs.forEach((c, idx) => {
    sections.push(formatConversationAsText(c));
    if (idx < convs.length - 1) sections.push('\n\n===============================\n');
  });
  return sections.join('\n');
};

export const formatConversationAsJSON = (conv: ChatConversation): string => {
  return JSON.stringify(conv, null, 2);
};

export const formatAllConversationsAsJSON = (convs: ChatConversation[]): string => {
  return JSON.stringify(convs, null, 2);
};

export const formatConversationAsHTML = (conv: ChatConversation): string => {
  const msgItems = conv.messages.map((m) => {
    const ts = formatTimestamp(m.timestamp);
    const meta = `${m.sender} (${m.purpose})`;
    const attachment = m.textAttachment?.name ? `<div class="meta">附件: ${escapeHtml(m.textAttachment.name)}</div>` : '';
    const image = m.image?.name ? `<div class="meta">图片: ${escapeHtml(m.image.name)}</div>` : '';
    return `<div class="message"><div class="header">[${escapeHtml(ts)}] ${escapeHtml(meta)}</div><pre>${escapeHtml(m.text)}</pre>${attachment}${image}</div>`;
  }).join('\n');

  const notepadSection = `<section class="notepad"><h3>记事本 (当前)</h3><pre>${escapeHtml(conv.notepad ?? '')}</pre>${conv.notepadHistory && conv.notepadHistory.length > 0
    ? `<div class="meta">记事本历史共 ${conv.notepadHistory.length} 个状态，当前索引 ${typeof conv.notepadHistoryIndex === 'number' ? conv.notepadHistoryIndex : conv.notepadHistory.length - 1}</div>`
    : ''}</section>`;

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(conv.title)}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Noto Sans", "Liberation Sans", sans-serif; background: #fff; color: #111; margin: 16px; }
    h1 { color: #0ea5e9; font-size: 20px; margin: 0 0 4px 0; }
    .meta { color: #555; font-size: 12px; margin-bottom: 8px; }
    .section { margin-top: 16px; }
    .message { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; margin: 8px 0; background:#fafafa; }
    .message .header { font-size: 12px; color:#374151; margin-bottom: 6px; }
    pre { white-space: pre-wrap; word-break: break-word; background: #fff; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px; }
    .notepad pre { background: #f8fafc; }
  </style>
  </head>
<body>
  <h1>${escapeHtml(conv.title)}</h1>
  <div class="meta">ID: ${escapeHtml(conv.id)}</div>
  <div class="meta">创建时间: ${escapeHtml(formatTimestamp(conv.createdAt))}</div>
  <div class="meta">更新时间: ${escapeHtml(formatTimestamp(conv.updatedAt))}</div>
  <section class="section">
    <h3>消息记录</h3>
    ${msgItems}
  </section>
  ${notepadSection}
</body>
</html>`;
};

export const formatAllConversationsAsHTML = (convs: ChatConversation[]): string => {
  const sections = convs.map((conv) => {
    const ts = `${formatTimestamp(conv.createdAt)} / ${formatTimestamp(conv.updatedAt)}`;
    const summary = `${conv.messages.length} 条消息`;
    return `<section class="conversation"><h2>${escapeHtml(conv.title)}</h2><div class="meta">ID: ${escapeHtml(conv.id)} | ${escapeHtml(ts)} | ${summary}</div>${conv.messages.map((m) => {
      const t = formatTimestamp(m.timestamp);
      return `<div class="message"><div class="header">[${escapeHtml(t)}] ${escapeHtml(m.sender)} (${escapeHtml(m.purpose)})</div><pre>${escapeHtml(m.text)}</pre></div>`;
    }).join('')}<div class="notepad"><h4>记事本 (当前)</h4><pre>${escapeHtml(conv.notepad ?? '')}</pre>${conv.notepadHistory && conv.notepadHistory.length ? `<div class="meta">记事本历史共 ${conv.notepadHistory.length} 个状态</div>` : ''}</div></section>`;
  }).join('\n');

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>Dual AI Chat 导出</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Noto Sans", "Liberation Sans", sans-serif; background: #fff; color: #111; margin: 16px; }
    h1 { color: #0ea5e9; font-size: 22px; margin: 0 0 12px 0; }
    h2 { color: #0369a1; font-size: 18px; margin: 16px 0 6px; }
    h3, h4 { color: #0f172a; }
    .meta { color: #555; font-size: 12px; margin-bottom: 8px; }
    .conversation { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin: 12px 0; background:#fafafa; }
    .message { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; margin: 8px 0; background:#fff; }
    .message .header { font-size: 12px; color:#374151; margin-bottom: 6px; }
    pre { white-space: pre-wrap; word-break: break-word; background: #fff; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px; }
    .notepad pre { background: #f8fafc; }
  </style>
  </head>
<body>
  <h1>Dual AI Chat 导出</h1>
  ${sections}
</body>
</html>`;
};

export const sanitizeFilename = (name: string): string => {
  return name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'export';
};

export const downloadText = (filename: string, mime: string, content: string) => {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

