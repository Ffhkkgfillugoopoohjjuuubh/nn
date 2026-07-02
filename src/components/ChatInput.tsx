import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS } from '../utils/constants';

interface ChatInputProps {
  onSend: (text: string) => void;
  editMessage?: string;
  onCancelEdit?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, editMessage, onCancelEdit }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (editMessage !== undefined) {
      setText(editMessage);
    }
  }, [editMessage]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        {editMessage !== undefined && (
          <TouchableOpacity onPress={onCancelEdit} style={styles.cancelEdit}>
            <Text style={styles.cancelEditText}>✕</Text>
          </TouchableOpacity>
        )}
        <TextInput
          style={styles.input}
          placeholder={editMessage !== undefined ? 'Edit message' : 'Type a message'}
          placeholderTextColor={COLORS.gray}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={4096}
        />
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
    color: COLORS.black,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  sendIcon: {
    color: COLORS.white,
    fontSize: 16,
  },
  cancelEdit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  cancelEditText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

export default ChatInput;
