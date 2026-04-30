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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { signup, isLoading } = useAuthStore();

  const PRIVACY_URL = 'https://tagalong.app/privacy';
  const TERMS_URL = 'https://tagalong.app/terms';

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

    // Enforce minimum age of 18
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 18) {
      Alert.alert('Age Requirement', 'You must be at least 18 years old to use Tag-A-Long.');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('Agreement Required', 'Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    try {
      await signup({
        email,
        password,
        display_name: displayName,
        username,
        city,
        date_of_birth: dateOfBirth
      });
      // Navigate to profile setup to add photos and bio
      navigation.navigate('ProfileSetup');
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
              placeholder="Name *"
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
              <Text style={styles.requirementText}>• Letters, numbers, spaces, and underscores only</Text>
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
              autoComplete="off"
              textContentType="none"
              autoCorrect={false}
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
              autoComplete="off"
              textContentType="none"
              autoCorrect={false}
            />

            {/* Terms agreement */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={agreedToTerms ? 'checkbox' : 'square-outline'}
                size={22}
                color={agreedToTerms ? '#B8860B' : '#aaa'}
              />
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink} onPress={() => Linking.openURL(TERMS_URL)}>
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text style={styles.termsLink} onPress={() => Linking.openURL(PRIVACY_URL)}>
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signupButton, (isLoading || !agreedToTerms) && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={isLoading || !agreedToTerms}
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
    color: '#B8860B',
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  termsLink: {
    color: '#B8860B',
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#B8860B',
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
    color: '#B8860B',
    fontSize: 14,
    fontWeight: '600',
  },
});
