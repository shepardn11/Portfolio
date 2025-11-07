// Activity Detail Screen - Full activity information with Tag-a-long button
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList, ActivityListing } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { listingAPI, requestAPI } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';

type ActivityDetailScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'ActivityDetail'
>;

type ActivityDetailScreenRouteProp = RouteProp<
  HomeStackParamList,
  'ActivityDetail'
>;

interface Props {
  navigation: ActivityDetailScreenNavigationProp;
  route: ActivityDetailScreenRouteProp;
}

interface Request {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  requester: {
    id: string;
    username: string;
    display_name: string;
    profile_photo_url?: string;
  };
}

export default function ActivityDetailScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { user } = useAuthStore();
  const [listing, setListing] = useState<ActivityListing | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  // Check if this is the current user's own activity
  const isOwnActivity = listing?.user_id === user?.id;

  useEffect(() => {
    fetchActivity();
  }, [activityId]);

  const fetchActivity = async () => {
    try {
      setIsLoading(true);
      const data = await listingAPI.getById(activityId);
      console.log('Fetched activity data:', data);
      console.log('Activity user_id:', data.user_id);
      setListing(data);

      // If it's own activity, fetch requests
      if (data.user_id === user?.id) {
        await fetchRequests();
      }
    } catch (error: any) {
      console.error('Fetch activity error:', error);
      Alert.alert('Error', 'Could not load activity details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await requestAPI.getReceived(undefined, activityId);
      setRequests(data.requests);
    } catch (error: any) {
      console.error('Fetch requests error:', error);
    }
  };

  const handleTagAlong = async () => {
    if (!listing) return;

    try {
      setIsRequesting(true);
      await requestAPI.send(listing.id);
      setHasRequested(true);
      Alert.alert(
        'Request Sent!',
        `Your request to join "${listing.title}" has been sent. You'll be notified when the host responds.`
      );
    } catch (error: any) {
      console.error('Tag-along request error:', error);
      const errorMsg = error.response?.data?.error?.message || 'Could not send request';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await requestAPI.accept(requestId);
      Alert.alert('Accepted!', 'You accepted the Tag-A-Long request');
      await fetchRequests();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'Could not accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await requestAPI.decline(requestId);
      await fetchRequests();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'Could not reject request');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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

  if (isLoading || !listing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading activity...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Featured Image */}
        <Image
          source={{
            uri: listing.photo_url || listing.profile_photo_url || 'https://via.placeholder.com/400x300',
          }}
          style={styles.featuredImage}
          resizeMode="cover"
        />

        {/* Content */}
        <View style={[styles.content, isOwnActivity && styles.contentNoButton]}>
          {/* Category Badge */}
          <View
            style={[styles.categoryBadge, { backgroundColor: getCategoryColor(listing.category) }]}
          >
            <Ionicons name={getCategoryIcon(listing.category)} size={16} color="#fff" />
            <Text style={styles.categoryText}>{listing.category}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{listing.title}</Text>

          {/* Tag-A-Long Requests - Only show for own activities */}
          {isOwnActivity && requests.length > 0 && (
            <View style={styles.requestsSection}>
              <Text style={styles.sectionTitle}>Tag-A-Long Requests ({requests.length})</Text>
              {requests.map((request) => {
                if (!request || !request.requester) return null;

                return (
                  <View key={request.id} style={styles.requestCard}>
                    <TouchableOpacity
                      style={styles.requestHeader}
                      onPress={() => navigation.navigate('UserProfile', { userId: request.requester.id })}
                    >
                      {request.requester.profile_photo_url ? (
                        <Image
                          source={{ uri: request.requester.profile_photo_url }}
                          style={styles.requesterPhoto}
                        />
                      ) : (
                        <View style={[styles.requesterPhoto, styles.requesterPhotoPlaceholder]}>
                          <Ionicons name="person" size={20} color="#999" />
                        </View>
                      )}
                      <View style={styles.requesterInfo}>
                        <Text style={styles.requesterName}>{request.requester.display_name || 'Unknown'}</Text>
                        <Text style={styles.requesterUsername}>@{request.requester.username || 'unknown'}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>

                    {request.status === 'pending' ? (
                      <View style={styles.requestActions}>
                        <TouchableOpacity
                          style={[styles.requestButton, styles.acceptButton]}
                          onPress={() => handleAcceptRequest(request.id)}
                        >
                          <Ionicons name="checkmark-circle" size={18} color="#fff" />
                          <Text style={styles.requestButtonText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.requestButton, styles.declineButton]}
                          onPress={() => handleRejectRequest(request.id)}
                        >
                          <Ionicons name="close-circle" size={18} color="#fff" />
                          <Text style={styles.requestButtonText}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.requestStatusContainer}>
                        <Text
                          style={[
                            styles.requestStatusText,
                            request.status === 'accepted' ? styles.acceptedText : styles.rejectedText,
                          ]}
                        >
                          {request.status === 'accepted' ? '✓ Accepted' : '✗ Declined'}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Host Info */}
          <TouchableOpacity
            style={styles.hostSection}
            onPress={() => {
              console.log('Navigating to host profile, user_id:', listing.user_id);
              if (listing.user_id) {
                navigation.navigate('UserProfile', { userId: listing.user_id });
              } else {
                console.error('No user_id on listing:', listing);
              }
            }}
          >
            {listing.profile_photo_url ? (
              <Image source={{ uri: listing.profile_photo_url }} style={styles.hostPhoto} />
            ) : (
              <View style={[styles.hostPhoto, styles.hostPhotoPlaceholder]}>
                <Ionicons name="person" size={24} color="#999" />
              </View>
            )}
            <View style={styles.hostInfo}>
              <Text style={styles.hostLabel}>Hosted by</Text>
              <Text style={styles.hostName}>{listing.display_name || listing.username}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* Details Grid */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Details</Text>

            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={20} color="#6366f1" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(listing.date)}</Text>
                </View>
              </View>

              {listing.time && (
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={20} color="#6366f1" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>{formatTime(listing.time)}</Text>
                  </View>
                </View>
              )}

              <View style={styles.detailRow}>
                <Ionicons name="location" size={20} color="#6366f1" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{listing.location}</Text>
                </View>
              </View>

              {listing.max_participants && (
                <View style={styles.detailRow}>
                  <Ionicons name="people" size={20} color="#6366f1" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Looking for</Text>
                    <Text style={styles.detailValue}>
                      {listing.max_participants} {listing.max_participants === 1 ? 'person' : 'people'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {listing.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>About this activity</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          )}

          {/* Participants Section - TODO: Add when we have participants data */}
          {/* <View style={styles.participantsSection}>
            <Text style={styles.sectionTitle}>Who's joining</Text>
            <Text style={styles.comingSoon}>Coming soon!</Text>
          </View> */}
        </View>
      </ScrollView>

      {/* Fixed Bottom Button - Only show if not own activity */}
      {!isOwnActivity && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.tagAlongButton, (hasRequested || isRequesting) && styles.tagAlongButtonDisabled]}
            onPress={handleTagAlong}
            disabled={hasRequested || isRequesting}
          >
            {isRequesting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={hasRequested ? 'checkmark-circle' : 'add-circle'} size={24} color="#fff" />
                <Text style={styles.tagAlongButtonText}>
                  {hasRequested ? 'Request Sent' : 'Tag-A-Long!'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  featuredImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  contentNoButton: {
    paddingBottom: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 24,
  },
  hostPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  hostPhotoPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostInfo: {
    flex: 1,
  },
  hostLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  requestsSection: {
    marginBottom: 24,
  },
  requestCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requesterPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  requesterPhotoPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requesterInfo: {
    flex: 1,
  },
  requesterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  requesterUsername: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
  },
  requestButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#10b981',
    marginLeft: 0,
  },
  declineButton: {
    backgroundColor: '#6b7280',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  requestStatusContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  requestStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  acceptedText: {
    color: '#10b981',
  },
  rejectedText: {
    color: '#6b7280',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  comingSoon: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tagAlongButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tagAlongButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  tagAlongButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
});
