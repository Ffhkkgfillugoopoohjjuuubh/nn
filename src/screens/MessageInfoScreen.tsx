import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';
import { LocalMessage } from '../types';

interface MessageInfoScreenProps {
  navigation: any;
  route: any;
}

const formatTime = (ts: number): string => {
  return new Date(ts).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const MessageInfoScreen: React.FC<MessageInfoScreenProps> = ({ navigation, route }) => {
  const { message, isOwn } = route.params || {};
  const msg = message as LocalMessage | undefined;

  if (!msg) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Message not found</Text>
      </View>
    );
  }

  const statusLabel = () => {
    switch (msg.delivery_status) {
      case 'sending': return 'Sending';
      case 'sent': return 'Sent';
      case 'delivered': return 'Delivered';
      case 'read': return 'Read';
      default: return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{statusLabel()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Sent</Text>
          <Text style={styles.value}>{formatTime(msg.timestamp)}</Text>
        </View>
        {(msg.delivery_status === 'delivered' || msg.delivery_status === 'read') && (
          <>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Delivered</Text>
              <Text style={styles.value}>{formatTime(msg.timestamp)}</Text>
            </View>
          </>
        )}
        {msg.delivery_status === 'read' && isOwn && (
          <>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Read</Text>
              <Text style={styles.value}>{formatTime(msg.timestamp)}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
});

export default MessageInfoScreen;
