import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

interface ChatBubbleProps {
  content: string;
  isSent: boolean;
  timestamp: number;
  deliveryStatus?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  isSent,
  timestamp,
  deliveryStatus,
}) => {
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusIcon = () => {
    if (!isSent) return null;
    switch (deliveryStatus) {
      case 'sending':
        return '⏳';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '✓';
    }
  };

  return (
    <View
      style={[
        styles.bubble,
        isSent ? styles.sentBubble : styles.receivedBubble,
        isSent ? styles.sentAlign : styles.receivedAlign,
      ]}
    >
      <Text style={[styles.messageText, isSent ? styles.sentText : styles.receivedText]}>
        {content}
      </Text>
      <View style={styles.metaContainer}>
        <Text style={[styles.timeText, isSent ? styles.sentTime : styles.receivedTime]}>
          {time}
        </Text>
        {isSent && (
          <Text style={[styles.statusText, deliveryStatus === 'read' ? styles.readStatus : styles.sentStatus]}>
            {statusIcon()}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '75%',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 10,
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
  },
  sentText: {
    color: COLORS.black,
  },
  receivedText: {
    color: COLORS.black,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
  },
  sentTime: {
    color: '#666',
  },
  receivedTime: {
    color: '#666',
  },
  statusText: {
    fontSize: 12,
    marginLeft: 3,
  },
  readStatus: {
    color: '#53BDEB',
  },
  sentStatus: {
    color: '#666',
  },
});

export default ChatBubble;
