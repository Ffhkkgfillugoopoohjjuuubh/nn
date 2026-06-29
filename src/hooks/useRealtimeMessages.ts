import { useEffect, useRef, useCallback } from 'react';
import { subscribeToMessages } from '../services/messageService';
import { Message } from '../types';

export const useRealtimeMessages = (
  currentUserId: string,
  onMessageReceived: (message: Message, eventType?: 'INSERT' | 'UPDATE') => void
) => {
  const callbackRef = useRef(onMessageReceived);
  callbackRef.current = onMessageReceived;

  const handler = useCallback((message: Message, eventType?: 'INSERT' | 'UPDATE') => {
    callbackRef.current(message, eventType);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const unsubscribe = subscribeToMessages(currentUserId, handler);
    return unsubscribe;
  }, [currentUserId, handler]);
};
