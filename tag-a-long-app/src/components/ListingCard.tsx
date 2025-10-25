// Listing Card Component - Display activity listing
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityListing } from '../types';

interface ListingCardProps {
  listing: ActivityListing;
  onPress?: () => void;
}

export default function ListingCard({ listing, onPress }: ListingCardProps) {
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
      activeOpacity={0.7}
    >
      {/* Premium Badge */}
      {listing.is_premium && (
        <View style={styles.premiumBadge}>
          <Ionicons name="star" size={14} color="#fbbf24" />
          <Text style={styles.premiumText}>Premium</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        {/* Profile Photo */}
        <View style={styles.profileSection}>
          {listing.profile_photo_url ? (
            <Image
              source={{ uri: listing.profile_photo_url }}
              style={styles.profilePhoto}
            />
          ) : (
            <View style={[styles.profilePhoto, styles.profilePhotoPlaceholder]}>
              <Ionicons name="person" size={20} color="#999" />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.displayName}>{listing.display_name || listing.username}</Text>
            <Text style={styles.username}>@{listing.username}</Text>
          </View>
        </View>

        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(listing.category) + '20' }]}>
          <Ionicons
            name={getCategoryIcon(listing.category)}
            size={16}
            color={getCategoryColor(listing.category)}
          />
          <Text style={[styles.categoryText, { color: getCategoryColor(listing.category) }]}>
            {listing.category}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{listing.title}</Text>

      {/* Description */}
      {listing.description && (
        <Text style={styles.description} numberOfLines={2}>
          {listing.description}
        </Text>
      )}

      {/* Details */}
      <View style={styles.details}>
        {/* Date & Time */}
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {formatDate(listing.date)}
            {listing.time && ` at ${formatTime(listing.time)}`}
          </Text>
        </View>

        {/* Location */}
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText} numberOfLines={1}>
            {listing.location}
          </Text>
        </View>

        {/* Participants */}
        {listing.max_participants && (
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              Max {listing.max_participants} people
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.status}>{listing.status}</Text>
        <Text style={styles.timestamp}>
          {new Date(listing.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  premiumText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d97706',
    marginLeft: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profilePhotoPlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  username: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
});
