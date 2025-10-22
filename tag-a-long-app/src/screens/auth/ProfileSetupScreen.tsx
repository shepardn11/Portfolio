// Profile Setup Screen - Complete profile after signup
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { profileAPI } from '../../api/endpoints';
import { Ionicons } from '@expo/vector-icons';

type ProfileSetupScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ProfileSetup'
>;

interface Props {
  navigation: ProfileSetupScreenNavigationProp;
}

export default function ProfileSetupScreen({ navigation }: Props) {
  const { user, updateUser, setIsAuthenticated, setProfileSetupComplete } = useAuthStore();
  const [bio, setBio] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [wantsPremium, setWantsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPhoto = () => {
    if (photos.length >= 5) {
      Alert.alert('Maximum Photos', 'You can upload up to 5 photos');
      return;
    }
    Alert.alert(
      'Add Photo',
      'Photo upload will be implemented with image picker.\nFor now, you can skip this step.',
      [{ text: 'OK' }]
    );
    // TODO: Implement image picker
    // For now, users can skip photos
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);

      // Update profile with bio and instagram if provided
      const updates: any = {};

      if (bio.trim()) {
        updates.bio = bio.trim();
      }

      if (instagramHandle.trim()) {
        updates.instagram_handle = instagramHandle.trim();
      }

      // Only update if there's something to update
      if (Object.keys(updates).length > 0) {
        const updatedUser = await profileAPI.updateProfile(updates);
        updateUser(updatedUser);
      }

      // If user wants premium, show subscription info
      if (wantsPremium) {
        Alert.alert(
          'Premium Subscription',
          'Premium features coming soon! You can upgrade later from your profile.',
          [{ text: 'OK', onPress: () => completeSetup() }]
        );
      } else {
        completeSetup();
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || 'Could not update profile'
      );
      setIsLoading(false);
    }
  };

  const completeSetup = () => {
    // Mark profile setup as complete and authenticate user
    setProfileSetupComplete(true);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const handleSkip = () => {
    completeSetup();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Add photos and tell us about yourself
            </Text>
          </View>

          {/* Photos Section */}
          <View style={styles.photosSection}>
            <Text style={styles.sectionTitle}>Photos (Optional - up to 5)</Text>
            <View style={styles.photosGrid}>
              {[0, 1, 2, 3, 4].map((index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.photoBox}
                  onPress={handleAddPhoto}
                  disabled={isLoading}
                >
                  {photos[index] ? (
                    <View>
                      <Image source={{ uri: photos[index] }} style={styles.photoImage} />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => handleRemovePhoto(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#ff4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera" size={30} color="#999" />
                      <Text style={styles.photoPlaceholderText}>
                        {index === 0 ? 'Add' : '+'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Bio (Optional - tell others about yourself)"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              maxLength={150}
              textAlignVertical="top"
              editable={!isLoading}
            />
            <Text style={styles.characterCount}>{bio.length}/150</Text>

            <TextInput
              style={styles.input}
              placeholder="Instagram Handle (Optional)"
              value={instagramHandle}
              onChangeText={setInstagramHandle}
              autoCapitalize="none"
              editable={!isLoading}
            />

            {/* Premium Subscription Option */}
            <TouchableOpacity
              style={styles.premiumOption}
              onPress={() => setWantsPremium(!wantsPremium)}
              disabled={isLoading}
            >
              <View style={styles.premiumContent}>
                <Ionicons
                  name={wantsPremium ? 'checkbox' : 'square-outline'}
                  size={24}
                  color="#6366f1"
                />
                <View style={styles.premiumText}>
                  <Text style={styles.premiumTitle}>Try Premium Free</Text>
                  <Text style={styles.premiumSubtitle}>
                    Get priority placement and exclusive features
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.completeButton, isLoading && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.completeButtonText}>Complete Profile</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isLoading}
            >
              <Text style={styles.skipButtonText}>Skip for Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  photosSection: {
    marginBottom: 25,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoBox: {
    width: '18%',
    aspectRatio: 1,
    marginBottom: 10,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bioInput: {
    height: 90,
    paddingTop: 15,
    marginBottom: 5,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginBottom: 15,
  },
  premiumOption: {
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e8ebff',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumText: {
    marginLeft: 12,
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 2,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  completeButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 5,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
