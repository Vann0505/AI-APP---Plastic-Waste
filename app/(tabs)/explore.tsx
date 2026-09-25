import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Design } from '@/constants/design';

export default function AccountScreen() {
  const handleSettingPress = (setting: string) => {
    Alert.alert(`${setting} Setting`, `This is a mock ${setting.toLowerCase()} setting.`);
  };

  const handleClearData = async () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all app data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['scheduledItems', 'chat_messages']);
              Alert.alert('Data Cleared', 'All app data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
        },
      ]
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E0F2F1', dark: '#1D3D47' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#008080"
          name="person.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Account</ThemedText>
      </ThemedView>
      <ThemedText>Welcome to your account settings!</ThemedText>

      <TouchableOpacity style={styles.settingButton} onPress={() => handleSettingPress('Profile')}>
        <IconSymbol size={24} name="person.circle" color={Design.colors.primary} />
        <ThemedText style={styles.settingText}>Profile Settings</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingButton} onPress={() => handleSettingPress('Notification')}>
        <IconSymbol size={24} name="bell.fill" color={Design.colors.primary} />
        <ThemedText style={styles.settingText}>Notification Settings</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingButton} onPress={() => handleSettingPress('Privacy')}>
        <IconSymbol size={24} name="hand.raised.fill" color={Design.colors.primary} />
        <ThemedText style={styles.settingText}>Privacy Settings</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingButton} onPress={() => handleSettingPress('Help')}>
        <IconSymbol size={24} name="questionmark.circle.fill" color={Design.colors.primary} />
        <ThemedText style={styles.settingText}>Help & Support</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingButton} onPress={() => handleSettingPress('Logout')}>
        <IconSymbol size={24} name="arrow.right.square" color={Design.colors.primary} />
        <ThemedText style={styles.settingText}>Logout</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.settingButton, styles.clearDataButton]} onPress={handleClearData}>
        <IconSymbol size={24} name="trash.fill" color="red" />
        <ThemedText style={[styles.settingText, styles.clearDataText]}>Clear All Data</ThemedText>
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#008080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Design.spacing.medium,
    marginVertical: Design.spacing.small,
    backgroundColor: Design.colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Design.colors.border,
  },
  settingText: {
    marginLeft: Design.spacing.medium,
    fontSize: 16,
  },
  clearDataButton: {
    borderColor: 'red',
  },
  clearDataText: {
    color: 'red',
  },
});
