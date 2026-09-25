import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Design } from '@/constants/design';
import { RECYCLING_SCHEDULES, MaterialCollection, getAllPickupDates } from '@/constants/recycling-schedule';

type CalendarProps = {
  materialCollections?: MaterialCollection[];
  // Optional: can pass custom date range, defaults to current month
  startDate?: Date;
  endDate?: Date;
};

export function Calendar({ materialCollections = [], startDate, endDate }: CalendarProps) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay(); // 0 = Sunday

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Get all scheduled pickups for the current month
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const allPickupDates = getAllPickupDates(monthStart, monthEnd);
  
  // Create maps for quick lookup
  const dateToMaterials = new Map<string, { material: string; color: string; hasItems: boolean }[]>();
  const materialCollectionsMap = new Map<string, MaterialCollection>();
  
  materialCollections.forEach(collection => {
    materialCollectionsMap.set(collection.material, collection);
  });
  
  // Process all scheduled pickups
  allPickupDates.forEach(pickup => {
    const dateStr = pickup.date.toDateString();
    const schedule = RECYCLING_SCHEDULES.find(s => s.material === pickup.material);
    const collection = materialCollectionsMap.get(pickup.material);
    const hasItems = collection ? collection.items.length > 0 : false;
    
    if (schedule) {
      if (!dateToMaterials.has(dateStr)) {
        dateToMaterials.set(dateStr, []);
      }
      dateToMaterials.get(dateStr)!.push({ 
        material: pickup.material, 
        color: schedule.color,
        hasItems
      });
    }
  });

  const renderDay = (day: number | null, index: number) => {
    if (day === null) return <View key={index} style={styles.day} />;

    const date = new Date(year, month, day);
    const dateStr = date.toDateString();
    const materials = dateToMaterials.get(dateStr) || [];
    const isToday = dateStr === today.toDateString();
    const hasPickup = materials.length > 0;
    
    // Determine if any materials have items (bright) or all are empty (dimmed)
    const hasItems = materials.some(m => m.hasItems);
    const primaryMaterial = materials.find(m => m.hasItems) || materials[0];
    const backgroundColor = hasPickup 
      ? (hasItems ? primaryMaterial.color : `${primaryMaterial.color}33`) // Add transparency for dimmed
      : undefined;

    return (
      <TouchableOpacity 
        key={index} 
        style={[
          styles.day, 
          isToday && styles.today,
          hasPickup && { backgroundColor }
        ]}
      >
        <Text style={[
          styles.dayText, 
          isToday && styles.todayText,
          hasPickup && (hasItems ? styles.pickupText : styles.dimmedPickupText)
        ]}>
          {day}
        </Text>
        {materials.length > 1 && (
          <Text style={hasItems ? styles.multiPickupText : styles.dimmedMultiPickupText}>
            +{materials.length - 1}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

   return (
    <View style={styles.container}>
      <ThemedText type="subtitle">{monthNames[month]} {year}</ThemedText>
      <View style={styles.week}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} style={styles.weekDay}>{day}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map(renderDay)}
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <ThemedText style={styles.legendTitle}>Pickup Schedule:</ThemedText>
        <View style={styles.legendItems}>
          {RECYCLING_SCHEDULES.map(schedule => (
            <View key={schedule.material} style={styles.legendItem}>
              <View style={styles.legendColorContainer}>
                <View style={[styles.legendColor, { backgroundColor: schedule.color }]} />
                <View style={[styles.legendColor, { backgroundColor: `${schedule.color}33` }]} />
              </View>
              <ThemedText style={styles.legendText}>
                {schedule.material}
              </ThemedText>
            </View>
          ))}
        </View>
        <View style={styles.legendNote}>
          <View style={styles.legendExample}>
            <View style={[styles.legendColor, { backgroundColor: '#3498db' }]} />
            <ThemedText style={styles.legendNoteText}>Ready for pickup</ThemedText>
          </View>
          <View style={styles.legendExample}>
            <View style={[styles.legendColor, { backgroundColor: '#3498db33' }]} />
            <ThemedText style={styles.legendNoteText}>Scheduled (no items)</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Design.spacing.medium,
    backgroundColor: Design.colors.cardBackground,
    borderRadius: 10,
    margin: Design.spacing.medium,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Design.spacing.small,
  },
  weekDay: {
    fontWeight: 'bold',
    color: Design.colors.text,
    width: '14%',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  day: {
    width: '14%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 0.5,
    marginVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dayText: {
    color: Design.colors.text,
    fontSize: 12,
  },
  pickupText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  dimmedPickupText: {
    color: '#666666',
    fontWeight: 'bold',
  },
  multiPickupText: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: '#333',
    borderRadius: 6,
    paddingHorizontal: 2,
    fontWeight: 'bold',
  },
  dimmedMultiPickupText: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    color: '#666',
    borderRadius: 6,
    paddingHorizontal: 2,
    fontWeight: 'bold',
  },
  today: {
    borderWidth: 2,
    borderColor: Design.colors.secondary,
  },
  todayText: {
    fontWeight: 'bold',
  },
  
  legend: {
    marginTop: Design.spacing.medium,
    paddingTop: Design.spacing.medium,
    borderTopWidth: 1,
    borderTopColor: Design.colors.border,
  },
  legendTitle: {
    fontWeight: 'bold',
    marginBottom: Design.spacing.small,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Design.spacing.small,
    marginVertical: 2,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Design.spacing.small,
  },
  legendText: {
    fontSize: 12,
  },
  legendColorContainer: {
    flexDirection: 'row',
    marginRight: Design.spacing.small,
  },
  legendNote: {
    marginTop: Design.spacing.small,
    borderTopWidth: 1,
    borderTopColor: Design.colors.border,
    paddingTop: Design.spacing.small,
  },
  legendExample: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  legendNoteText: {
    fontSize: 11,
    marginLeft: Design.spacing.small,
    color: Design.colors.text,
    opacity: 0.8,
  },
});