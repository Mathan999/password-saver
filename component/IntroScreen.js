import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StatusBar,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { create } from 'twrnc';

// Initialize twrnc
const tw = create();

const IntroScreen = ({ navigation }) => {
  // Use window dimensions hook for responsive layout
  const { width, height } = useWindowDimensions();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const finishAnim = useRef(new Animated.Value(1)).current;
  
  // Phone animation values
  const phoneScale = useRef(new Animated.Value(0.5)).current;
  const phoneTranslateY = useRef(new Animated.Value(50)).current;
  
  // Key animation values
  const keyScale = useRef(new Animated.Value(0)).current;
  const keyRotate = useRef(new Animated.Value(0)).current;
  const keyTranslateX = useRef(new Animated.Value(-100)).current;
  
  // Lock animation values
  const lockScale = useRef(new Animated.Value(0)).current;
  const lockTranslateY = useRef(new Animated.Value(20)).current;
  
  // Text animations
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  
  // Calculate responsive dimensions
  const phoneHeight = Math.min(width, height) * 0.4;
  const phoneWidth = phoneHeight * 0.5;
  const keySize = Math.min(width, height) * 0.1;
  const lockSize = Math.min(width, height) * 0.08;
  const fontSize = Math.min(width, height) * 0.035;
  
  useEffect(() => {
    // Initial fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Phone and key animation sequence
    Animated.sequence([
      // Phone appears first
      Animated.parallel([
        Animated.timing(phoneScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(phoneTranslateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      
      // Lock appears
      Animated.timing(lockScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      
      // Key appears and moves to lock
      Animated.parallel([
        Animated.timing(keyScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(keyTranslateX, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      
      // Key rotates to unlock
      Animated.timing(keyRotate, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      
      // Lock slides down
      Animated.timing(lockTranslateY, {
        toValue: 60,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      
      // Text appears
      Animated.parallel([
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleAnim, {
          toValue: 1,
          duration: 600,
          delay: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // After animation completes, fade out and transition to auth screen
    const timeoutId = setTimeout(() => {
      Animated.timing(finishAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        // Navigate to login screen after animation completes
        navigation.replace('Login');
      });
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [navigation]);

  // Map animation values to actual rotation transform
  const keyRotateInterpolate = keyRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });
  
  // Text animations
  const titleTranslateY = titleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });
  
  const subtitleTranslateY = subtitleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  return (
    <SafeAreaView style={tw`flex-1 bg-black`}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Animated.View 
        style={[
          tw`flex-1 items-center justify-center`, 
          { opacity: fadeAnim * finishAnim }
        ]}
      >
        {/* Phone with Lock and Key Animation */}
        <View style={tw`flex-1 items-center justify-center`}>
          {/* Phone */}
          <Animated.View
            style={[
              tw`absolute items-center justify-center rounded-3xl border-8 border-blue-600 bg-blue-900`,
              {
                width: phoneWidth,
                height: phoneHeight,
                transform: [
                  { scale: phoneScale },
                  { translateY: phoneTranslateY },
                ],
              },
            ]}
          >
            {/* Phone screen */}
            <View style={tw`absolute inset-0 m-2 bg-blue-800 rounded-2xl`} />
            
            {/* Lock */}
            <Animated.View
              style={[
                tw`absolute items-center justify-center`,
                {
                  width: lockSize,
                  height: lockSize,
                  transform: [
                    { scale: lockScale },
                    { translateY: lockTranslateY },
                  ],
                },
              ]}
            >
              {/* Lock body */}
              <View style={[tw`bg-gray-300 rounded-sm`, { width: lockSize * 0.8, height: lockSize * 0.6 }]} />
              
              {/* Lock shackle */}
              <View 
                style={[
                  tw`absolute bg-gray-300 rounded-t-lg`,
                  { 
                    width: lockSize * 0.5, 
                    height: lockSize * 0.5,
                    borderBottomWidth: 0,
                    top: -lockSize * 0.3,
                  }
                ]}
              />
            </Animated.View>
            
            {/* Key */}
            <Animated.View
              style={[
                tw`absolute items-center justify-center`,
                {
                  width: keySize,
                  height: keySize,
                  transform: [
                    { scale: keyScale },
                    { translateX: keyTranslateX },
                    { rotate: keyRotateInterpolate },
                  ],
                },
              ]}
            >
              {/* Key handle */}
              <View style={[tw`bg-yellow-500 rounded-full`, { width: keySize * 0.5, height: keySize * 0.5 }]} />
              
              {/* Key blade */}
              <View 
                style={[
                  tw`absolute bg-yellow-600`,
                  { 
                    width: keySize * 0.8, 
                    height: keySize * 0.2,
                    right: -keySize * 0.4,
                  }
                ]}
              />
              
              {/* Key teeth */}
              <View 
                style={[
                  tw`absolute bg-yellow-600`,
                  { 
                    width: keySize * 0.2, 
                    height: keySize * 0.1,
                    right: -keySize * 0.6,
                    top: keySize * 0.05,
                  }
                ]}
              />
              <View 
                style={[
                  tw`absolute bg-yellow-600`,
                  { 
                    width: keySize * 0.15, 
                    height: keySize * 0.1,
                    right: -keySize * 0.3,
                    top: keySize * 0.05,
                  }
                ]}
              />
            </Animated.View>
          </Animated.View>
        </View>
        
        {/* Text content */}
        <View style={tw`absolute bottom-0 left-0 right-0 mb-20 items-center`}>
          <Animated.Text 
            style={[
              tw`text-white font-bold`, 
              { 
                fontSize: fontSize * 2,
                opacity: titleAnim,
                transform: [{ translateY: titleTranslateY }]
              }
            ]}
          >
            Password Saver
          </Animated.Text>
          
          <Animated.Text 
            style={[
              tw`text-blue-300 mt-2`, 
              { 
                fontSize: fontSize,
                opacity: subtitleAnim,
                transform: [{ translateY: subtitleTranslateY }]
              }
            ]}
          >
            Keep your credentials safe and secure
          </Animated.Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default IntroScreen;