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
  Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { profileAPI } from '../../api/endpoints';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../api/client';
import { uploadImage } from '../../utils/imageUpload';

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
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<(string | null)[]>([null, null, null, null, null]);
  const [wantsPremium, setWantsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadingGalleryIndex, setUploadingGalleryIndex] = useState<number | null>(null);

  const handleAddPhoto = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload a profile picture.');
        return;
      }

      // Open image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('DEBUG ProfileSetup: Inside result check');
        setIsUploadingPhoto(true);
        console.log('DEBUG ProfileSetup: isUploadingPhoto set to true');
        const imageUri = result.assets[0].uri;
        console.log('DEBUG ProfileSetup: Image selected:', imageUri);
        console.log('DEBUG ProfileSetup: User:', JSON.stringify(user));

        if (!user || !user.id) {
          console.error('DEBUG ProfileSetup: User is null or missing ID!');
          Alert.alert('Error', 'User not found - cannot upload photo');
          throw new Error('User not found - cannot upload photo');
        }

        console.log('DEBUG ProfileSetup: User check passed, user.id:', user.id);

        // Upload to Supabase Storage
        console.log('DEBUG ProfileSetup: Starting upload to Supabase...');
        const publicUrl = await uploadImage(imageUri, user.id);
        console.log('DEBUG ProfileSetup: Upload successful, URL:', publicUrl);

        // Update profile via backend API using the photo endpoint
        console.log('DEBUG ProfileSetup: Updating profile via API...');
        const response = await apiClient.getInstance().post('/profile/photo', {
          photo_url: publicUrl,
        });

        if (!response.data.success) {
          throw new Error('Failed to update profile with photo');
        }

        const updatedUser = response.data.data;
        console.log('DEBUG ProfileSetup: Profile updated:', updatedUser);

        // Update local state
        console.log('DEBUG ProfileSetup: Setting profilePhoto state to:', publicUrl);
        setProfilePhoto(publicUrl);
        updateUser(updatedUser);

        console.log('DEBUG ProfileSetup: Profile photo should now be visible');
        Alert.alert('Success', 'Profile photo uploaded!');
      }
    } catch (error: any) {
      console.error('DEBUG ProfileSetup: Photo upload error:', error);
      console.error('DEBUG ProfileSetup: Error details:', error.response?.data);
      Alert.alert('Upload Failed', error.message || 'Could not upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
  };

  const handleAddGalleryPhoto = async (index: number) => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload a profile picture.');
        return;
      }

      // Open image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && user) {
        setUploadingGalleryIndex(index);
        const imageUri = result.assets[0].uri;
        console.log('DEBUG ProfileSetup: Gallery image selected:', imageUri, 'index:', index);

        // Upload to Supabase Storage
        console.log('DEBUG ProfileSetup: Uploading gallery photo to Supabase...');
        const publicUrl = await uploadImage(imageUri, user.id);
        console.log('DEBUG ProfileSetup: Gallery upload successful, URL:', publicUrl);

        // Update profile via backend API using the gallery endpoint
        console.log('DEBUG ProfileSetup: Adding to gallery via API...');
        const response = await apiClient.getInstance().post('/profile/gallery', {
          photo_url: publicUrl,
        });

        if (!response.data.success) {
          throw new Error('Failed to add photo to gallery');
        }

        console.log('DEBUG ProfileSetup: Gallery updated:', response.data.data);

        // Update local state with the uploaded photo URL
        const newGalleryPhotos = [...galleryPhotos];
        newGalleryPhotos[index] = publicUrl;
        console.log('DEBUG ProfileSetup: Updating local state, newGalleryPhotos:', newGalleryPhotos);
        setGalleryPhotos(newGalleryPhotos);

        // Update user store with new gallery
        if (user) {
          updateUser({ ...user, photo_gallery: response.data.data.photo_gallery });
        }

        console.log('DEBUG ProfileSetup: Photo should now be visible at index', index);
        Alert.alert('Success', 'Photo added to gallery!');
      }
    } catch (error: any) {
      console.error('DEBUG ProfileSetup: Gallery photo upload error:', error);
      console.error('DEBUG ProfileSetup: Error details:', error.response?.data);
      Alert.alert('Upload Failed', error.message || 'Could not upload photo. Please try again.');
    } finally {
      setUploadingGalleryIndex(null);
    }
  };

  const handleRemoveGalleryPhoto = (index: number) => {
    const newGalleryPhotos = [...galleryPhotos];
    newGalleryPhotos[index] = null;
    setGalleryPhotos(newGalleryPhotos);
  };

  const handleComplete = async () => {
    console.log('DEBUG: handleComplete called');
    console.log('DEBUG: wantsPremium:', wantsPremium);
    try {
      setIsLoading(true);
      console.log('DEBUG: Loading state set to true');

      // Update profile with bio and instagram if provided
      const updates: any = {};

      if (bio.trim()) {
        updates.bio = bio.trim();
      }

      if (instagramHandle.trim()) {
        updates.instagram_handle = instagramHandle.trim();
      }

      console.log('DEBUG: Updates to apply:', updates);

      // Only update if there's something to update
      if (Object.keys(updates).length > 0) {
        console.log('DEBUG: Updating profile...');
        const updatedUser = await profileAPI.updateProfile(updates);
        updateUser(updatedUser);
        console.log('DEBUG: Profile updated successfully');
      }

      // If user wants premium, create Stripe checkout session
      if (wantsPremium) {
        console.log('DEBUG: User wants premium, creating checkout session...');
        try {
          console.log('DEBUG: Calling /subscription/create-checkout endpoint...');
          const response = await apiClient.getInstance().post('/subscription/create-checkout');
          console.log('DEBUG: Checkout response:', response.data);

          if (response.data.url) {
            console.log('DEBUG: Got checkout URL:', response.data.url);

            // Stop loading state
            setIsLoading(false);

            console.log('DEBUG: Opening Stripe checkout URL...');

            // Open Stripe checkout URL - use window.open for web, Linking for mobile
            try {
              if (Platform.OS === 'web') {
                console.log('DEBUG: Opening in web browser using window.open');
                window.open(response.data.url, '_blank');
                console.log('DEBUG: window.open called');
              } else {
                console.log('DEBUG: Opening in mobile browser using Linking');
                const canOpen = await Linking.canOpenURL(response.data.url);
                console.log('DEBUG: Can open URL?', canOpen);
                if (canOpen) {
                  await Linking.openURL(response.data.url);
                  console.log('DEBUG: URL opened successfully');
                } else {
                  console.log('DEBUG: Cannot open URL');
                  Alert.alert('Error', 'Cannot open payment page. Please try again later.');
                }
              }
            } catch (linkError: any) {
              console.error('DEBUG: Error opening URL:', linkError);
              Alert.alert('Error', 'Could not open payment page: ' + linkError.message);
            }

            // Complete setup (user can return to app after payment)
            console.log('DEBUG: Completing setup...');
            completeSetup();
          } else {
            throw new Error('No checkout URL received');
          }
        } catch (error: any) {
          console.error('Create checkout error:', error);
          setIsLoading(false);
          Alert.alert(
            'Subscription Error',
            'Could not create checkout session. You can upgrade later from your profile.',
            [{ text: 'OK', onPress: () => completeSetup() }]
          );
        }
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

          {/* Profile Photo Section */}
          <View style={styles.photosSection}>
            <Text style={styles.sectionTitle}>Profile Photo (Optional)</Text>
            <View style={styles.photoContainer}>
              <TouchableOpacity
                style={styles.largePhotoBox}
                onPress={handleAddPhoto}
                disabled={isLoading || isUploadingPhoto}
              >
                {(() => {
                  console.log('DEBUG ProfileSetup: Rendering profile photo, profilePhoto:', profilePhoto, 'isUploadingPhoto:', isUploadingPhoto);
                  if (isUploadingPhoto) {
                    return <ActivityIndicator size="large" color="#6366f1" />;
                  } else if (profilePhoto) {
                    return (
                      <View style={{ width: '100%', height: '100%' }}>
                        <Image
                          source={{ uri: profilePhoto }}
                          style={styles.largePhotoImage}
                          onLoad={() => console.log('DEBUG ProfileSetup: Profile photo loaded')}
                          onError={(error) => console.log('DEBUG ProfileSetup: Profile photo error:', error.nativeEvent)}
                        />
                        <TouchableOpacity
                          style={styles.removePhotoButton}
                          onPress={handleRemovePhoto}
                        >
                          <Ionicons name="close-circle" size={32} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    );
                  } else {
                    return (
                      <View style={styles.photoPlaceholder}>
                        <Ionicons name="camera" size={48} color="#999" />
                        <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
                      </View>
                    );
                  }
                })()}
              </TouchableOpacity>
            </View>
          </View>

          {/* Photo Gallery Section */}
          <View style={styles.photosSection}>
            <Text style={styles.sectionTitle}>Photo Gallery (Optional - up to 5 photos)</Text>
            <View style={styles.galleryGrid}>
              {galleryPhotos.map((photo, index) => {
                console.log(`DEBUG ProfileSetup: Rendering gallery slot ${index}, photo:`, photo);
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.galleryPhotoBox}
                    onPress={() => handleAddGalleryPhoto(index)}
                    disabled={isLoading || uploadingGalleryIndex !== null}
                  >
                    {uploadingGalleryIndex === index ? (
                      <ActivityIndicator size="small" color="#6366f1" />
                    ) : photo ? (
                      <View style={{ width: '100%', height: '100%' }}>
                        <Image
                          source={{ uri: photo }}
                          style={styles.galleryPhotoImage}
                          onLoad={() => console.log(`DEBUG ProfileSetup: Image loaded at index ${index}`)}
                          onError={(error) => console.log(`DEBUG ProfileSetup: Image error at index ${index}:`, error.nativeEvent)}
                        />
                        <TouchableOpacity
                          style={styles.removeGalleryPhotoButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleRemoveGalleryPhoto(index);
                          }}
                        >
                          <Ionicons name="close-circle" size={24} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.galleryPhotoPlaceholder}>
                        <Ionicons name="add" size={32} color="#999" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
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
                  name={wantsPremium ? 'checkbox-outline' : 'square-outline'}
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
  photoContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  largePhotoBox: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
  },
  largePhotoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 75,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  galleryPhotoBox: {
    width: '18%',
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryPhotoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  removeGalleryPhotoButton: {
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
