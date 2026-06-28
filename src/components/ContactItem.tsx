import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

interface ContactItemProps {
  name: string;
  phone: string;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: number;
  onlineStatus?: boolean;
  onPress: () => void;
}

const ContactItem: React.FC<ContactItemProps> = ({
  name,
  phone,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  onlineStatus,
  onPress,
}) => {
  const timeStr = lastMessageTime
    ? new Date(lastMessageTime).toLocaleDateString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {name.charAt(0).toUpperCase()}
        </Text>
        {onlineStatus && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {timeStr ? <Text style={styles.time}>{timeStr}</Text> : null}
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage || phone}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '600',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.onlineGreen,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textDark,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ContactItem;
