// Profile Screen - User profile and settings
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { profileAPI } from '../../api/endpoints';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      const refreshProfile = async () => {
        try {
          const freshUser = await profileAPI.getMyProfile();
          setUser(freshUser);
        } catch (error) {
          console.error('Error refreshing profile:', error);
        }
      };
      refreshProfile();
    }, [setUser])
  );

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {user && (
          <>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.photoContainer}>
                {user.profile_photo_url ? (
                  <Image source={{ uri: user.profile_photo_url }} style={styles.profilePhoto} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="person" size={52} color="#ccc" />
                  </View>
                )}
              </View>

              <Text style={styles.displayName}>{user.display_name || user.username}</Text>

              <View style={styles.metaRow}>
                {user.city && (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color="#888" />
                    <Text style={styles.metaText}>{user.city}</Text>
                  </View>
                )}
                {user.instagram_handle && (
                  <View style={styles.metaItem}>
                    <Ionicons name="logo-instagram" size={14} color="#888" />
                    <Text style={styles.metaText}>@{user.instagram_handle}</Text>
                  </View>
                )}
              </View>

              {user.bio && (
                <Text style={styles.bio}>{user.bio}</Text>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Photo Gallery */}
            {user.photo_gallery && user.photo_gallery.length > 0 && (
              <View style={styles.gallerySection}>
                <Text style={styles.galleryTitle}>Photos</Text>
                <View style={styles.galleryGrid}>
                  {user.photo_gallery.map((photoUrl: string, index: number) => (
                    <View key={index} style={styles.galleryPhotoContainer}>
                      <Image source={{ uri: photoUrl }} style={styles.galleryPhoto} resizeMode="cover" />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#888" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B8860B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  photoContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profilePhoto: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#B8860B',
  },
  photoPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  displayName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  username: {
    fontSize: 15,
    color: '#B8860B',
    fontWeight: '500',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#888',
  },
  bio: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  gallerySection: {
    paddingTop: 24,
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 14,
    letterSpacing: 0.2,
    paddingHorizontal: 20,
  },
  galleryGrid: {
    flexDirection: 'column',
    gap: 0,
  },
  galleryPhotoContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  galleryPhoto: {
    width: '100%',
    height: '100%',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 36,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  logoutButtonText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '500',
  },
});
