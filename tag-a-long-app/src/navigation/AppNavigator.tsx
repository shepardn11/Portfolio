// App Navigator - Main navigation structure with bottom tabs
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import { ActivityIndicator, View } from 'react-native';

// Navigators
import AuthNavigator from './AuthNavigator';

// Import main screens (we'll create these)
import FeedScreen from '../screens/home/FeedScreen';
import CreateListingScreen from '../screens/home/CreateListingScreen';
import ActivityDetailScreen from '../screens/home/ActivityDetailScreen';
import SearchScreen from '../screens/search/SearchScreen';
import UserProfileScreen from '../screens/user/UserProfileScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';
import ChatScreen from '../screens/messages/ChatScreen';
import MyActivitiesScreen from '../screens/activities/MyActivitiesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { HomeStackParamList, SearchStackParamList, ActivitiesStackParamList, MessagesStackParamList } from '../types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const MessagesStack = createNativeStackNavigator<MessagesStackParamList>();
const ActivitiesStack = createNativeStackNavigator<ActivitiesStackParamList>();

// Home Stack Navigator
function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Feed" component={FeedScreen} />
      <HomeStack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
      <HomeStack.Screen name="CreateActivity" component={CreateListingScreen} />
      <HomeStack.Screen name="UserProfile" component={UserProfileScreen} />
    </HomeStack.Navigator>
  );
}

// Search Stack Navigator
function SearchNavigator() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="SearchMain" component={SearchScreen} />
      <SearchStack.Screen name="UserProfile" component={UserProfileScreen} />
    </SearchStack.Navigator>
  );
}

// Messages Stack Navigator
function MessagesNavigator() {
  return (
    <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
      <MessagesStack.Screen name="MessagesList" component={MessagesScreen} />
      <MessagesStack.Screen name="Chat" component={ChatScreen} />
    </MessagesStack.Navigator>
  );
}

// Activities Stack Navigator
function ActivitiesNavigator() {
  return (
    <ActivitiesStack.Navigator screenOptions={{ headerShown: false }}>
      <ActivitiesStack.Screen name="MyActivitiesMain" component={MyActivitiesScreen} />
      <ActivitiesStack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
      <ActivitiesStack.Screen name="CreateActivity" component={CreateListingScreen} />
      <ActivitiesStack.Screen name="UserProfile" component={UserProfileScreen} />
    </ActivitiesStack.Navigator>
  );
}

// Bottom Tab Navigator
function MainTabs() {
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    try {
      const { messageAPI } = await import('../api/endpoints');
      const conversations = await messageAPI.getConversations();
      const totalUnread = conversations.reduce(
        (sum: number, conv: any) => sum + conv.unread_count,
        0
      );
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch unread count on mount and periodically
  React.useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'MyActivities') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
      screenListeners={{
        state: () => {
          // Refresh unread count when navigating between tabs
          fetchUnreadCount();
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchNavigator}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesNavigator}
        options={{
          tabBarLabel: 'Messages',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ff3b30',
            color: '#fff',
            fontSize: 11,
            fontWeight: '600',
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            marginTop: 2,
          },
        }}
      />
      <Tab.Screen
        name="MyActivities"
        component={ActivitiesNavigator}
        options={{ tabBarLabel: 'Activities' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  console.log('DEBUG: AppNavigator rendering - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
