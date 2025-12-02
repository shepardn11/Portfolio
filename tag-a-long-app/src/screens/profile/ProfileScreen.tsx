// Profile Screen - User profile and settings
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {user && (
          <View style={styles.userInfo}>
            {/* Profile Photo */}
            <View style={styles.photoContainer}>
              {user.profile_photo_url ? (
                <Image
                  source={{ uri: user.profile_photo_url }}
                  style={styles.profilePhoto}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={48} color="#999" />
                </View>
              )}
            </View>

            <Text style={styles.username}>@{user.username}</Text>
            {user.display_name && (
              <Text style={styles.displayName}>{user.display_name}</Text>
            )}
            {user.city && (
              <Text style={styles.city}>{user.city}</Text>
            )}
            {user.bio && (
              <Text style={styles.bio}>{user.bio}</Text>
            )}
            {user.instagram_handle && (
              <Text style={styles.instagram}>Instagram: @{user.instagram_handle}</Text>
            )}

            {/* Photo Gallery */}
            {user.photo_gallery && user.photo_gallery.length > 0 && (
              <View style={styles.gallerySection}>
                <Text style={styles.galleryTitle}>Photos</Text>
                <View style={styles.galleryGrid}>
                  {user.photo_gallery.map((photoUrl: string, index: number) => (
                    <View key={index} style={styles.galleryPhotoContainer}>
                      <Image
                        source={{ uri: photoUrl }}
                        style={styles.galleryPhoto}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfo: {
    alignItems: 'center',
    marginVertical: 30,
  },
  photoContainer: {
    marginBottom: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6366f1',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e0e0e0',
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 8,
  },
  displayName: {
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
  },
  city: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  bio: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginTop: 12,
    marginHorizontal: 20,
    lineHeight: 20,
  },
  instagram: {
    fontSize: 15,
    color: '#6366f1',
    marginTop: 8,
  },
  gallerySection: {
    marginTop: 30,
    width: '100%',
    paddingHorizontal: 20,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  galleryPhotoContainer: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  galleryPhoto: {
    width: '100%',
    height: '100%',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
