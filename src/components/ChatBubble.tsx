import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

interface ChatBubbleProps {
  content: string;
  isSent: boolean;
  timestamp: number;
  deliveryStatus?: string;
  onLongPress?: () => void;
}

const formatMessageTime = (ts: number): string => {
  const date = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const renderStatusIcon = (isSent: boolean, deliveryStatus?: string) => {
  if (!isSent) return null;
  switch (deliveryStatus) {
    case 'sending':
      return <Text style={styles.statusSending}>⏳</Text>;
    case 'sent':
      return <Text style={styles.statusSent}>✓</Text>;
    case 'delivered':
      return <Text style={styles.statusDelivered}>✓✓</Text>;
    case 'read':
      return <Text style={styles.statusRead}>✓✓</Text>;
    default:
      return <Text style={styles.statusSent}>✓</Text>;
  }
};

const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  isSent,
  timestamp,
  deliveryStatus,
  onLongPress,
}) => {
  const isDeleted = content === 'This message was deleted.';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={onLongPress}
      delayLongPress={500}
      style={[
        styles.bubble,
        isSent ? styles.sentBubble : styles.receivedBubble,
        isSent ? styles.sentAlign : styles.receivedAlign,
      ]}
    >
      <Text style={[
        styles.messageText,
        isSent ? styles.sentText : styles.receivedText,
        isDeleted && styles.deletedText,
      ]}>
        {isDeleted ? 'This message was deleted.' : content}
      </Text>
      <View style={styles.metaRow}>
        <Text style={[styles.timeText, isSent ? styles.sentTime : styles.receivedTime]}>
          {formatMessageTime(timestamp)}
        </Text>
        {isSent && renderStatusIcon(isSent, deliveryStatus)}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    paddingTop: 8,
    borderRadius: 8,
    marginVertical: 3,
    marginHorizontal: 12,
  },
  sentBubble: {
    backgroundColor: COLORS.sentBubble,
    alignSelf: 'flex-end',
    borderTopRightRadius: 2,
  },
  receivedBubble: {
    backgroundColor: COLORS.receivedBubble,
    alignSelf: 'flex-start',
    borderTopLeftRadius: 2,
  },
  sentAlign: {
    alignSelf: 'flex-end',
  },
  receivedAlign: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.black,
  },
  sentText: {
    color: COLORS.black,
  },
  receivedText: {
    color: COLORS.black,
  },
  deletedText: {
    fontStyle: 'italic',
    color: COLORS.gray,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
  },
  sentTime: {
    color: '#667781',
  },
  receivedTime: {
    color: '#667781',
  },
  statusSending: {
    fontSize: 10,
  },
  statusSent: {
    fontSize: 12,
    color: '#8696A0',
  },
  statusDelivered: {
    fontSize: 12,
    color: '#8696A0',
  },
  statusRead: {
    fontSize: 12,
    color: '#53BDEB',
  },
});

export default ChatBubble;
