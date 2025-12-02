'use client';

import React, { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { initializeSocket, getSocket, closeSocket } from '@/app/utils/socket';
import { MessageType } from '@/app/types/chat';

interface ChatSocketInitializerProps {
  userId: string;
  onLoadMatches: (userId: string) => void;
}

const ChatSocketInitializer: React.FC<ChatSocketInitializerProps> = ({ userId, onLoadMatches }) => {
  // 👉 Selectores individuales: evitan re-renders por devolver un objeto nuevo
  const addMessage = useChatStore((s) => s.addMessage);
  const updateUserStatus = useChatStore((s) => s.updateUserStatus);
  const setLikesSent = useChatStore((s) => s.setLikesSent);
  const setLikesReceived = useChatStore((s) => s.setLikesReceived);
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus);
  const updateBlockStatus = useChatStore((s) => s.updateBlockStatus);

  // Ref para asegurarnos de llamar a onLoadMatches sólo la primera vez que conectamos
  const hasLoadedMatchesRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      console.log("🟡 Socket listener esperando userId...");
      return;
    }

    console.log(`🔌 Inicializando socket para User ID: ${userId}`);
    const socket = initializeSocket(userId);

    if (!socket) {
      console.warn('Socket no disponible al inicializar.');
      return;
    }

    // Usamos once para la carga inicial (evita llamadas duplicadas en reconexiones)
    const onConnect = () => {
      console.log(`📡 Socket conectado: ${userId}`);
      if (!hasLoadedMatchesRef.current) {
        try {
          onLoadMatches(userId);
        } catch (e) {
          console.error('Error en onLoadMatches:', e);
        }
        hasLoadedMatchesRef.current = true;
      }
    };

    socket.once('connect', onConnect);

    const onReceiveMessage = (msg: MessageType) => {
      console.log("📥 Mensaje recibido:", msg.id ?? msg.localId);
      addMessage(msg);
    };

    const onMessageSentSuccess = (msg: MessageType & { localId: string }) => {
      console.log(`✅ Mensaje confirmado. ID de Prisma: ${msg.id}`);
      updateMessageStatus(msg.localId, 'sent', msg.id);
    };

    const onUserStatusChange = (data: { id: string; online: boolean }) => {
      updateUserStatus(data.id, data.online);
    };

    const onYouAreBlocked = ({ blockerId }: { blockerId: string }) => {
      updateBlockStatus(blockerId, true);
    };

    const onYouAreUnblocked = ({ unblockerId }: { unblockerId: string }) => {
      updateBlockStatus(unblockerId, false);
    };

    // Registramos listeners
    socket.on('receive-message', onReceiveMessage);
    socket.on('message-sent-success', onMessageSentSuccess);
    socket.on('user-status-change', onUserStatusChange);
    socket.on('you-are-blocked', onYouAreBlocked);
    socket.on('you-are-unblocked', onYouAreUnblocked);

    // Cleanup: remover listeners (y opcionalmente cerrar socket si corresponde)
    return () => {
      console.log(`⏸️ Limpiando listeners para ${userId}...`);
      try {
        socket.off('connect', onConnect);
        socket.off('receive-message', onReceiveMessage);
        socket.off('message-sent-success', onMessageSentSuccess);
        socket.off('user-status-change', onUserStatusChange);
        socket.off('you-are-blocked', onYouAreBlocked);
        socket.off('you-are-unblocked', onYouAreUnblocked);
        // Si tu initializeSocket crea un socket global que querés cerrar al desmontar:
        // closeSocket(); // solo si querés cerrar la conexión global
      } catch (e) {
        console.warn('Error limpiando listeners del socket:', e);
      }
    };
  // Dependencias: funciones individuales (estables) y onLoadMatches + userId
  }, [userId, addMessage, updateUserStatus, updateMessageStatus, updateBlockStatus, setLikesSent, setLikesReceived, onLoadMatches]);

  return null;
};

export default ChatSocketInitializer;
