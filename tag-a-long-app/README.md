# Tag-A-Long Mobile App

Instagram-style social hangout app built with Expo and React Native.

## Features

- **Authentication Flow**: Login, Signup, and Profile Setup screens
- **Bottom Tab Navigation**: Home Feed, Search, Messages, My Activities, Profile
- **State Management**: Zustand for global auth state
- **API Integration**: Connected to Tag-A-Long backend (Vercel)
- **Persistent Auth**: Auto-login using AsyncStorage

## Tech Stack

- **Framework**: Expo (React Native)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: Zustand
- **HTTP Client**: Axios with interceptors
- **Storage**: AsyncStorage
- **Language**: TypeScript

## Project Structure

```
tag-a-long-app/
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios client with auth interceptors
│   │   └── endpoints.ts           # All backend API calls
│   ├── navigation/
│   │   ├── AppNavigator.tsx       # Root navigation with auth flow
│   │   └── AuthNavigator.tsx      # Login/Signup navigation
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   └── ProfileSetupScreen.tsx
│   │   ├── home/
│   │   │   └── FeedScreen.tsx
│   │   ├── search/
│   │   │   └── SearchScreen.tsx
│   │   ├── messages/
│   │   │   └── MessagesScreen.tsx
│   │   ├── activities/
│   │   │   └── MyActivitiesScreen.tsx
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   ├── store/
│   │   └── authStore.ts           # Zustand auth state
│   └── types/
│       └── index.ts               # TypeScript types
└── App.tsx                        # App entry point
```

## Installation

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

## Running the App

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web
npm run web
```

## Authentication Flow

1. **First Time Users**:
   - See Login screen on app launch
   - Can navigate to Signup screen
   - After signup → Profile Setup screen
   - After profile setup → Auto-redirected to main app

2. **Returning Users**:
   - Auto-login if valid token exists
   - Directly show main app with bottom tabs

## API Integration

Backend URL: `https://tag-a-long-backend.vercel.app/api`

The app communicates with the backend through:
- `src/api/client.ts` - Axios client with automatic JWT token injection
- `src/api/endpoints.ts` - All API methods organized by feature

## Dependencies

```json
{
  "@react-navigation/native": "Navigation framework",
  "@react-navigation/native-stack": "Stack navigator",
  "@react-navigation/bottom-tabs": "Bottom tab navigator",
  "zustand": "State management",
  "axios": "HTTP client",
  "@react-native-async-storage/async-storage": "Persistent storage",
  "expo": "React Native framework",
  "typescript": "Type safety"
}
```

## Next Steps

### Immediate (MVP):
1. Build activity feed with real data from backend
2. Implement activity detail screen
3. Add tag-along request flow (send/accept/decline)
4. Build activity creation form
5. Add search functionality

### Future Features:
- Messaging (Firebase or Supabase Realtime)
- Image upload for profiles and activities
- Stripe subscription integration
- Push notifications
- Safety features (block/report)

## Development Notes

- All screens use consistent styling (indigo primary color #6366f1)
- API client automatically handles token injection and 401 errors
- Navigation state is managed by authentication status
- AsyncStorage persists auth token across app restarts
