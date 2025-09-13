import { ChatConversation } from '../types';

export const safeParseConversations = (raw: string | null): ChatConversation[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ChatConversation[];
  } catch {
    return [];
  }
};

export const mergeConversations = (a: ChatConversation[], b: ChatConversation[]): ChatConversation[] => {
  const byId: Record<string, ChatConversation> = {};
  const put = (c: ChatConversation) => {
    const existing = byId[c.id];
    if (!existing) {
      byId[c.id] = c;
      return;
    }
    // If conflict, prefer newer updatedAt
    const tNew = new Date(c.updatedAt).getTime();
    const tOld = new Date(existing.updatedAt).getTime();
    if (isFinite(tNew) && isFinite(tOld)) {
      if (tNew >= tOld) byId[c.id] = c; // newer wins
    } else {
      // Fallback: keep the longer messages list
      if ((c.messages?.length || 0) >= (existing.messages?.length || 0)) byId[c.id] = c;
    }
  };

  a.forEach(put);
  b.forEach(put);

  const merged = Object.values(byId);
  // Sort by updatedAt desc for consistency
  merged.sort((x, y) => new Date(y.updatedAt).getTime() - new Date(x.updatedAt).getTime());
  return merged;
};

