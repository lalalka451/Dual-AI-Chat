
import { useState, useRef, useCallback, useEffect } from 'react';
import { CHAT_PANEL_WIDTH_PERCENT_STORAGE_KEY, IS_NOTEPAD_FULLSCREEN_STORAGE_KEY } from '../constants';

const MIN_PANEL_PERCENT = 20;
const MAX_PANEL_PERCENT = 80;

export const useAppUI = (initialChatPanelPercent: number, panelsContainerRef: React.RefObject<HTMLDivElement>) => {
  const [isNotepadFullscreen, setIsNotepadFullscreen] = useState<boolean>(() => {
    try { return localStorage.getItem(IS_NOTEPAD_FULLSCREEN_STORAGE_KEY) === 'true'; } catch { return false; }
  });
  const [chatPanelWidthPercent, setChatPanelWidthPercent] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(CHAT_PANEL_WIDTH_PERCENT_STORAGE_KEY);
      const val = raw !== null ? parseFloat(raw) : initialChatPanelPercent;
      if (isNaN(val)) return initialChatPanelPercent;
      return Math.max(MIN_PANEL_PERCENT, Math.min(MAX_PANEL_PERCENT, val));
    } catch { return initialChatPanelPercent; }
  });
  const [currentTotalProcessingTimeMs, setCurrentTotalProcessingTimeMs] = useState<number>(0);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  const isResizingRef = useRef<boolean>(false);
  const initialMouseXRef = useRef<number>(0);
  const initialChatPanelWidthPercentRef = useRef<number>(0);
  const currentQueryStartTimeRef = useRef<number | null>(null);

  const toggleNotepadFullscreen = useCallback(() => {
    setIsNotepadFullscreen(prev => !prev);
  }, []);

  const openSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false);
  }, []);

  const startProcessingTimer = useCallback(() => {
    currentQueryStartTimeRef.current = performance.now();
    setCurrentTotalProcessingTimeMs(0);
  }, []);

  const stopProcessingTimer = useCallback(() => {
    if (currentQueryStartTimeRef.current) {
      setCurrentTotalProcessingTimeMs(performance.now() - currentQueryStartTimeRef.current);
    }
    currentQueryStartTimeRef.current = null;
  }, []);
  
  const updateProcessingTimer = useCallback(() => {
    if (currentQueryStartTimeRef.current) {
        setCurrentTotalProcessingTimeMs(performance.now() - currentQueryStartTimeRef.current);
    }
  }, []);


  const handleMouseMoveOnDocument = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current || !panelsContainerRef.current) return;
    const containerWidth = panelsContainerRef.current.offsetWidth;
    if (containerWidth === 0) return;

    const deltaX = e.clientX - initialMouseXRef.current;
    const deltaPercent = (deltaX / containerWidth) * 100;
    
    let newChatPanelWidthPercent = initialChatPanelWidthPercentRef.current + deltaPercent;

    newChatPanelWidthPercent = Math.max(MIN_PANEL_PERCENT, newChatPanelWidthPercent);
    newChatPanelWidthPercent = Math.min(MAX_PANEL_PERCENT, newChatPanelWidthPercent);
    
    setChatPanelWidthPercent(newChatPanelWidthPercent);
  }, [panelsContainerRef]);

  const handleMouseUpOnDocument = useCallback(() => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMoveOnDocument);
    document.removeEventListener('mouseup', handleMouseUpOnDocument);
  }, [handleMouseMoveOnDocument]);

  const handleMouseDownOnResizer = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isResizingRef.current = true;
    initialMouseXRef.current = e.clientX;
    initialChatPanelWidthPercentRef.current = chatPanelWidthPercent;
    document.addEventListener('mousemove', handleMouseMoveOnDocument);
    document.addEventListener('mouseup', handleMouseUpOnDocument);
  }, [chatPanelWidthPercent, handleMouseMoveOnDocument, handleMouseUpOnDocument]);

  const handleResizerKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const stepAmountPercent = 2; 

      setChatPanelWidthPercent(prevWidthPercent => {
        let newWidthPercent = prevWidthPercent;
        if (e.key === 'ArrowLeft') {
          newWidthPercent -= stepAmountPercent;
        } else if (e.key === 'ArrowRight') {
          newWidthPercent += stepAmountPercent;
        }
        
        newWidthPercent = Math.max(MIN_PANEL_PERCENT, newWidthPercent);
        newWidthPercent = Math.min(MAX_PANEL_PERCENT, newWidthPercent);
        return newWidthPercent;
      });
    }
  }, []);

  useEffect(() => {
    // Cleanup global event listeners when the component unmounts or hook is no longer used
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveOnDocument);
      document.removeEventListener('mouseup', handleMouseUpOnDocument);
    };
  }, [handleMouseMoveOnDocument, handleMouseUpOnDocument]);

  // Persist UI state
  useEffect(() => {
    try { localStorage.setItem(IS_NOTEPAD_FULLSCREEN_STORAGE_KEY, isNotepadFullscreen.toString()); } catch {}
  }, [isNotepadFullscreen]);

  useEffect(() => {
    try { localStorage.setItem(CHAT_PANEL_WIDTH_PERCENT_STORAGE_KEY, String(chatPanelWidthPercent)); } catch {}
  }, [chatPanelWidthPercent]);


  return {
    isNotepadFullscreen,
    setIsNotepadFullscreen, // Expose setter if direct manipulation is needed from App.tsx
    chatPanelWidthPercent,
    setChatPanelWidthPercent, // Expose setter
    currentTotalProcessingTimeMs,
    isSettingsModalOpen,
    toggleNotepadFullscreen,
    handleMouseDownOnResizer,
    handleResizerKeyDown,
    openSettingsModal,
    closeSettingsModal,
    startProcessingTimer,
    stopProcessingTimer,
    updateProcessingTimer,
    currentQueryStartTimeRef, // Expose ref for use in other hooks/App.tsx
  };
};
