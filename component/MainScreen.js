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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import { create } from 'twrnc';
import { auth, database } from './firebase-config'; // Import auth and database directly
import { ref, onValue, push, set, update, remove, get } from 'firebase/database'; // Import database methods
import { signOut } from 'firebase/auth'; // Import auth methods

// Initialize twrnc
const tw = create();

// SVG icons as components for better performance
const EyeIcon = () => (
  <View style={tw`w-5 h-5 items-center justify-center`}>
    <Text style={tw`text-indigo-300`}>👁️</Text>
  </View>
);

const EyeSlashIcon = () => (
  <View style={tw`w-5 h-5 items-center justify-center`}>
    <Text style={tw`text-indigo-300`}>👁️‍🗨️</Text>
  </View>
);

const SearchIcon = () => (
  <View style={tw`w-5 h-5 items-center justify-center mr-2`}>
    <Text style={tw`text-gray-400`}>🔍</Text>
  </View>
);

const LockIcon = () => (
  <View style={tw`w-6 h-6 items-center justify-center`}>
    <Text style={tw`text-white text-lg`}>🔒</Text>
  </View>
);

const MainScreen = ({ navigation, route }) => {
  // Use window dimensions hook for responsive layout
  const { width, height } = useWindowDimensions();
  
  // Get user ID from navigation params or auth state
  const userId = route.params?.userId || auth.currentUser?.uid;
  
  // State for form inputs
  const [siteName, setSiteName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [savedPasswords, setSavedPasswords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const addButtonAnim = useRef(new Animated.Value(0)).current;
  const searchBarAnim = useRef(new Animated.Value(0)).current;
  const listItemAnim = useRef([]).current;
  const scrollRef = useRef(null);

  // Filtered passwords based on search
  const filteredPasswords = savedPasswords.filter(
    item => item.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check password strength
  const calculatePasswordStrength = (pass) => {
    if (!pass) return 0;
    
    let strength = 0;
    
    // Length check
    if (pass.length >= 8) strength += 1;
    if (pass.length >= 12) strength += 1;
    
    // Character variety checks
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[a-z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    
    return Math.min(strength, 5);
  };

  // Get strength label
  const getStrengthLabel = (strength) => {
    const labels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong', 'Excellent'];
    return labels[strength];
  };

  // Get strength color
  const getStrengthColor = (strength) => {
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 
      'bg-green-500', 'bg-emerald-500', 'bg-teal-500'
    ];
    return colors[strength];
  };

  // Reference to the user's passwords in Firebase
  const passwordsRef = userId ? ref(database, `users/${userId}/passwords`) : null;

  // Load passwords from Firebase
  const loadPasswords = () => {
    if (!passwordsRef) return;
    
    setIsLoading(true);
    get(passwordsRef)
      .then(snapshot => {
        const passwordsData = snapshot.val();
        if (passwordsData) {
          // Convert Firebase object to array
          const passwordsList = Object.keys(passwordsData).map(key => ({
            id: key,
            ...passwordsData[key]
          }));
          setSavedPasswords(passwordsList);
          
          // Initialize animation values for each item
          while (listItemAnim.length < passwordsList.length) {
            listItemAnim.push(new Animated.Value(1));
          }
        } else {
          setSavedPasswords([]);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error loading passwords: ", error);
        Alert.alert("Error", "Failed to load your passwords. Please try again.");
        setIsLoading(false);
      });
  };

  // Add a new password
  const handleAddPassword = () => {
    if (!passwordsRef) {
      Alert.alert("Error", "User not authenticated. Please log in again.");
      navigation.replace('Login');
      return;
    }
    
    if (siteName && username && password) {
      setIsLoading(true);
      
      if (isEditing && editingId) {
        // Update existing password in Firebase
        const passwordRef = ref(database, `users/${userId}/passwords/${editingId}`);
        update(passwordRef, {
          siteName,
          username,
          password,
          updatedAt: new Date().toISOString(),
        })
        .then(() => {
          // Update local state
          const newList = savedPasswords.map(item => 
            item.id === editingId 
              ? { 
                  ...item, 
                  siteName, 
                  username, 
                  password,
                  updatedAt: new Date().toISOString()
                } 
              : item
          );
          setSavedPasswords(newList);
          setIsEditing(false);
          setEditingId(null);
          setIsLoading(false);
          
          // Show success message
          Alert.alert("Success", "Password updated successfully");
        })
        .catch(error => {
          console.error("Error updating password: ", error);
          Alert.alert("Error", "Failed to update password. Please try again.");
          setIsLoading(false);
        });
      } else {
        // Create new password data
        const newPasswordData = { 
          siteName, 
          username, 
          password,
          color: getRandomColor(),
          dateAdded: new Date().toISOString(),
        };
        
        // Add new password to Firebase
        const newPasswordRef = push(passwordsRef);
        set(newPasswordRef, newPasswordData)
          .then(() => {
            // Add to local state with Firebase-generated ID
            const newPassword = {
              id: newPasswordRef.key,
              ...newPasswordData
            };
            
            const newList = [...savedPasswords, newPassword];
            setSavedPasswords(newList);
            
            // Create new animation for this item
            listItemAnim.push(new Animated.Value(0));
            
            // Animate the new item
            Animated.timing(listItemAnim[listItemAnim.length - 1], {
              toValue: 1,
              duration: 500,
              easing: Easing.out(Easing.back(1.5)),
              useNativeDriver: true,
            }).start();
            
            setIsLoading(false);
            
            // Show success message
            Alert.alert("Success", "Password saved successfully");
          })
          .catch(error => {
            console.error("Error adding password: ", error);
            Alert.alert("Error", "Failed to save password. Please try again.");
            setIsLoading(false);
          });
      }
      
      // Clear form
      setSiteName('');
      setUsername('');
      setPassword('');
      setPasswordStrength(0);
      setShowFormPassword(false);
      
      // Hide form after adding
      toggleForm();
    } else {
      // Show required fields error
      Alert.alert(
        "Missing Information",
        "Please fill all fields to save password",
        [{ text: "OK" }]
      );
    }
  };
  
  // Get a random color from our palette
  const getRandomColor = () => {
    const colors = [
      'bg-indigo-600', 'bg-purple-600', 'bg-pink-600', 
      'bg-blue-600', 'bg-teal-600', 'bg-emerald-600',
      'bg-violet-600', 'bg-fuchsia-600', 'bg-sky-600'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Edit password
  const handleEditPassword = (id) => {
    const passwordToEdit = savedPasswords.find(item => item.id === id);
    if (passwordToEdit) {
      setSiteName(passwordToEdit.siteName);
      setUsername(passwordToEdit.username);
      setPassword(passwordToEdit.password);
      setPasswordStrength(calculatePasswordStrength(passwordToEdit.password));
      setIsEditing(true);
      setEditingId(id);
      setShowForm(true);
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };
  
  // Toggle form visibility with animation
  const toggleForm = () => {
    if (showForm) {
      Animated.timing(formAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowForm(false);
        setSiteName('');
        setUsername('');
        setPassword('');
        setPasswordStrength(0);
        setShowFormPassword(false);
        setIsEditing(false);
        setEditingId(null);
      });
    } else {
      setShowForm(true);
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Delete a password
  const handleDeletePassword = (id) => {
    if (!passwordsRef) return;
    
    Alert.alert(
      "Delete Password",
      "Are you sure you want to delete this password?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => {
            setIsLoading(true);
            // Delete from Firebase
            const passwordToDeleteRef = ref(database, `users/${userId}/passwords/${id}`);
            remove(passwordToDeleteRef)
              .then(() => {
                // Update local state
                const newList = savedPasswords.filter(item => item.id !== id);
                setSavedPasswords(newList);
                setIsLoading(false);
                
                // Show success message
                Alert.alert("Success", "Password deleted successfully");
              })
              .catch(error => {
                console.error("Error deleting password: ", error);
                Alert.alert("Error", "Failed to delete password. Please try again.");
                setIsLoading(false);
              });
          },
          style: "destructive"
        }
      ]
    );
  };

  // Copy to clipboard
  const handleCopy = (text) => {
    // In a real app, you would use Clipboard API
    Alert.alert("Copied", "Text copied to clipboard!");
  };
  
  // Load passwords from Firebase when component mounts
  useEffect(() => {
    if (userId) {
      loadPasswords();
    } else {
      Alert.alert("Error", "User not authenticated. Please log in again.");
      navigation.replace('Login');
      return;
    }
    
    // Animate entrance after intro animation completes
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(addButtonAnim, {
        toValue: 1,
        duration: 500,
        delay: 200,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }),
      Animated.timing(searchBarAnim, {
        toValue: 1,
        duration: 600,
        delay: 300,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();
    
    // Real-time listener to update passwords when changes occur in Firebase
    if (passwordsRef) {
      const unsubscribe = onValue(passwordsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const passwordsList = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setSavedPasswords(passwordsList);
        } else {
          setSavedPasswords([]);
        }
      });
      
      // Cleanup listener on unmount
      return () => unsubscribe();
    }
  }, [userId]);

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  // Form opacity and transform based on animation value
  const formOpacity = formAnim;
  const formTranslateY = formAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });
  
  // Header translate Y animation
  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });
  
  // Search bar animation
  const searchBarTranslateY = searchBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });
  
  const searchBarOpacity = searchBarAnim;
  
  // Add button scale and rotate animations
  const addButtonScale = addButtonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  const addButtonRotate = showForm ? '45deg' : '0deg';

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: () => {
            signOut(auth)
              .then(() => {
                navigation.replace('Login');
              })
              .catch(error => {
                console.error("Error signing out: ", error);
                Alert.alert("Error", "Failed to sign out. Please try again.");
              });
          }
        }
      ]
    );
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-900`}>
      <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        <Animated.View style={[tw`flex-1`, { opacity: fadeAnim }]}>
          {/* Animated Header */}
          <Animated.View 
            style={[
              tw`bg-gradient-to-r from-indigo-900 to-violet-900 px-4 py-6 shadow-xl`,
              { transform: [{ translateY: headerTranslateY }] }
            ]}
          >
            <View style={tw`w-full flex-row justify-between items-center`}>
              <View style={tw`flex-row items-center`}>
                <LockIcon />
                <View style={tw`ml-2`}>
                  <Text style={tw`text-indigo-200 text-xs font-medium`}>My Passwords</Text>
                  <Text style={tw`text-white font-bold text-xl`}>SecureVault</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={tw`bg-indigo-800 px-3 py-1 rounded-full border border-indigo-700`}
                onPress={handleLogout}
              >
                <Text style={tw`text-white font-medium`}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Search Bar */}
          <Animated.View 
            style={[
              tw`px-4 pt-4 pb-2`,
              { 
                opacity: searchBarOpacity,
                transform: [{ translateY: searchBarTranslateY }]
              }
            ]}
          >
            <View style={tw`bg-gray-800 rounded-full px-4 py-2 flex-row items-center border border-gray-700`}>
              <SearchIcon />
              <TextInput
                style={tw`flex-1 text-white`}
                placeholder="Search passwords..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={tw`text-gray-400 text-lg ml-2`}>×</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </Animated.View>

          {/* Password List */}
          <ScrollView 
            ref={scrollRef}
            style={tw`flex-1 pt-2 px-4`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tw`${filteredPasswords.length === 0 ? 'flex-1' : ''}`}
          >
            {isLoading ? (
              <View style={tw`flex-1 items-center justify-center py-10`}>
                <Text style={tw`text-gray-300 text-lg`}>Loading passwords...</Text>
              </View>
            ) : filteredPasswords.length === 0 ? (
              <View style={tw`flex-1 items-center justify-center py-10`}>
                <View style={tw`bg-gray-800/50 w-24 h-24 rounded-full items-center justify-center mb-4`}>
                  <Text style={tw`text-5xl`}>🔒</Text>
                </View>
                <Text style={tw`text-gray-300 text-lg font-bold`}>
                  {searchQuery ? 'No matching passwords found' : 'No passwords saved yet'}
                </Text>
                {!searchQuery && (
                  <Text style={tw`text-gray-500 text-center mt-2 mx-10`}>
                    Your password vault is empty. Tap the + button to add your first password.
                  </Text>
                )}
              </View>
            ) : (
              filteredPasswords.map((item, index) => (
                <Animated.View
                  key={item.id}
                  style={[
                    tw`bg-gray-800 rounded-2xl mb-4 overflow-hidden shadow-xl border border-gray-700/50`,
                    {
                      opacity: listItemAnim[index] || 1,
                      transform: [
                        { 
                          translateY: (listItemAnim[index] || new Animated.Value(1)).interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                          }) 
                        }
                      ],
                    },
                  ]}
                >
                  <View style={tw`${item.color || 'bg-indigo-600'} h-1`} />
                  <View style={tw`p-4`}>
                    <View style={tw`flex-row justify-between items-center`}>
                      <View style={tw`flex-row items-center flex-1`}>
                        <View style={tw`${item.color || 'bg-indigo-600'} w-10 h-10 rounded-full items-center justify-center mr-3`}>
                          <Text style={tw`text-white font-bold text-lg`}>
                            {item.siteName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={tw`flex-1`}>
                          <Text style={tw`text-white font-bold text-lg`}>{item.siteName}</Text>
                          {item.dateAdded && (
                            <Text style={tw`text-gray-500 text-xs`}>
                              Added {formatDate(item.dateAdded)}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={tw`flex-row`}>
                        <TouchableOpacity 
                          style={tw`bg-gray-700 p-2 rounded-lg mr-2`}
                          onPress={() => handleEditPassword(item.id)}
                        >
                          <Text style={tw`text-blue-400`}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={tw`bg-gray-700 p-2 rounded-lg`}
                          onPress={() => handleDeletePassword(item.id)}
                        >
                          <Text style={tw`text-red-400`}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={tw`mt-3 pl-12 border-t border-gray-700/50 pt-3`}>
                      <View style={tw`flex-row items-center justify-between mt-1`}>
                        <View style={tw`flex-row items-center flex-1`}>
                          <Text style={tw`text-gray-400 font-medium w-24`}>Username:</Text>
                          <Text style={tw`text-gray-300 flex-1`}>{item.username}</Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => handleCopy(item.username)}
                          style={tw`ml-2 bg-gray-700 p-1 rounded`}
                        >
                          <Text style={tw`text-indigo-300 text-xs`}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <View style={tw`flex-row justify-between items-center mt-2`}>
                        <View style={tw`flex-row items-center flex-1`}>
                          <Text style={tw`text-gray-400 font-medium w-24`}>Password:</Text>
                          <Text style={tw`text-gray-300 flex-1`}>
                            {showPassword[item.id] ? item.password : '••••••••'}
                          </Text>
                        </View>
                        <View style={tw`flex-row`}>
                          <TouchableOpacity 
                            onPress={() => handleCopy(item.password)}
                            style={tw`mr-2 bg-gray-700 p-1 rounded`}
                          >
                            <Text style={tw`text-indigo-300 text-xs`}>Copy</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={tw`bg-gray-700 p-1 rounded-md`}
                            onPress={() => togglePasswordVisibility(item.id)}
                          >
                            {showPassword[item.id] ? <EyeSlashIcon /> : <EyeIcon />}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
            
            {/* Extra space at bottom for better scrolling */}
            <View style={tw`h-24`} />
          </ScrollView>

          {/* Add Password Form */}
          {showForm && (
            <Animated.View
              style={[
                tw`bg-gray-800 rounded-t-3xl p-5 shadow-lg border-t border-gray-700`,
                {
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }],
                },
              ]}
            >
              <View style={tw`flex-row justify-between items-center mb-5`}>
                <Text style={tw`text-white font-bold text-xl`}>
                  {isEditing ? 'Edit Password' : 'Add New Password'}
                </Text>
                <TouchableOpacity 
                  style={tw`bg-gray-700 w-8 h-8 rounded-full items-center justify-center`}
                  onPress={toggleForm}
                >
                  <Text style={tw`text-gray-400 text-xl`}>×</Text>
                </TouchableOpacity>
              </View>
              
              <View style={tw`bg-gray-700 rounded-lg px-4 py-1 mb-4`}>
                <Text style={tw`text-gray-500 text-xs mt-1`}>Site/App Name</Text>
                <TextInput
                  style={tw`text-white py-1`}
                  placeholder="e.g. Facebook, Gmail"
                  placeholderTextColor="#9ca3af"
                  value={siteName}
                  onChangeText={setSiteName}
                />
              </View>
              
              <View style={tw`bg-gray-700 rounded-lg px-4 py-1 mb-4`}>
                <Text style={tw`text-gray-500 text-xs mt-1`}>Username/Email</Text>
                <TextInput
                  style={tw`text-white py-1`}
                  placeholder="e.g. john@example.com"
                  placeholderTextColor="#9ca3af"
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
              
              <View style={tw`bg-gray-700 rounded-lg px-4 py-1 mb-4`}>
                <Text style={tw`text-gray-500 text-xs mt-1`}>Password</Text>
                <View style={tw`flex-row items-center`}>
                  <TextInput
                    style={tw`text-white py-1 flex-1`}
                    placeholder="Enter your password"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showFormPassword}
                  />
                  <TouchableOpacity onPress={() => setShowFormPassword(!showFormPassword)}>
                    {showFormPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Password strength meter */}
              <View style={tw`mb-6`}>
                <View style={tw`flex-row justify-between mb-1`}>
                  <Text style={tw`text-gray-500 text-xs`}>Password Strength</Text>
                  <Text style={tw`text-gray-400 text-xs`}>{getStrengthLabel(passwordStrength)}</Text>
                </View>
                <View style={tw`bg-gray-700 h-1.5 rounded-full overflow-hidden`}>
                  <View 
                    style={{
                      ...tw`${getStrengthColor(passwordStrength)} h-full rounded-full`,
                      width: `${(passwordStrength / 5) * 100}%` 
                    }}
                  />
                </View>
              </View>
              
              <TouchableOpacity
                style={tw`bg-gradient-to-r from-indigo-600 to-purple-600 py-4 rounded-lg items-center shadow-lg`}
                onPress={handleAddPassword}
                disabled={isLoading}
              >
                <Text style={tw`text-white font-bold text-lg`}>
                  {isLoading 
                    ? 'Processing...' 
                    : isEditing 
                      ? 'Update Password' 
                      : 'Save Password'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Add Password Button */}
          {!showForm && (
            <View style={tw`absolute bottom-6 right-6`}>
              <Animated.View
                style={[
                  {
                    transform: [
                      { scale: addButtonScale },
                      { rotate: addButtonRotate }
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={tw`bg-gradient-to-r from-indigo-600 to-purple-600 w-16 h-16 rounded-full items-center justify-center shadow-lg elevation-5`}
                  onPress={toggleForm}
                  disabled={isLoading}
                >
                  <Text style={tw`text-white text-3xl font-bold`}>+</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MainScreen;