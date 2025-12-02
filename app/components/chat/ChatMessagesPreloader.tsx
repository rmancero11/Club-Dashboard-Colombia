'use client';

import React, { useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { MessageType } from '@/app/types/chat';

interface Props {
  userId: string;
  // batchSize opcional para limitar concurrencia de requests
  batchSize?: number;
}

/**
 * Pre-carga el último mensaje de cada match para mostrar previews y llenar la store.
 * Preferible: backend que devuelva matches con lastMessage (recomendado).
 */
const ChatMessagesPreloader: React.FC<Props> = ({ userId, batchSize = 5 }) => {
  const setMatches = useChatStore((s) => s.setMatches);
  const setMessages = useChatStore((s) => s.setMessages);
  const upsertMessages = useChatStore((s) => s.upsertMessages);
  const setIsLoadingMatches = useChatStore((s) => s.setIsLoadingMatches);
  const getState = useChatStore.getState;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      try {
        setIsLoadingMatches(true);

        // 1) Obtener matches (idealmente backend ya trae lastMessage)
        const res = await fetch('/api/chat/matches', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch matches');
        const matchesData = await res.json();

        if (cancelled) return;

        // Guardar matches en store (aseguramos unreadCount)
        const normalized = Array.isArray(matchesData)
        ? matchesData.map((m: any) => ({ ...m, unreadCount: m.unreadCount ?? 0 }))
        : [];

        // Guardamos matches rápidamente para renderizar lista
        setMatches(normalized);

        // 2) Si backend YA devuelve preview/lastMessage no hace falta más trabajo.
        // Intentamos detectar si matchesData ya trae lastMessage (p.e. lastMessageAt)
        const needsFetchLast = normalized.some((m: any) => !m.lastMessageAt && !m.lastMessageContent);

        if (!needsFetchLast) {
          // Ya tenemos preview: terminamos
          setIsLoadingMatches(false);
          return;
        }

        // 3) Fallback: por cada match pedimos el último mensaje (limit=1)
        // Hacemos batches para no saturar el servidor
        const lastMessages: MessageType[] = [];
        const matchesList = normalized;

        for (let i = 0; i < matchesList.length; i += batchSize) {
          if (cancelled) break;
          const batch = matchesList.slice(i, i + batchSize);

          // Para cada match pedimos el último mensaje (backend: /api/chat/history/:matchId?limit=1)
          const promises = batch.map(async (m: any) => {
            try {
              const r = await fetch(`/api/chat/last/${m.id}`, { credentials: 'include' });
              if (!r.ok) return null;
              const d = await r.json();
              const msgs: MessageType[] = d.messages ?? [];
              // Si viene 1 mensaje (el último)
              return msgs.length > 0 ? { matchId: m.id, message: msgs[msgs.length - 1] } : null;
            } catch (e) {
              console.warn('Error fetching last message for', m.id, e);
              return null;
            }
          });

          const results = await Promise.all(promises);

          for (const r of results) {
            if (!r) continue;
            lastMessages.push(r.message);
            const idx = normalized.findIndex((x: any) => x.id === r.matchId);
            if (idx !== -1) {
              normalized[idx] = {
                ...normalized[idx],
                lastMessageContent: r.message.imageUrl ? '📷 Foto' : r.message.content || '',
                lastMessageAt: r.message.createdAt || normalized[idx].lastMessageAt,
              };
            }
          }
        }

        if (cancelled) return;

        // 4) Guardar matches actualizados (con previews) y mensajes (últimos)
        setMatches(normalized);

        // // Combinar con mensajes que ya existían en la store (otras conversaciones)
        // const existing = getState().messages ?? [];
        // // Evitamos duplicados: preferimos los que ya existían por id/localId
        // const merged = [...existing, ...lastMessages].filter(Boolean);

        // setMessages(merged);
        // Integración con mensajes existentes: usamos upsertMessages para deduplicar
        if (lastMessages.length > 0) {
          upsertMessages(lastMessages);
        }

      } catch (error) {
        console.error('ChatMessagesPreloader error', error);
      } finally {
        if (!cancelled) setIsLoadingMatches(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, setMatches, setMessages, setIsLoadingMatches, getState, batchSize, upsertMessages]);

  return null;
};

export default ChatMessagesPreloader;
