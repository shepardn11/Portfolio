// Listing Card Component - Display activity listing
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityListing } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ListingCardProps {
  listing: ActivityListing;
  onPress?: () => void;
  pendingRequestCount?: number;
}

export default function ListingCard({ listing, onPress, pendingRequestCount }: ListingCardProps) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      sports: 'football',
      food: 'restaurant',
      entertainment: 'film',
      outdoor: 'leaf',
      fitness: 'barbell',
      social: 'people',
      other: 'apps',
    };
    return icons[category] || 'apps';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      sports: '#10b981',
      food: '#f59e0b',
      entertainment: '#8b5cf6',
      outdoor: '#22c55e',
      fitness: '#ef4444',
      social: '#3b82f6',
      other: '#6b7280',
    };
    return colors[category] || '#6b7280';
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.95}
    >

      {/* Large Featured Image - Use photo_url from listing, or fall back to profile photo */}
      {(listing.photo_url || listing.profile_photo_url) ? (
        <Image
          source={{ uri: listing.photo_url || listing.profile_photo_url }}
          style={styles.featuredImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.featuredImage, styles.placeholderImage]}>
          <Ionicons name="image-outline" size={80} color="#999" />
        </View>
      )}

      {/* Gradient Overlay for Text Readability */}
      <View style={styles.gradientOverlay} />

      {/* Category Badge - Top Right */}
      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(listing.category) }]}>
        <Ionicons
          name={getCategoryIcon(listing.category)}
          size={14}
          color="#fff"
        />
        <Text style={styles.categoryText}>
          {listing.category}
        </Text>
      </View>

      {/* Request Badge - Top Left */}
      {pendingRequestCount && pendingRequestCount > 0 && (
        <View style={styles.requestBadge}>
          <Ionicons name="notifications" size={16} color="#fff" />
          <Text style={styles.requestBadgeText}>{String(pendingRequestCount)}</Text>
        </View>
      )}

      {/* Content Overlay - Bottom */}
      <View style={styles.contentOverlay}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          {/* Date & Time */}
          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={18} color="#fff" />
            <Text style={styles.infoText} numberOfLines={1}>
              {formatDate(listing.date)}
            </Text>
          </View>

          {listing.time && (
            <View style={styles.infoItem}>
              <Ionicons name="time" size={18} color="#fff" />
              <Text style={styles.infoText} numberOfLines={1}>
                {formatTime(listing.time)}
              </Text>
            </View>
          )}

          {/* Location */}
          <View style={[styles.infoItem, styles.infoItemFull]}>
            <Ionicons name="location" size={18} color="#fff" />
            <Text style={styles.infoText} numberOfLines={1}>
              {listing.location}
            </Text>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userBar}>
          {listing.profile_photo_url ? (
            <Image
              source={{ uri: listing.profile_photo_url }}
              style={styles.smallProfilePhoto}
            />
          ) : (
            <View style={[styles.smallProfilePhoto, styles.profilePhotoPlaceholder]}>
              <Ionicons name="person" size={16} color="#fff" />
            </View>
          )}
          <Text style={styles.userName}>{listing.display_name || listing.username}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#000',
    marginBottom: 16,
    minHeight: SCREEN_HEIGHT * 0.65,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  placeholderImage: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '33%',
    backgroundColor: '#000',
    opacity: 0.7,
  },
  categoryBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 2,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requestBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 2,
  },
  requestBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 4,
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    zIndex: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  infoItemFull: {
    flex: 1,
    minWidth: '100%',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  smallProfilePhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profilePhotoPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
