import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Calendar } from '@/components/calendar';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CollectionItem, getNextPickupForMaterial, MaterialCollection, RECYCLING_SCHEDULES } from '@/constants/recycling-schedule';

export default function HomeScreen() {
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([]);
  const [materialCollections, setMaterialCollections] = useState<MaterialCollection[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadCollectionItems();
      loadBalance();
    }, [])
  );

  useEffect(() => {
    organizeMaterialCollections();
  }, [collectionItems]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCollectionItems = async () => {
    try {
      const data = await AsyncStorage.getItem('collectionItems');
      if (data) {
        setCollectionItems(JSON.parse(data));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadBalance = async () => {
    try {
      const balance = await AsyncStorage.getItem('currentBalance');
      if (balance) {
        setCurrentBalance(parseFloat(balance));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const organizeMaterialCollections = () => {
    const collections: { [key: string]: MaterialCollection } = {};
    
    // Initialize collections for all materials
    RECYCLING_SCHEDULES.forEach(schedule => {
      const nextPickup = getNextPickupForMaterial(schedule.material);
      if (nextPickup) {
        collections[schedule.material] = {
          material: schedule.material,
          items: [],
          nextPickupDate: nextPickup,
          totalPayout: 0
        };
      }
    });
    
    // Add items to their material collections
    collectionItems.forEach(item => {
      if (collections[item.material]) {
        collections[item.material].items.push(item);
        const schedule = RECYCLING_SCHEDULES.find(s => s.material === item.material);
        if (schedule) {
          collections[item.material].totalPayout += schedule.payout;
        }
      }
    });
    
    setMaterialCollections(Object.values(collections));
  };

  const estimatedBalance = currentBalance + materialCollections.reduce((sum, collection) => sum + collection.totalPayout, 0);
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">SDG 12 AI APP</ThemedText>
        <ThemedText type="default">AOL Project LC01 Group 21</ThemedText>
        {/* <HelloWave /> */}
      </ThemedView>
      <ThemedView style={styles.balanceContainer}>
        <ThemedText type="subtitle">Current Balance: ${currentBalance.toFixed(2)}</ThemedText>
        <ThemedText style={styles.estimatedBalance}>Estimated Balance: ${estimatedBalance.toFixed(2)}</ThemedText>
      </ThemedView>
      <Calendar materialCollections={materialCollections} />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  estimatedBalance: {
    color: '#888',
    fontStyle: 'italic',
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
