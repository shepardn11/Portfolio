// Create Listing Screen - Create new activity post
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../../api/client';

type CreateListingScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'CreateActivity'
>;

interface Props {
  navigation: CreateListingScreenNavigationProp;
}

export default function CreateListingScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Categories for activity listings
  const categories = [
    { value: 'sports', label: '⚽ Sports', icon: 'football' },
    { value: 'food', label: '🍽️ Food & Dining', icon: 'restaurant' },
    { value: 'entertainment', label: '🎬 Entertainment', icon: 'film' },
    { value: 'outdoor', label: '🏞️ Outdoor', icon: 'leaf' },
    { value: 'fitness', label: '💪 Fitness', icon: 'barbell' },
    { value: 'social', label: '👥 Social', icon: 'people' },
    { value: 'other', label: '✨ Other', icon: 'apps' },
  ];

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleCreateListing = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your activity');
      return;
    }

    if (title.length < 3) {
      Alert.alert('Error', 'Title must be at least 3 characters');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    try {
      setIsLoading(true);

      // Format date and time for API
      // Combine date and time into a single Date object for the 'date' field
      const combinedDateTime = new Date(date);
      combinedDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

      // Format time properly as HH:mm
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      const activityTime = `${hours}:${minutes}`; // HH:mm

      const listingData: any = {
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        date: combinedDateTime.toISOString(), // Send as ISO string for Joi date validation
        time: activityTime,
      };

      // Only add max_participants if it's a valid number
      if (maxParticipants && !isNaN(parseInt(maxParticipants))) {
        listingData.max_participants = parseInt(maxParticipants);
      }

      console.log('Creating listing with data:', JSON.stringify(listingData, null, 2));

      const response = await apiClient.getInstance().post('/listings', listingData);

      if (response.data.success) {
        // Navigate back to feed immediately
        navigation.goBack();

        // Show success message after navigating
        setTimeout(() => {
          Alert.alert('Success', 'Your activity has been posted!');
        }, 100);
      }
    } catch (error: any) {
      console.error('Create listing error:', error);
      console.error('Error response:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error status:', error.response?.status);
      const errorMsg = error.response?.data?.error?.message ||
                       error.response?.data?.message ||
                       error.message ||
                       'Could not create activity post';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Activity</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="What are you doing?"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              editable={!isLoading}
            />
            <Text style={styles.charCount}>{title.length}/200</Text>
          </View>

          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    category === cat.value && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat.value)}
                  disabled={isLoading}
                >
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="Where will this take place?"
              value={location}
              onChangeText={setLocation}
              editable={!isLoading}
            />
          </View>

          {/* Date and Time */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Date *</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  style={{
                    backgroundColor: '#f5f5f5',
                    borderRadius: 10,
                    padding: 15,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                    borderStyle: 'solid',
                    width: '100%',
                  }}
                  value={date.toISOString().split('T')[0]}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    if (e.target.value) {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        setDate(newDate);
                      }
                    }
                  }}
                  disabled={isLoading}
                />
              ) : (
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                  disabled={isLoading}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Time *</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="time"
                  style={{
                    backgroundColor: '#f5f5f5',
                    borderRadius: 10,
                    padding: 15,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                    borderStyle: 'solid',
                    width: '100%',
                  }}
                  value={time.toTimeString().slice(0, 5)}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [hours, minutes] = e.target.value.split(':');
                      if (hours && minutes) {
                        const newTime = new Date();
                        newTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                        if (!isNaN(newTime.getTime())) {
                          setTime(newTime);
                        }
                      }
                    }
                  }}
                  disabled={isLoading}
                />
              ) : (
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                  disabled={isLoading}
                >
                  <Ionicons name="time-outline" size={20} color="#666" />
                  <Text style={styles.dateTimeText}>{formatTime(time)}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Date Picker - Mobile Only */}
          {Platform.OS !== 'web' && showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Time Picker - Mobile Only */}
          {Platform.OS !== 'web' && showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <Text style={styles.sublabel}>
              Tell people what you're doing and who you're looking for
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="E.g., Looking for someone to join me for a game of tennis. Intermediate level preferred."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
              editable={!isLoading}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {/* Max Participants (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Max Participants (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="How many people can join?"
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              keyboardType="number-pad"
              editable={!isLoading}
            />
          </View>

          {/* Tagged Users (Future feature - placeholder) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tag Friends (Optional)</Text>
            <TouchableOpacity
              style={styles.tagButton}
              disabled={true}
            >
              <Ionicons name="person-add-outline" size={20} color="#999" />
              <Text style={styles.tagButtonText}>Tag people joining you</Text>
            </TouchableOpacity>
            <Text style={styles.comingSoon}>Coming soon!</Text>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.buttonDisabled]}
            onPress={handleCreateListing}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.createButtonText}>Post Activity</Text>
              </>
            )}
          </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
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
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    paddingTop: 15,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10,
    marginBottom: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryLabel: {
    fontSize: 14,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  dateTimeButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  tagButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagButtonText: {
    fontSize: 16,
    color: '#999',
    marginLeft: 10,
  },
  comingSoon: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
  },
  createButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
