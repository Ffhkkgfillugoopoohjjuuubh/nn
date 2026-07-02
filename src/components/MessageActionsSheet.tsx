import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { COLORS } from '../utils/constants';

interface MessageActionsSheetProps {
  visible: boolean;
  isOwn: boolean;
  canDeleteEveryone: boolean;
  canEdit: boolean;
  onClose: () => void;
  onCopy: () => void;
  onDeleteMe: () => void;
  onDeleteEveryone: () => void;
  onMessageInfo: () => void;
  onEdit?: () => void;
}

const MessageActionsSheet: React.FC<MessageActionsSheetProps> = ({
  visible,
  isOwn,
  canDeleteEveryone,
  canEdit,
  onClose,
  onCopy,
  onDeleteMe,
  onDeleteEveryone,
  onMessageInfo,
  onEdit,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <TouchableOpacity style={styles.option} onPress={onCopy}>
            <Text style={styles.optionText}>Copy</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          {isOwn && canEdit && (
            <>
              <TouchableOpacity style={styles.option} onPress={onEdit}>
                <Text style={styles.optionText}>Edit</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
            </>
          )}
          {isOwn && canDeleteEveryone && (
            <>
              <TouchableOpacity style={styles.option} onPress={onDeleteEveryone}>
                <Text style={[styles.optionText, styles.dangerText]}>Delete for Everyone</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
            </>
          )}
          <TouchableOpacity style={styles.option} onPress={onDeleteMe}>
            <Text style={[styles.optionText, styles.dangerText]}>Delete for Me</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.option} onPress={onMessageInfo}>
            <Text style={styles.optionText}>Message Info</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 24,
  },
  dangerText: {
    color: COLORS.danger,
  },
});

export default MessageActionsSheet;
