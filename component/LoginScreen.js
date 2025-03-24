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
  StyleSheet,
} from 'react-native';
import { create } from 'twrnc';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { useIsFocused } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';

// Initialize twrnc
const tw = create();

// Create static styles to ensure consistent background color
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // bg-gray-900 equivalent
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827', // bg-gray-900 equivalent
  },
  authCard: {
    backgroundColor: '#1e40af', // bg-blue-800 equivalent
    borderRadius: 16, // rounded-2xl equivalent
    padding: 24, // p-6 equivalent
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  inputField: {
    backgroundColor: '#1d4ed8', // bg-blue-700 equivalent
    borderRadius: 8, // rounded-lg equivalent
    padding: 12, // p-3 equivalent
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#3b82f6', // bg-blue-500 equivalent
    paddingVertical: 16, // py-4 equivalent
    borderRadius: 8, // rounded-lg equivalent
    alignItems: 'center',
    marginTop: 16, // mt-4 equivalent
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111827', // bg-gray-900 equivalent
  }
});

// This function configures the navigation stack to have proper backgrounds
const configureNavigation = (navigation) => {
  // Apply background color to all screens in the stack
  navigation.dispatch(
    CommonActions.setParams({
      cardStyle: { backgroundColor: '#111827' },
    })
  );
  
  // Disable default animations
  navigation.setOptions({
    cardStyle: { backgroundColor: '#111827' },
    animationEnabled: false,
  });
};

const LoginScreen = ({ navigation }) => {
  // Use window dimensions hook for responsive layout
  const { width, height } = useWindowDimensions();
  const isFocused = useIsFocused();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Validation state
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  
  // Configure navigation on mount
  useEffect(() => {
    configureNavigation(navigation);
    
    // Set status bar to match background
    StatusBar.setBackgroundColor('#111827');
    StatusBar.setBarStyle('light-content');
  }, [navigation]);
  
  // Check auth state on component mount
  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to Main screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        // No user is signed in, show login screen
        setIsCheckingAuth(false);
        
        // Start animations
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
      }
    });
    
    // Clean up subscription on unmount
    return () => unsubscribeAuth();
  }, [navigation, fadeAnim, cardAnim, footerAnim]);
  
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
  
  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    return '';
  };
  
  // Handle input changes with validation
  const handleEmailChange = (value) => {
    setEmail(value);
    setErrors(prev => ({...prev, email: validateEmail(value)}));
  };
  
  const handlePasswordChange = (value) => {
    setPassword(value);
    setErrors(prev => ({...prev, password: validatePassword(value)}));
  };
  
  const handleSubmit = async () => {
    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    // Update error state
    setErrors({
      email: emailError,
      password: passwordError
    });
    
    // Check if there are any errors
    if (emailError || passwordError) {
      // Show the first error
      const firstError = emailError || passwordError;
      Alert.alert('Validation Error', firstError);
      return;
    }
    
    try {
      setIsLoading(true);
      // Use Firebase Authentication to sign in
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation will happen automatically via onAuthStateChanged listener
    } catch (error) {
      // Handle authentication errors
      let errorMessage = 'You are not yet registered. Please create an account first.';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Login Failed', errorMessage);
      setIsLoading(false);
    }
  };
  
  const handleSwitchToRegister = () => {
    navigation.navigate('Register');
  };
  
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };
  
  // Common input style function to combine styling based on error state
  const getInputStyle = (hasError) => [
    styles.inputField,
    { borderWidth: 1, borderColor: hasError ? '#ef4444' : '#3b82f6' }, // red-500 or blue-500
  ];
  
  // Always render with the same background color
  return (
    <View style={styles.container}>
      {/* Background fill that stays in place during transitions */}
      <View style={styles.absoluteFill} />
      
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      
      {isCheckingAuth ? (
        // Loading screen with same background
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={tw`text-white mt-4`}>Loading...</Text>
        </View>
      ) : (
        // Main login form
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
          >
            <View style={styles.container}>
              <Animated.View 
                style={[
                  tw`flex-1 justify-center p-6`, 
                  { opacity: fadeAnim }
                ]}
              >
                {/* Header */}
                <View style={tw`items-center mb-8`}>
                  <Text style={tw`text-white font-bold text-3xl`}>Password Saver</Text>
                  <Text style={tw`text-blue-300 mt-2`}>Welcome back</Text>
                </View>
                
                {/* Auth Card */}
                <Animated.View
                  style={[
                    styles.authCard,
                    {
                      transform: [
                        { translateY: cardTranslateY },
                        { scale: cardScale },
                      ],
                    },
                  ]}
                >
                  <Text style={tw`text-white font-bold text-xl mb-6`}>Sign In</Text>
                  
                  {/* Email Field */}
                  <View style={tw`mb-4`}>
                    <Text style={tw`text-blue-200 mb-1`}>Email</Text>
                    <TextInput
                      style={getInputStyle(!!errors.email)}
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
                  
                  {/* Password Field */}
                  <View style={tw`mb-4`}>
                    <Text style={tw`text-blue-200 mb-1`}>Password</Text>
                    <TextInput
                      style={getInputStyle(!!errors.password)}
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
                  
                  {/* Forgot Password */}
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={tw`text-blue-300 text-right mb-2`}>Forgot Password?</Text>
                  </TouchableOpacity>
                  
                  {/* Submit Button */}
                  <TouchableOpacity 
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={tw`text-white font-bold text-lg`}>Sign In</Text>
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
                    <Text style={tw`text-gray-400`}>Don't have an account?</Text>
                    <TouchableOpacity onPress={handleSwitchToRegister}>
                      <Text style={tw`text-blue-400 font-bold ml-1`}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </View>
  );
};

export default LoginScreen;