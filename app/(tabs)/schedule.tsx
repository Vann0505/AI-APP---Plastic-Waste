import { Calendar } from '@/components/calendar';
import { ThemedText } from '@/components/themed-text';
import { Design } from '@/constants/design';
import { CollectionItem, getNextPickupForMaterial, MaterialCollection, RECYCLING_SCHEDULES } from '@/constants/recycling-schedule';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ScheduleScreen() {
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([]);
  const [materialCollections, setMaterialCollections] = useState<MaterialCollection[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadCollectionItems();
  }, []);

  useEffect(() => {
    if (collectionItems.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100); // Delay to ensure rendering
    }
  }, [collectionItems]);

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

  const clearCollection = async (material: string) => {
    try {
      // Get the collection items before removing them
      const collectionItemsToRemove = collectionItems.filter(item => item.material === material);
      const remainingItems = collectionItems.filter(item => item.material !== material);
      
      // Calculate payout to add to balance
      const schedule = RECYCLING_SCHEDULES.find(s => s.material === material);
      const payoutToAdd = schedule ? schedule.payout * collectionItemsToRemove.length : 0;
      
      // Update current balance
      const currentBalanceData = await AsyncStorage.getItem('currentBalance');
      const currentBalance = currentBalanceData ? parseFloat(currentBalanceData) : 0;
      const newBalance = currentBalance + payoutToAdd;
      await AsyncStorage.setItem('currentBalance', newBalance.toString());
      
      // Remove collection items
      setCollectionItems(remainingItems);
      await AsyncStorage.setItem('collectionItems', JSON.stringify(remainingItems));
      
      Alert.alert('Picked Up', `${material} collection has been picked up. $${payoutToAdd.toFixed(2)} added to your balance!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to clear collection');
    }
  };

  const renderMaterialCollection = ({ item }: { item: MaterialCollection }) => {
    const schedule = RECYCLING_SCHEDULES.find(s => s.material === item.material);
    const materialColor = schedule?.color || Design.colors.primary;
    
    return (
      <View style={styles.materialCollection}>
        <View style={styles.materialHeader}>
          <View style={[styles.materialTitleRow, {justifyContent: "flex-start"}]}>
            <View style={[styles.colorIndicator, { backgroundColor: materialColor }]} />
            <ThemedText type="subtitle">{item.material}</ThemedText>
          </View>
          <ThemedText>Next pickup: {item.nextPickupDate.toLocaleDateString()}</ThemedText>
        </View>
        <ThemedText>Items in collection: {item.items.length}</ThemedText>
        <ThemedText>Estimated payout: ${item.totalPayout.toFixed(2)}</ThemedText>
        
        {item.items.length > 0 && (
          <View style={styles.itemsList}>
            {item.items.slice(0, 3).map(collectionItem => (
              <ThemedText key={collectionItem.id} style={styles.itemText}>
                • {collectionItem.itemName}
              </ThemedText>
            ))}
            {item.items.length > 3 && (
              <ThemedText style={styles.itemText}>... and {item.items.length - 3} more</ThemedText>
            )}
          </View>
        )}
        
        {item.items.length > 0 && (
          <TouchableOpacity 
            style={[styles.clearButton, { backgroundColor: materialColor }]} 
            onPress={() => clearCollection(item.material)}
          >
            <ThemedText style={styles.clearButtonText}>Mark as Picked Up</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedText type="title">Recycling Collections</ThemedText>
      
      {/* Calendar showing pickup schedule */}
      <Calendar materialCollections={materialCollections} />
      
      {materialCollections.length === 0 ? (
        <ThemedText>No items in collection</ThemedText>
      ) : (
        <FlatList
          ref={flatListRef}
          data={materialCollections}
          keyExtractor={(item) => item.material}
          renderItem={renderMaterialCollection}
          scrollEnabled={false} // Disable FlatList scroll since parent ScrollView handles it
        />
      )}
      
      <ThemedText type="subtitle" style={styles.sectionTitle}>Collection History</ThemedText>
      {collectionItems.length === 0 ? (
        <ThemedText>No items collected yet</ThemedText>
      ) : (
        <FlatList
          data={collectionItems.slice(-10).reverse()} // Show last 10 items, newest first
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <ThemedText>{item.itemName}</ThemedText>
              <ThemedText style={styles.historyMaterial}>{item.material}</ThemedText>
              <ThemedText style={styles.historyDate}>
                Added {new Date(item.dateAdded).toLocaleDateString()}
              </ThemedText>
            </View>
          )}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Design.spacing.large,
  },
  materialCollection: {
    padding: Design.spacing.medium,
    marginVertical: Design.spacing.small,
    borderWidth: 1,
    borderColor: Design.colors.border,
    borderRadius: 10,
    backgroundColor: Design.colors.cardBackground,
  },
  materialHeader: {
    marginBottom: Design.spacing.small,
  },
  materialTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Design.spacing.small,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: Design.spacing.small,
  },
  itemsList: {
    marginVertical: Design.spacing.small,
  },
  itemText: {
    fontSize: 14,
    marginVertical: 2,
  },
  clearButton: {
    padding: Design.spacing.small,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: Design.spacing.small,
  },
  clearButtonText: {
    color: Design.colors.background,
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginTop: Design.spacing.large,
    marginBottom: Design.spacing.medium,
  },
  historyItem: {
    padding: Design.spacing.small,
    marginVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: Design.colors.border,
  },
  historyMaterial: {
    fontSize: 12,
    color: Design.colors.text,
    opacity: 0.7,
  },
  historyDate: {
    fontSize: 12,
    color: Design.colors.text,
    opacity: 0.5,
  },
});