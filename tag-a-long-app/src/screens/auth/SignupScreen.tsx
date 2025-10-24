// Signup Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';

type SignupScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Signup'
>;

interface Props {
  navigation: SignupScreenNavigationProp;
}

export default function SignupScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const { signup, isLoading } = useAuthStore();

  const handleSignup = async () => {
    // Validation
    if (!email || !password || !displayName || !username || !city || !dateOfBirth) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    // Validate password complexity (uppercase, lowercase, number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      Alert.alert('Error', 'Password must contain uppercase, lowercase, and number');
      return;
    }

    if (displayName.length < 2) {
      Alert.alert('Error', 'Display name must be at least 2 characters');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      Alert.alert('Error', 'Date of birth must be in YYYY-MM-DD format');
      return;
    }

    try {
      console.log('Attempting signup with:', { email, displayName, username, city, dateOfBirth });
      await signup({
        email,
        password,
        display_name: displayName,
        username,
        city,
        date_of_birth: dateOfBirth
      });
      console.log('Signup successful!');
      console.log('DEBUG: About to navigate to ProfileSetup');
      // Navigate to profile setup to add photos and bio
      navigation.navigate('ProfileSetup');
      console.log('DEBUG: navigation.navigate(ProfileSetup) called');
    } catch (error: any) {
      console.error('Signup error:', error);
      console.error('Signup error response:', error.response?.data);
      const errorMsg = error.response?.data?.error?.message ||
                       error.message ||
                       'Could not create account';
      Alert.alert('Signup Failed', errorMsg);
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
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Tag-A-Long today</Text>
          </View>

          {/* Signup Form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Display Name *"
              value={displayName}
              onChangeText={setDisplayName}
              editable={!isLoading}
            />
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementText}>• At least 2 characters</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Username *"
              value={username}
              onChangeText={(text) => setUsername(text.toLowerCase())}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementText}>• At least 3 characters</Text>
              <Text style={styles.requirementText}>• Lowercase letters only</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="City *"
              value={city}
              onChangeText={setCity}
              editable={!isLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Date of Birth (YYYY-MM-DD) *"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              editable={!isLoading}
              keyboardType="numbers-and-punctuation"
            />
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementText}>• Format: YYYY-MM-DD (e.g., 2000-01-15)</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Password *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementText}>• At least 8 characters</Text>
              <Text style={styles.requirementText}>• One uppercase letter</Text>
              <Text style={styles.requirementText}>• One lowercase letter</Text>
              <Text style={styles.requirementText}>• One number</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signupButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={isLoading}
              >
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  requirementsContainer: {
    marginBottom: 15,
    paddingLeft: 10,
  },
  requirementText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  signupButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
});
