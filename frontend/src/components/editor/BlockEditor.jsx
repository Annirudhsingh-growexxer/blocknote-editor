import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import Block from './Block';
import SlashMenu from './SlashMenu';
import FormatToolbar, { selectionIsInEditor } from './FormatToolbar';
import { insertAfter, needsRenormalization } from '../../lib/orderIndex';
import api from '../../lib/api';

export default function BlockEditor({ documentId, initialBlocks, onChange, readOnly, hydrateNonce = 0 }) {
  const [blocks, setBlocks] = useState([]);
  const [focusedId, setFocusedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const selectionAnchorRef = useRef(null);
  
  // Slash menu state
  const [slashState, setSlashState] = useState({ isOpen: false, blockId: null, position: {x:0, y:0}, filter: '', originalText: '' });

  const blocksRef = useRef([]);
  const autoFocusedDocumentRef = useRef(null);
  const pendingFocusRef = useRef(null);
  const editorRootRef = useRef(null);

  // Floating Notion-style format toolbar state. `rect` is the selection's
  // bounding rect (viewport-relative) — null means no toolbar shown.
  const [toolbarRect, setToolbarRect] = useState(null);

  useEffect(() => {
    if (!pendingFocusRef.current) return;
    const { id, placement } = pendingFocusRef.current;
    pendingFocusRef.current = null;
    const el = document.querySelector(`.block-wrapper[data-id="${id}"] .block-content`);
    if (el && el.isContentEditable) {
      el.focus();
      setFocusedId(id);
      try {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(placement !== 'end');
        sel.removeAllRanges();
        sel.addRange(range);
      } catch(e) {}
    }
  });

  useEffect(() => {
    // Hydrate internal blocks only when the editor is reloaded (NOT on every autosave keystroke)
    if (!initialBlocks) return;
    setSelectedIds(new Set());
    selectionAnchorRef.current = null;
    setFocusedId(null);
    const sorted = [...initialBlocks].sort((a,b) => a.order_index - b.order_index);
    setBlocks(sorted);
    blocksRef.current = sorted;
  }, [hydrateNonce, documentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // In BlockEditor.jsx
useEffect(() => {
  if (readOnly) return;
  // Even if blocks.length is 0, we should ensure the user can type
  if (!documentId) return;

  if (blocks.length > 0) {
    const firstBlock = blocks[0];
    if (autoFocusedDocumentRef.current === documentId) return;
    autoFocusedDocumentRef.current = documentId;
    focusBlock(firstBlock.id, 'start');
  }
}, [documentId, blocks.length, readOnly]); // Observe blocks.length specifically

  const updateBlocksState = (newBlocks) => {
    setBlocks(newBlocks);
    blocksRef.current = newBlocks;
    onChange(newBlocks);
  };

  const syncBlockMutation = (id, content) => {
    const newBlocks = blocksRef.current.map(b => b.id === id ? { ...b, content: { ...b.content, ...content } } : b);
    setBlocks(newBlocks);
    blocksRef.current = newBlocks;
    onChange(newBlocks);
  };

  const isPlainCharacterKey = (key) => key.length === 1 && !/\s/.test(key);
  const normalizeEditableText = (text) => (text || '').replace(/\u200B/g, '').replace(/\n/g, '');

  const handleDragEnd = async (event) => {
    if (readOnly) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocksRef.current.findIndex(b => b.id === active.id);
    const newIndex = blocksRef.current.findIndex(b => b.id === over.id);

    const reordered = arrayMove(blocksRef.current, oldIndex, newIndex);
    
    // Calculate new order_index
    const prev = reordered[newIndex - 1];
    const next = reordered[newIndex + 1];
    
    const prevIndex = prev ? prev.order_index : 0;
    const nextIndex = next ? next.order_index : (prevIndex + 2);
    
    const newOrderIndex = insertAfter(prevIndex, nextIndex);
    reordered[newIndex].order_index = newOrderIndex;
    
    updateBlocksState(reordered);

    try {
       // Send batch reorder to API
       // Will trigger renormalization on backend if needed
       await api.patch('/api/blocks/reorder', {
         updates: [{ id: active.id, order_index: newOrderIndex }]
       });
       
       if (needsRenormalization(reordered)) {
          // Sync with server if we trigger renorm
          const { data } = await api.get(`/api/documents/${documentId}`);
          updateBlocksState(data.blocks);
       }
    } catch (err) {
       console.error(err);
    }
  };

  const focusBlock = (id, placement = 'end') => {
    pendingFocusRef.current = { id, placement };
  };

  const createParagraphAfterIndex = async (indexAfter) => {
    const prev = blocksRef.current[indexAfter];
    const prevIndex = prev ? prev.order_index : 0;
    const nextBlock = blocksRef.current[indexAfter + 1];
    const nextIndex = nextBlock ? nextBlock.order_index : (prevIndex + 2);
    const newOrderIndex = insertAfter(prevIndex, nextIndex);

    try {
      const { data: newBlock } = await api.post('/api/blocks', {
        document_id: documentId,
        type: 'paragraph',
        content: { text: '' },
        order_index: newOrderIndex,
      });

      const newBlocks = [...blocksRef.current];
      newBlocks.splice(indexAfter + 1, 0, newBlock);
      updateBlocksState(newBlocks);
      setFocusedId(newBlock.id);
      focusBlock(newBlock.id, 'start');
      return newBlock;
    } catch (err) {
      console.error('Failed to create paragraph after block:', err);
      return null;
    }
  };

  const insertPlainTextIntoBlock = (el, blockId, text) => {
    const offset = getCursorOffset(el);
    const currentText = el.innerText || '';
    const nextText = `${currentText.slice(0, offset)}${text}${currentText.slice(offset)}`;
    el.innerText = nextText;
    syncBlockMutation(blockId, { text: nextText });
  };

  const handlePaste = async (e, blockId) => {
    if (readOnly) return;

    const blockIndex = blocksRef.current.findIndex((block) => block.id === blockId);
    const currentBlock = blocksRef.current[blockIndex];
    if (!currentBlock) return;

    const plainText = e.clipboardData?.getData('text/plain');
    if (!plainText) return;

    e.preventDefault();

    const normalizedText = plainText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Code blocks: insert the full text as-is (preserve all newlines within the block)
    if (currentBlock.type === 'code') {
      const el = e.target;
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(normalizedText);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);
        el.dispatchEvent(new InputEvent('input', { bubbles: true }));
      } else {
        insertPlainTextIntoBlock(el, blockId, normalizedText);
      }
      return;
    }

    const lines = normalizedText.split('\n');

    if (lines.length <= 1) {
      const el = e.target;
      insertPlainTextIntoBlock(el, blockId, normalizedText);
      return;
    }

    // Handle first line in current block
    const el = e.target;
    const offset = getCursorOffset(el);
    const textBefore = el.innerText.slice(0, offset);
    const textAfter = el.innerText.slice(offset);
    
    const combinedFirstLine = textBefore + lines[0];
    el.innerText = combinedFirstLine;
    syncBlockMutation(blockId, { text: combinedFirstLine });

    // Insert subsequent lines using a single bulk API call for smoother pastes.
    const nextBlock = blocksRef.current[blockIndex + 1];
    const insertionUpperBound = nextBlock ? nextBlock.order_index : currentBlock.order_index + 2;
    const blocksPayload = [];
    let previousOrder = currentBlock.order_index;

    for (let i = 1; i < lines.length; i++) {
      const isLastContent = i === lines.length - 1;
      const nextOrder = insertAfter(previousOrder, insertionUpperBound);
      blocksPayload.push({
        type: currentBlock.type === 'todo' ? 'todo' : 'paragraph',
        content: { text: `${lines[i]}${isLastContent ? textAfter : ''}` },
        order_index: nextOrder,
      });
      previousOrder = nextOrder;
    }

    try {
      const { data: insertedBlocks } = await api.post('/api/blocks/bulk', {
        document_id: documentId,
        blocks: blocksPayload,
      });

      const newBlocks = [...blocksRef.current];
      newBlocks.splice(blockIndex + 1, 0, ...insertedBlocks);
      updateBlocksState(newBlocks);

      const lastInsertedBlock = insertedBlocks[insertedBlocks.length - 1];
      if (lastInsertedBlock) {
        setFocusedId(lastInsertedBlock.id);
        focusBlock(lastInsertedBlock.id, 'start');
      }
    } catch (err) {
      console.error('Failed to paste multi-line content:', err);
    }
  };

  const handleTypeChange = async (blockId, nextType) => {
    const currentBlock = blocksRef.current.find((block) => block.id === blockId);
    if (!currentBlock || currentBlock.type === nextType) return;

    const nextContent =
      nextType === 'todo'
        ? { text: currentBlock.content?.text || '', checked: currentBlock.content?.checked || false }
        : nextType === 'image'
          ? { url: currentBlock.content?.url || '' }
          : nextType === 'divider'
            ? {}
            : { text: currentBlock.content?.text || '' };

    try {
      const { data } = await api.patch(`/api/blocks/${blockId}`, {
        type: nextType,
        content: nextContent,
      });

      const nextBlocks = blocksRef.current.map((block) => (block.id === blockId ? data : block));
      updateBlocksState(nextBlocks);

      // If converted to a non-editable block (divider) or the user expects
      // the cursor to continue on the next line even after a code block,
      // create a new paragraph after this block and focus it.
      if (nextType === 'divider') {
        const index = nextBlocks.findIndex(b => b.id === blockId);
        await createParagraphAfterIndex(index);
      } else if (nextType !== 'image') {
        focusBlock(blockId, 'end');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = async (e, blockId) => {
    if (readOnly) return;
    const blockIndex = blocksRef.current.findIndex(b => b.id === blockId);
    const currentBlock = blocksRef.current[blockIndex];
    if (!currentBlock) return;

    const el = e.target;

    // Ctrl/Cmd+A -> select all blocks
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      const allIds = blocksRef.current.map((b) => b.id);
      setSelectedIds(new Set(allIds));
      selectionAnchorRef.current = allIds[0] || null;
      return;
    }

    // Ctrl/Cmd+C -> copy selected blocks as plain text
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && selectedIds.size > 1) {
      e.preventDefault();
      const ordered = blocksRef.current.filter((b) => selectedIds.has(b.id));
      const text = ordered.map((b) => b.content?.text ?? '').join('\n');
      navigator.clipboard.writeText(text).catch(console.error);
      return;
    }

    // Escape -> clear selection (and close slash menu if open)
    if (e.key === 'Escape' && selectedIds.size > 0) {
      e.preventDefault();
      setSelectedIds(new Set());
      if (slashState.isOpen) closeSlashMenu(false);
      return;
    }

    // Bulk delete when multi-select is active
    if ((e.key === 'Backspace' || e.key === 'Delete') && selectedIds.size > 1 && !slashState.isOpen) {
      e.preventDefault();
      void deleteSelectedBlocks(Array.from(selectedIds));
      return;
    }

    // SLASH MENU TRIGGER
    if (e.key === '/') {
       const cursorOffset = getCursorOffset(el);
       const fullText = normalizeEditableText(el.innerText);
       if (cursorOffset === 0 && fullText.trim() === '') {
          e.preventDefault();
          const rect = el.getBoundingClientRect();
          setSlashState({
             isOpen: true, blockId, filter: '', originalText: fullText,
             position: { x: rect.left, y: rect.bottom + 8 }
          });
          return;
       }
    }

    if (slashState.isOpen) {
       if (e.key === 'Escape') {
          e.preventDefault();
          closeSlashMenu(true);
          return;
       } else if (e.key === 'Backspace') {
          e.preventDefault();
          setSlashState((state) => {
            const nextFilter = state.filter.slice(0, -1);
            if (nextFilter.length === 0) {
              return { ...state, filter: '' };
            }
            return { ...state, filter: nextFilter };
          });
          return;
       } else if (e.key === ' ') {
          e.preventDefault();
          setSlashState((state) => ({ ...state, filter: `${state.filter} ` }));
          return;
       } else if (isPlainCharacterKey(e.key)) {
          e.preventDefault();
          setSlashState((state) => ({ ...state, filter: `${state.filter}${e.key}` }));
          return;
       } else if (['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
          return;
       } else {
          e.preventDefault();
          return;
       }
       return;
    }

    // EDGE CASE 1 & 2: Enter Mid-Block Split
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If code block, insert a newline at cursor position synchronously.
      if (currentBlock.type === 'code') {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode('\n\n');
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);
        // Dispatch input event so onInput fires and syncs state without overwriting DOM
        el.dispatchEvent(new InputEvent('input', { bubbles: true }));
        return;
      }

      const offset = getCursorOffset(el);
      const fullText = el.innerText || '';
      const textBefore = fullText.slice(0, offset);
      const textAfter = fullText.slice(offset);

      // Empty todo on Enter = escape the list, create a paragraph instead
      if (currentBlock.type === 'todo' && fullText.trim() === '') {
        try {
          await api.patch(`/api/blocks/${blockId}`, { type: 'paragraph', content: { text: '' } });
          const newBlocks = blocksRef.current.map(b =>
            b.id === blockId ? { ...b, type: 'paragraph', content: { text: '' } } : b
          );
          updateBlocksState(newBlocks);
          focusBlock(blockId, 'start');
        } catch (err) { console.error(err); }
        return;
      }

      const isTodo = currentBlock.type === 'todo';
      const isAtEnd = textAfter === '';

      // Spec: Enter at end of block creates a new paragraph block below.
      // For todos: only keep todo type when splitting mid-block (textAfter not empty).
      const newBlockType = isTodo && !isAtEnd ? 'todo' : 'paragraph';
      const newBlockContent =
        newBlockType === 'todo'
          ? { text: textAfter, checked: false }
          : { text: textAfter };

      // Generate order index for new block
      const prevIndex = currentBlock.order_index;
      const nextBlock = blocksRef.current[blockIndex + 1];
      const nextIndex = nextBlock ? nextBlock.order_index : prevIndex + 2;
      const newIndex = insertAfter(prevIndex, nextIndex);

      try {
         const { data: newBlock } = await api.post('/api/blocks', {
            document_id: documentId,
            type: newBlockType,
            content: newBlockContent,
            order_index: newIndex
         });

         // Update DOM and state together after the new block is ready
         el.innerText = textBefore;
         syncBlockMutation(blockId, { text: textBefore });
         api.patch(`/api/blocks/${blockId}`, {
           content: { ...currentBlock.content, text: textBefore }
         }).catch(console.error);

         const newBlocks = [...blocksRef.current];
         newBlocks.splice(blockIndex + 1, 0, newBlock);
         updateBlocksState(newBlocks);

         setFocusedId(newBlock.id);
         focusBlock(newBlock.id, 'start');
      } catch (err) { console.error(err); }
      return;
    }

    // EDGE CASES 3, 4, 5: Backspace
    if (e.key === 'Backspace') {
       const offset = getCursorOffset(el);
       // At very beginning of block
       if (offset === 0) {
         const currentText = normalizeEditableText(el.innerText);

         if (blockIndex === 0) {
            if (currentText === '') {
               e.preventDefault();
            }
            return;
         }

         if (currentText !== '') {
            return;
         }

         // If the previous block is non-editable (divider/image),
         // cursor can't go "into" it. So we delete the current empty block
         // and jump to the nearest editable block (handled below).

         e.preventDefault();

         const previousBlocks = blocksRef.current.slice(0, blockIndex);
         const previousEditableBlock = [...previousBlocks]
           .reverse()
           .find((block) => block.type !== 'divider' && block.type !== 'image');

         try {
            await api.delete(`/api/blocks/${blockId}`);
            const newBlocks = blocksRef.current.filter((block) => block.id !== blockId);
            updateBlocksState(newBlocks);

            if (previousEditableBlock) {
              focusBlock(previousEditableBlock.id, 'end');
            }
         } catch (e) {}
       }
       return;
    }

    // Handle Delete key: if cursor is at end of editable block and the next
    // block is a non-editable (divider/image/code), delete that next block.
    if (e.key === 'Delete') {
      const textLen = normalizeEditableText(el.innerText).length;
      const offset = getCursorOffset(el);
      const nextBlock = blocksRef.current[blockIndex + 1];
      if (offset === textLen && nextBlock && ['divider', 'image', 'code'].includes(nextBlock.type)) {
        e.preventDefault();
        try {
          await api.delete(`/api/blocks/${nextBlock.id}`);
          const newBlocks = blocksRef.current.filter((b) => b.id !== nextBlock.id);
          updateBlocksState(newBlocks);
          // keep focus where it was
          focusBlock(blockId, 'end');
        } catch (err) {
          console.error(err);
        }
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode('    ');
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      sel.removeAllRanges();
      sel.addRange(range);
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }
  };

  const handleEditorMouseDown = (e) => {
    if (readOnly) return;
    if (e.target.closest('.block-wrapper, .block-content, input, button, img, hr, .doc-menu')) return;
    setSelectedIds(new Set());

    const editableBlocks = blocksRef.current.filter((block) => block.type !== 'divider' && block.type !== 'image');
    const lastEditableBlock = editableBlocks[editableBlocks.length - 1];
    if (lastEditableBlock) {
      focusBlock(lastEditableBlock.id, 'end');
    }
  };

  const handleBlockPointerDown = (e, id) => {
    if (readOnly) return;
    // Keep selection logic from being stomped by editor background mousedown.
    e.stopPropagation();

    setSelectedIds((prev) => {
      const next = new Set(prev);

      // Shift-click: select contiguous range
      if (e.shiftKey) {
        const anchorId = selectionAnchorRef.current || id;
        const fromIndex = blocksRef.current.findIndex((b) => b.id === anchorId);
        const toIndex = blocksRef.current.findIndex((b) => b.id === id);
        if (fromIndex === -1 || toIndex === -1) {
          next.clear();
          next.add(id);
          selectionAnchorRef.current = id;
          return next;
        }

        const start = Math.min(fromIndex, toIndex);
        const end = Math.max(fromIndex, toIndex);
        const rangeIds = blocksRef.current.slice(start, end + 1).map((b) => b.id);
        selectionAnchorRef.current = anchorId;
        return new Set(rangeIds);
      }

      // Ctrl/Cmd-click: toggle
      if (e.metaKey || e.ctrlKey) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
        selectionAnchorRef.current = id;
        return next;
      }

      // Plain click: single select
      next.clear();
      next.add(id);
      selectionAnchorRef.current = id;
      return next;
    });
  };

  const deleteSelectedBlocks = async (idsToDelete) => {
    if (readOnly) return;
    if (!idsToDelete || idsToDelete.length <= 1) return;

    const idsSet = new Set(idsToDelete);
    const prevBlocks = blocksRef.current;

    // Speed: delete in parallel (UI reconciles from local state after)
    await Promise.all(idsToDelete.map((blockId) => api.delete(`/api/blocks/${blockId}`).catch(() => null)));

    const remaining = prevBlocks.filter((b) => !idsSet.has(b.id));
    updateBlocksState(remaining);
    setSelectedIds(new Set());

    if (remaining.length === 0) return;

    // Focus nearest block after deletions.
    const firstDeletedIndex = prevBlocks.findIndex((b) => idsSet.has(b.id));
    let target = null;
    for (let i = firstDeletedIndex; i < prevBlocks.length; i++) {
      if (!idsSet.has(prevBlocks[i]?.id)) {
        target = prevBlocks[i];
        break;
      }
    }
    if (!target) {
      for (let i = firstDeletedIndex - 1; i >= 0; i--) {
        if (!idsSet.has(prevBlocks[i]?.id)) {
          target = prevBlocks[i];
          break;
        }
      }
    }
    if (target) {
      setFocusedId(target.id);
      focusBlock(target.id, 'start');
    }
  };

  const getCursorOffset = (element) => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return 0;
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };

  const closeSlashMenu = (revertText = false) => {
     if (!slashState.isOpen) return;
     const el = document.querySelector(`.block-wrapper[data-id="${slashState.blockId}"] .block-content`);
     if (el) {
        if (revertText) {
           el.innerText = slashState.originalText;
        }
        syncBlockMutation(slashState.blockId, { text: el.innerText });
        focusBlock(slashState.blockId);
     }
     setSlashState({ isOpen: false, blockId: null, position: {x:0, y:0}, filter: '', originalText: '' });
  };

  const handleSlashSelect = async (type) => {
     const blockId = slashState.blockId;
     const currentBlock = blocksRef.current.find((block) => block.id === blockId);
     if (!currentBlock) return;

     // Spec: selecting a slash command must create an empty block.
     const emptyText = '';
     const nextContent =
       type === 'todo'
        ? { text: emptyText, checked: false }
         : type === 'image'
          ? { url: '' }
           : type === 'divider'
             ? {}
            : { text: emptyText };
     
     // Update block type
     try {
       const { data } = await api.patch(`/api/blocks/${blockId}`, { type, content: nextContent });
       const newBlocks = blocksRef.current.map(b => b.id === blockId ? data : b);
       updateBlocksState(newBlocks);
       setSlashState({ isOpen: false, blockId: null, position: {x:0, y:0}, filter: '', originalText: '' });

       // Clear any stray DOM text that might have been inserted.
       const el = document.querySelector(`.block-wrapper[data-id="${blockId}"] .block-content`);
       if (el) el.innerText = '';

       if (type === 'divider') {
         const index = newBlocks.findIndex(b => b.id === blockId);
         await createParagraphAfterIndex(index);
       } else if (type !== 'image') {
         focusBlock(blockId, 'end');
       }
     } catch (err) { console.error(err); }
  };

  const handleBlockFocus = useCallback((id) => {
    if (!readOnly) {
      setFocusedId(id);
    }
  }, [readOnly]);

  const handleBlockBlur = useCallback(() => {
    setFocusedId(null);
  }, []);

  // Show/hide the floating format toolbar on selection change. The toolbar
  // only appears when the user has a non-collapsed selection inside an
  // editable block in this editor instance.
  useEffect(() => {
    if (readOnly) return;
    let rafId = 0;
    const handler = () => {
      // Batch via rAF — selectionchange fires a lot during drag-selects.
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = selectionIsInEditor(editorRootRef.current);
        setToolbarRect(rect);
      });
    };
    document.addEventListener('selectionchange', handler);
    return () => {
      document.removeEventListener('selectionchange', handler);
      cancelAnimationFrame(rafId);
    };
  }, [readOnly]);

  // Re-emit the input event on the focused block after execCommand so that
  // autosave picks up the formatting change. execCommand mutates the DOM
  // directly and doesn't fire `input`.
  const handleAfterFormat = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node = sel.anchorNode;
    while (node && node !== document.body) {
      if (node.nodeType === 1 && node.classList?.contains('block-content')) {
        node.dispatchEvent(new InputEvent('input', { bubbles: true }));
        // Reposition toolbar against the new selection rect.
        const r = sel.getRangeAt(0).getBoundingClientRect();
        if (r.width > 0 || r.height > 0) setToolbarRect({ ...r.toJSON?.() || {}, top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
        return;
      }
      node = node.parentNode;
    }
  }, []);

  return (
    <div
      ref={editorRootRef}
      style={{
        paddingBottom: '20vh',
        minHeight: '70vh',
        width: '100%',
        cursor: readOnly ? 'default' : 'text'
      }}
      onMouseDown={handleEditorMouseDown}
    >
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map(block => (
            <div
              key={block.id}
              className="block-wrapper"
              data-id={block.id}
              onMouseDown={(e) => handleBlockPointerDown(e, block.id)}
            >
              <Block 
                block={block}
                readOnly={readOnly}
                focused={focusedId === block.id}
                selected={selectedIds.has(block.id)}
                slashActive={slashState.isOpen && slashState.blockId === block.id}
                onFocus={handleBlockFocus}
                onBlur={handleBlockBlur}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onTypeChange={handleTypeChange}
                onUpdate={syncBlockMutation}
              />
            </div>
          ))}
        </SortableContext>
      </DndContext>

      <FormatToolbar />

      {slashState.isOpen && (
        <SlashMenu 
          position={slashState.position} 
          filter={slashState.filter} 
          onSelect={handleSlashSelect} 
          onClose={() => closeSlashMenu(true)} 
        />
      )}

      {!readOnly && toolbarRect && !slashState.isOpen && (
        <FormatToolbar
          rect={toolbarRect}
          editorRootRef={editorRootRef}
          onAfterCommand={handleAfterFormat}
        />
      )}
    </div>
  );
}
