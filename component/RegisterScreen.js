import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { create } from 'twrnc';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

// Initialize twrnc
const tw = create();

const RegisterScreen = ({ navigation }) => {
  // Use window dimensions hook for responsive layout
  const { width, height } = useWindowDimensions();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;
  
  // Form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  // Calculate responsive dimensions
  const fontSize = Math.min(width, height) * 0.035;
  
  useEffect(() => {
    // Animate entrance
    Animated.stagger(200, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Card animation transforms
  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });
  
  const cardScale = cardAnim.interpolate({
    inputRange: [0, 0.95, 1],
    outputRange: [0.95, 0.95, 1],
  });
  
  // Footer animation transforms
  const footerTranslateY = footerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  
  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email is required';
    } else if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };
  
  const validateUsername = (username) => {
    if (!username) {
      return 'Username is required';
    } else if (username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    return '';
  };
  
  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    } else if (password.length < 6) {
      return 'Password must be at least 6 characters';
    } else if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };
  
  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    } else if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return '';
  };
  
  // Handle input changes with validation
  const handleEmailChange = (value) => {
    setEmail(value);
    setErrors(prev => ({...prev, email: validateEmail(value)}));
  };
  
  const handleUsernameChange = (value) => {
    setUsername(value);
    setErrors(prev => ({...prev, username: validateUsername(value)}));
  };
  
  const handlePasswordChange = (value) => {
    setPassword(value);
    setErrors(prev => ({...prev, password: validatePassword(value)}));
    // Also validate confirm password if it's already entered
    if (confirmPassword) {
      setErrors(prev => ({...prev, confirmPassword: value !== confirmPassword ? 'Passwords do not match' : ''}));
    }
  };
  
  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    setErrors(prev => ({...prev, confirmPassword: validateConfirmPassword(value)}));
  };
  
  const handleSubmit = async () => {
    // Validate all fields
    const emailError = validateEmail(email);
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    
    // Update error state
    setErrors({
      email: emailError,
      username: usernameError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    });
    
    // Check if there are any errors
    if (emailError || usernameError || passwordError || confirmPasswordError) {
      // Show the first error
      const firstError = emailError || usernameError || passwordError || confirmPasswordError;
      Alert.alert('Validation Error', firstError);
      return;
    }
    
    try {
      setIsLoading(true);
      // Use Firebase Authentication to create user
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Add display name (username) to user profile
      await updateProfile(userCredential.user, {
        displayName: username
      });
      
      // Registration successful
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully! Please sign in.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      // Handle registration errors
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email or sign in.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSwitchToLogin = () => {
    // Navigate to Login screen
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-900`}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        <Animated.View 
          style={[
            tw`flex-1 justify-center p-6`, 
            { opacity: fadeAnim }
          ]}
        >
          {/* Header */}
          <View style={tw`items-center mb-8`}>
            <Text style={tw`text-white font-bold text-3xl`}>Password Saver</Text>
            <Text style={tw`text-blue-300 mt-2`}>Create an account</Text>
          </View>
          
          {/* Auth Card */}
          <Animated.View
            style={[
              tw`bg-blue-800 rounded-2xl p-6 shadow-lg`,
              {
                transform: [
                  { translateY: cardTranslateY },
                  { scale: cardScale },
                ],
              },
            ]}
          >
            <Text style={tw`text-white font-bold text-xl mb-6`}>Register</Text>
            
            {/* Email Field */}
            <View style={tw`mb-4`}>
              <Text style={tw`text-blue-200 mb-1`}>Email</Text>
              <TextInput
                style={tw`bg-blue-700 border ${errors.email ? 'border-red-500' : 'border-blue-500'} rounded-lg p-3 text-white`}
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
                placeholderTextColor="#8BAAF0"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {errors.email ? (
                <Text style={tw`text-red-400 text-xs mt-1`}>{errors.email}</Text>
              ) : null}
            </View>
            
            {/* Username Field */}
            <View style={tw`mb-4`}>
              <Text style={tw`text-blue-200 mb-1`}>Username</Text>
              <TextInput
                style={tw`bg-blue-700 border ${errors.username ? 'border-red-500' : 'border-blue-500'} rounded-lg p-3 text-white`}
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="Choose a username"
                placeholderTextColor="#8BAAF0"
                autoCapitalize="none"
              />
              {errors.username ? (
                <Text style={tw`text-red-400 text-xs mt-1`}>{errors.username}</Text>
              ) : null}
            </View>
            
            {/* Password Field */}
            <View style={tw`mb-4`}>
              <Text style={tw`text-blue-200 mb-1`}>Password</Text>
              <TextInput
                style={tw`bg-blue-700 border ${errors.password ? 'border-red-500' : 'border-blue-500'} rounded-lg p-3 text-white`}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Enter your password"
                placeholderTextColor="#8BAAF0"
                secureTextEntry
              />
              {errors.password ? (
                <Text style={tw`text-red-400 text-xs mt-1`}>{errors.password}</Text>
              ) : null}
            </View>
            
            {/* Confirm Password Field */}
            <View style={tw`mb-4`}>
              <Text style={tw`text-blue-200 mb-1`}>Confirm Password</Text>
              <TextInput
                style={tw`bg-blue-700 border ${errors.confirmPassword ? 'border-red-500' : 'border-blue-500'} rounded-lg p-3 text-white`}
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                placeholder="Confirm your password"
                placeholderTextColor="#8BAAF0"
                secureTextEntry
              />
              {errors.confirmPassword ? (
                <Text style={tw`text-red-400 text-xs mt-1`}>{errors.confirmPassword}</Text>
              ) : null}
            </View>
            
            {/* Submit Button */}
            <TouchableOpacity 
              style={tw`bg-blue-500 py-4 rounded-lg items-center mt-4`}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={tw`text-white font-bold text-lg`}>Create Account</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
          
          {/* Footer */}
          <Animated.View 
            style={[
              tw`mt-6 items-center`,
              {
                opacity: footerAnim,
                transform: [{ translateY: footerTranslateY }],
              },
            ]}
          >
            <View style={tw`flex-row`}>
              <Text style={tw`text-gray-400`}>Already have an account?</Text>
              <TouchableOpacity onPress={handleSwitchToLogin}>
                <Text style={tw`text-blue-400 font-bold ml-1`}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;