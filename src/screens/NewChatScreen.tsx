import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { searchByUsername, addContact } from '../services/contactService';
import { upsertChat } from '../services/localDatabase';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types';

interface NewChatScreenProps {
  navigation: any;
}

const NewChatScreen: React.FC<NewChatScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchedProfile, setSearchedProfile] = useState<Profile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleSearch = async () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setSearching(true);
    setSearchedProfile(null);
    setNotFound(false);

    const result = await searchByUsername(query);
    setSearching(false);

    if (result.success && result.profile) {
      if (result.profile.id === user?.id) {
        Alert.alert('Oops', "You can't add yourself as a contact");
        return;
      }
      setSearchedProfile(result.profile);
    } else {
      setNotFound(true);
    }
  };

  const handleAddContact = async () => {
    if (!user || !searchedProfile) return;
    setAdding(true);
    const result = await addContact(user.id, searchedProfile.id);

    if (result.success) {
      await upsertChat({
        id: searchedProfile.id,
        contact_name: searchedProfile.display_name,
        contact_phone: searchedProfile.username,
        last_message: '',
        last_message_time: 0,
        unread_count: 0,
      });
    }

    setAdding(false);

    if (result.success) {
      Alert.alert('Success', `${searchedProfile.display_name} added to contacts!`, [
        {
          text: 'Chat Now',
          onPress: () =>
            navigation.navigate('Chat', {
              contactId: searchedProfile.id,
              contactName: searchedProfile.display_name,
              contactPhone: searchedProfile.username,
            }),
        },
        {
          text: 'Back',
          style: 'cancel',
        },
      ]);
    } else if (result.error === 'already_added') {
      Alert.alert('Already Added', 'This contact is already in your list');
    } else {
      Alert.alert('Error', result.error || 'Failed to add contact');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.heading}>Find by Username</Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setSearchedProfile(null);
              setNotFound(false);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.searchButton, searching && styles.buttonDisabled]}
            onPress={handleSearch}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {notFound && (
          <View style={styles.resultContainer}>
            <Text style={styles.notFoundText}>User not found on QuarisMe</Text>
          </View>
        )}

        {searchedProfile && (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {searchedProfile.display_name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{searchedProfile.display_name}</Text>
              <Text style={styles.profilePhone}>{searchedProfile.username}</Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, adding && styles.buttonDisabled]}
              onPress={handleAddContact}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.addButtonText}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.black,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  resultContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: COLORS.danger,
    fontWeight: '500',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default NewChatScreen;
