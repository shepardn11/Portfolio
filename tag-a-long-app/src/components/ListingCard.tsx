// Listing Card Component - Display activity listing
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityListing } from '../types';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface ListingCardProps {
  listing: ActivityListing;
  onPress?: () => void;
  pendingRequestCount?: number;
}

export default function ListingCard({ listing, onPress, pendingRequestCount }: ListingCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Swipe gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes (not vertical scrolling)
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
        return isHorizontalSwipe;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
        return isHorizontalSwipe;
      },
      onPanResponderGrant: () => {
        // Reset to current position when gesture starts
        pan.setOffset({
          x: pan.x._value,
          y: 0,
        });
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow right swipes
        if (gestureState.dx > 0) {
          pan.setValue({ x: gestureState.dx, y: 0 });
          // Fade out as user swipes
          const newOpacity = 1 - gestureState.dx / (SCREEN_WIDTH * 0.5);
          opacity.setValue(Math.max(0.3, newOpacity));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();

        // If swiped more than 30% of screen width, navigate
        if (gestureState.dx > SCREEN_WIDTH * 0.3) {
          // Animate card off screen
          Animated.parallel([
            Animated.timing(pan, {
              toValue: { x: SCREEN_WIDTH, y: 0 },
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start(() => {
            // Trigger navigation
            if (onPress) onPress();
            // Reset position after navigation
            pan.setValue({ x: 0, y: 0 });
            opacity.setValue(1);
          });
        } else {
          // Snap back to original position
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
              friction: 8,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        // Snap back if gesture is interrupted
        pan.flattenOffset();
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start();
      },
    })
  ).current;

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

  const animatedCardStyle = {
    transform: [{ translateX: pan.x }],
    opacity: opacity,
  };

  const handleTap = () => {
    // Simple tap navigation as fallback
    if (onPress) {
      onPress();
    }
  };

  return (
    <Animated.View
      style={[styles.card, animatedCardStyle]}
      {...panResponder.panHandlers}
    >
      {/* Tap overlay for easier navigation */}
      <TouchableOpacity
        style={styles.tapOverlay}
        onPress={handleTap}
        activeOpacity={1}
      />

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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#000',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: SCREEN_HEIGHT * 0.75,
    overflow: 'hidden',
    position: 'relative',
  },
  tapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
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
    height: '50%',
    backgroundColor: '#000',
    opacity: 0.6,
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
    padding: 20,
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
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
