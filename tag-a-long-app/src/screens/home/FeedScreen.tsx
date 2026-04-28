// Feed Screen - Home feed with activity listings
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeStackParamList, ActivityListing } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { listingAPI } from '../../api/endpoints';
import ListingCard from '../../components/ListingCard';
import { useAuthStore } from '../../store/authStore';

type FeedScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Feed'>;

interface Props {
  navigation: FeedScreenNavigationProp;
}

const RADIUS_OPTIONS = [10, 25, 50, 100];
const RADIUS_KEY = 'feed_radius_miles';

export default function FeedScreen({ navigation }: Props) {
  const [listings, setListings] = useState<ActivityListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(50);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const { user } = useAuthStore();
  const locationInitialized = useRef(false);

  const requestLocation = async () => {
    // Show explanation before triggering the system dialog
    const { status: existing } = await Location.getForegroundPermissionsAsync();
    if (existing === 'granted') {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      return;
    }

    Alert.alert(
      'Allow Location Access',
      'Tag-A-Long uses your location to show you activities happening nearby. Without it, we\'ll show activities in your home city.',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
              setUserCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            }
          },
        },
      ]
    );
  };

  const loadSavedRadius = async () => {
    const saved = await AsyncStorage.getItem(RADIUS_KEY);
    if (saved) setRadius(parseInt(saved));
  };

  const saveRadius = async (value: number) => {
    setRadius(value);
    await AsyncStorage.setItem(RADIUS_KEY, String(value));
  };

  useEffect(() => {
    if (!locationInitialized.current) {
      locationInitialized.current = true;
      loadSavedRadius();
      requestLocation();
    }
  }, []);

  const fetchListings = useCallback(async () => {
    try {
      setError(null);
      const options = userCoords
        ? { lat: userCoords.lat, lng: userCoords.lng, radius }
        : { city: user?.city };
      const data = await listingAPI.getFeed(20, 0, options);
      setListings(data);
    } catch (err: any) {
      console.error('Fetch listings error:', err);
      setError(err.response?.data?.error?.message || 'Could not load activities');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userCoords, radius, user?.city]);

  useEffect(() => {
    if (!isLoading) fetchListings();
  }, [radius, userCoords]);

  useEffect(() => {
    fetchListings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [fetchListings])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchListings();
  }, [fetchListings]);

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tag-A-Long</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('CreateActivity')}>
          <Ionicons name="add-circle-sharp" size={28} color="#B8860B" />
        </TouchableOpacity>
      </View>
      <View style={styles.radiusBar}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.radiusLabel}>Within</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusOptions}>
          {RADIUS_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.radiusChip, radius === option && styles.radiusChipActive]}
              onPress={() => saveRadius(option)}
            >
              <Text style={[styles.radiusChipText, radius === option && styles.radiusChipTextActive]}>
                {option} mi
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {!userCoords && (
          <TouchableOpacity onPress={requestLocation}>
            <Ionicons name="navigate-circle-outline" size={22} color="#B8860B" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Activities Nearby</Text>
      <Text style={styles.emptySubtitle}>
        {userCoords
          ? `Nothing within ${radius} miles. Try increasing the radius.`
          : 'Be the first to create an activity!'}
      </Text>
      <TouchableOpacity
        style={styles.createFirstButton}
        onPress={() => navigation.navigate('CreateActivity')}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.createFirstButtonText}>Create Activity</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
      <Text style={styles.errorTitle}>Oops!</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchListings}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <>
          {renderHeader()}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B8860B" />
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        </>
      ) : error ? (
        <>
          {renderHeader()}
          {renderError()}
        </>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#B8860B']}
              tintColor="#B8860B"
            />
          }
          showsVerticalScrollIndicator={false}
          decelerationRate="normal"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#B8860B',
  },
  createButton: {
    padding: 5,
  },
  radiusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  radiusLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9fafb',
  },
  radiusChipActive: {
    backgroundColor: '#B8860B',
    borderColor: '#B8860B',
  },
  radiusChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  radiusChipTextActive: {
    color: '#fff',
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
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B8860B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#B8860B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
