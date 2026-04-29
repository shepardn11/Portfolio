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
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList, ActivityListing } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { listingAPI, requestAPI } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { profileAPI } from '../../api/endpoints';

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
  const [editVisible, setEditVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editMaxParticipants, setEditMaxParticipants] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editTime, setEditTime] = useState(new Date());
  const [editTaggedUsers, setEditTaggedUsers] = useState<Array<{ id: string; username: string; display_name: string; profile_photo_url?: string }>>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<Array<{ id: string; username: string; display_name: string; profile_photo_url?: string }>>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);

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

  const openEdit = () => {
    if (!listing) return;
    setEditTitle(listing.title || '');
    setEditDescription(listing.description || '');
    setEditLocation(listing.location || '');
    setEditMaxParticipants(listing.max_participants ? String(listing.max_participants) : '');
    const d = listing.date ? new Date(listing.date) : new Date();
    setEditDate(d);
    setTempDate(d);
    setEditTime(d);
    setTempTime(d);
    setEditTaggedUsers(listing.tagged_users || []);
    setUserSearchQuery('');
    setUserSearchResults([]);
    setShowUserSearch(false);
    setEditVisible(true);
  };

  const searchUsers = async (query: string) => {
    setUserSearchQuery(query);
    if (query.length < 2) { setUserSearchResults([]); return; }
    try {
      setUserSearchLoading(true);
      const results = await profileAPI.searchUsers(query);
      setUserSearchResults(results.filter(u => u.id !== user?.id));
    } catch {
      // ignore search errors
    } finally {
      setUserSearchLoading(false);
    }
  };

  const toggleTagUser = (u: { id: string; username: string; display_name: string; profile_photo_url?: string }) => {
    setEditTaggedUsers(prev =>
      prev.some(p => p.id === u.id) ? prev.filter(p => p.id !== u.id) : [...prev, u]
    );
  };

  const handleEditSave = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    try {
      setIsSaving(true);
      const combined = new Date(editDate);
      combined.setHours(editTime.getHours(), editTime.getMinutes(), 0, 0);
      const hours = editTime.getHours().toString().padStart(2, '0');
      const minutes = editTime.getMinutes().toString().padStart(2, '0');
      await listingAPI.update(activityId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        location: editLocation.trim() || undefined,
        max_participants: editMaxParticipants ? parseInt(editMaxParticipants) : undefined,
        date: combined.toISOString(),
        time: `${hours}:${minutes}`,
        tagged_users: editTaggedUsers.map(u => u.id),
      } as any);
      setEditVisible(false);
      await fetchActivity();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'Could not save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteActivity = () => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity? This cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await listingAPI.delete(activityId);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error?.message || 'Could not delete activity');
            }
          },
        },
      ]
    );
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
          <ActivityIndicator size="large" color="#B8860B" />
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
        {isOwnActivity ? (
          <TouchableOpacity onPress={openEdit} style={styles.editButton}>
            <Ionicons name="pencil-outline" size={22} color="#B8860B" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
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
                          {request.status === 'accepted' ? 'Accepted' : 'Declined'}
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
                <Ionicons name="calendar" size={20} color="#B8860B" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(listing.date)}</Text>
                </View>
              </View>

              {listing.time && (
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={20} color="#B8860B" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>{formatTime(listing.time)}</Text>
                  </View>
                </View>
              )}

              <View style={styles.detailRow}>
                <Ionicons name="location" size={20} color="#B8860B" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{listing.location}</Text>
                </View>
              </View>

              {listing.max_participants && (
                <View style={styles.detailRow}>
                  <Ionicons name="people" size={20} color="#B8860B" />
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

          {/* Tagged Users Section - Who's joining */}
          {listing.tagged_users && listing.tagged_users.length > 0 && (
            <View style={styles.participantsSection}>
              <Text style={styles.sectionTitle}>Who's joining ({listing.tagged_users.length})</Text>
              <View style={styles.participantsList}>
                {listing.tagged_users.map((participant) => (
                  <TouchableOpacity
                    key={participant.id}
                    style={styles.participantCard}
                    onPress={() => navigation.navigate('UserProfile', { userId: participant.id })}
                  >
                    {participant.profile_photo_url ? (
                      <Image
                        source={{ uri: participant.profile_photo_url }}
                        style={styles.participantPhoto}
                      />
                    ) : (
                      <View style={[styles.participantPhoto, styles.participantPhotoPlaceholder]}>
                        <Ionicons name="person" size={20} color="#999" />
                      </View>
                    )}
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{participant.display_name}</Text>
                      <Text style={styles.participantUsername}>@{participant.username}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {/* Delete Activity - Only for owner */}
          {isOwnActivity && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteActivity}>
              <Ionicons name="trash-outline" size={18} color="#888" />
              <Text style={styles.deleteButtonText}>Delete Activity</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Edit Activity Modal */}
      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Activity</Text>
              <TouchableOpacity onPress={handleEditSave} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#B8860B" />
                ) : (
                  <Text style={styles.modalSave}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.fieldInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Activity title"
              />
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMultiline]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="What's this activity about?"
                multiline
                numberOfLines={4}
              />
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.fieldInput}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="Where is it happening?"
              />

              <Text style={styles.fieldLabel}>Date & Time</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => { setTempDate(editDate); setShowDatePicker(true); }}
                >
                  <Ionicons name="calendar-outline" size={18} color="#B8860B" />
                  <Text style={styles.dateTimeButtonText}>
                    {editDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => { setTempTime(editTime); setShowTimePicker(true); }}
                >
                  <Ionicons name="time-outline" size={18} color="#B8860B" />
                  <Text style={styles.dateTimeButtonText}>
                    {editTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Android pickers */}
              {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                  value={editDate}
                  mode="date"
                  display="default"
                  onChange={(e, d) => { setShowDatePicker(false); if (e.type !== 'dismissed' && d) setEditDate(d); }}
                  minimumDate={new Date()}
                />
              )}
              {Platform.OS === 'android' && showTimePicker && (
                <DateTimePicker
                  value={editTime}
                  mode="time"
                  display="default"
                  onChange={(e, t) => { setShowTimePicker(false); if (e.type !== 'dismissed' && t) setEditTime(t); }}
                />
              )}

              <Text style={styles.fieldLabel}>Max Participants</Text>
              <TextInput
                style={styles.fieldInput}
                value={editMaxParticipants}
                onChangeText={setEditMaxParticipants}
                placeholder="Leave blank for no limit"
                keyboardType="number-pad"
              />

              <Text style={styles.fieldLabel}>Who's Joining</Text>
              {editTaggedUsers.length > 0 && (
                <View style={styles.taggedUsersContainer}>
                  {editTaggedUsers.map((u) => (
                    <TouchableOpacity key={u.id} style={styles.taggedUserChip} onPress={() => toggleTagUser(u)}>
                      {u.profile_photo_url ? (
                        <Image source={{ uri: u.profile_photo_url }} style={styles.taggedUserAvatar} />
                      ) : (
                        <View style={styles.taggedUserAvatarPlaceholder}>
                          <Ionicons name="person" size={12} color="#999" />
                        </View>
                      )}
                      <Text style={styles.taggedUserName}>{u.display_name}</Text>
                      <Ionicons name="close-circle" size={16} color="#B8860B" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.userSearchBox}>
                <Ionicons name="search-outline" size={16} color="#999" />
                <TextInput
                  style={styles.userSearchInput}
                  placeholder="Search people to tag..."
                  placeholderTextColor="#aaa"
                  value={userSearchQuery}
                  onChangeText={searchUsers}
                  onFocus={() => setShowUserSearch(true)}
                />
                {userSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setUserSearchQuery(''); setUserSearchResults([]); }}>
                    <Ionicons name="close-circle" size={16} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
              {showUserSearch && userSearchResults.length > 0 && (
                <View style={styles.userSearchResults}>
                  {userSearchResults.map((u) => {
                    const isSelected = editTaggedUsers.some(t => t.id === u.id);
                    return (
                      <TouchableOpacity key={u.id} style={styles.userSearchRow} onPress={() => toggleTagUser(u)}>
                        {u.profile_photo_url ? (
                          <Image source={{ uri: u.profile_photo_url }} style={styles.userSearchAvatar} />
                        ) : (
                          <View style={[styles.userSearchAvatar, { backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' }]}>
                            <Ionicons name="person" size={14} color="#999" />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.userSearchName}>{u.display_name}</Text>
                          <Text style={styles.userSearchUsername}>@{u.username}</Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={20} color="#B8860B" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {showUserSearch && userSearchLoading && (
                <ActivityIndicator size="small" color="#B8860B" style={{ marginTop: 8 }} />
              )}
              <View style={{ height: 300 }} />
            </ScrollView>

            {/* iOS date picker overlay */}
            {Platform.OS === 'ios' && showDatePicker && (
              <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
                <View style={styles.pickerSheet} onStartShouldSetResponder={() => true}>
                  <DateTimePicker
                    value={editDate}
                    mode="date"
                    display="inline"
                    onChange={(_, d) => { if (d) { setEditDate(d); setTempDate(d); } }}
                    minimumDate={new Date()}
                    accentColor="#B8860B"
                  />
                  <View style={styles.pickerFooter}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* iOS time picker overlay */}
            {Platform.OS === 'ios' && showTimePicker && (
              <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={() => { setEditTime(tempTime); setShowTimePicker(false); }}>
                <View style={styles.pickerSheet} onStartShouldSetResponder={() => true}>
                  <DateTimePicker
                    value={tempTime}
                    mode="time"
                    display="spinner"
                    onChange={(_, t) => { if (t) setTempTime(t); }}
                  />
                  <View style={styles.pickerFooter}>
                    <TouchableOpacity onPress={() => { setEditTime(tempTime); setShowTimePicker(false); }}>
                      <Text style={styles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B8860B',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 16,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  fieldInputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
  },
  dateTimeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flexShrink: 1,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 8,
    paddingBottom: 40,
  },
  pickerFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  pickerDone: {
    fontSize: 17,
    fontWeight: '600',
    color: '#B8860B',
  },
  userSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    marginTop: 8,
  },
  userSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  userSearchResults: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  userSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userSearchAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userSearchName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  userSearchUsername: {
    fontSize: 12,
    color: '#888',
  },
  taggedUsersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  taggedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0ff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  taggedUserAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  taggedUserAvatarPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taggedUserName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#B8860B',
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
    height: SCREEN_HEIGHT * 0.45,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    marginBottom: 24,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#888',
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
  participantsSection: {
    marginBottom: 24,
  },
  participantsList: {
    gap: 12,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  participantPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  participantPhotoPlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  participantUsername: {
    fontSize: 14,
    color: '#6b7280',
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
    backgroundColor: '#B8860B',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#B8860B',
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
