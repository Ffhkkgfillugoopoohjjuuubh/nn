import { useEffect, useRef, useCallback } from 'react';
import { subscribeToMessages } from '../services/messageService';
import { Message } from '../types';

export const useRealtimeMessages = (
  currentUserId: string,
  onMessageReceived: (message: Message) => void
) => {
  const callbackRef = useRef(onMessageReceived);
  callbackRef.current = onMessageReceived;

  const handler = useCallback((message: Message) => {
    callbackRef.current(message);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const unsubscribe = subscribeToMessages(currentUserId, handler);
    return unsubscribe;
  }, [currentUserId, handler]);
};
