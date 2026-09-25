// Fixed recycling schedule based on typical municipal recycling schedules
export interface RecyclingSchedule {
  material: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  payout: number;
  keywords: string[];
  color: string;
  frequency?: 'weekly' | 'biweekly'; // New field for frequency
  biweeklyStartWeek?: number; // Week of month to start (1-4) for biweekly
}

export interface CollectionItem {
  id: string;
  itemName: string;
  material: string;
  dateAdded: string;
  scanned: boolean;
}

export interface MaterialCollection {
  material: string;
  items: CollectionItem[];
  nextPickupDate: Date;
  totalPayout: number;
}

export const RECYCLING_SCHEDULES: RecyclingSchedule[] = [
  {
    material: 'Plastics',
    dayOfWeek: 2, // Tuesday
    payout: 1.50,
    keywords: ['plastic', 'bottle', 'container', 'bag', 'wrap', 'polyethylene', 'PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS'],
    color: '#3498db' // Blue
  },
  {
    material: 'Paper & Cardboard',
    dayOfWeek: 4, // Thursday
    payout: 0.75,
    keywords: ['paper', 'cardboard', 'box', 'newspaper', 'magazine', 'office', 'junk mail', 'carton'],
    color: '#f39c12' // Orange
  },
  {
    material: 'Glass',
    dayOfWeek: 2, // Tuesday (coincides with plastics)
    payout: 1.25,
    keywords: ['glass', 'bottle', 'jar', 'container', 'window', 'mirror'],
    color: '#9b59b6' // Purple
  },
  {
    material: 'Metal',
    dayOfWeek: 5, // Friday
    payout: 2.00,
    keywords: ['metal', 'can', 'aluminum', 'steel', 'tin', 'foil', 'container', 'lid'],
    color: '#95a5a6' // Gray
  },
  {
    material: 'Organic Waste',
    dayOfWeek: 1, // Monday
    payout: 0.50,
    keywords: ['organic', 'food', 'compost', 'waste', 'vegetable', 'fruit', 'leftover', 'scraps'],
    color: '#27ae60' // Green
  },
  {
    material: 'E-Waste',
    dayOfWeek: 5, // Friday (special pickup)
    payout: 3.00,
    keywords: ['electronic', 'computer', 'phone', 'battery', 'cable', 'charger', 'device', 'gadget', 'appliance'],
    color: '#e74c3c', // Red
    frequency: 'biweekly',
    biweeklyStartWeek: 1 // First and third Fridays
  }
];

export function getNextPickupDate(itemName: string): { date: Date; material: string; payout: number } | null {
  const itemLower = itemName.toLowerCase();
  
  // Find the best matching schedule based on keywords
  let bestMatch: RecyclingSchedule | null = null;
  let maxKeywordMatches = 0;
  
  for (const schedule of RECYCLING_SCHEDULES) {
    const matches = schedule.keywords.filter(keyword => itemLower.includes(keyword)).length;
    if (matches > maxKeywordMatches) {
      maxKeywordMatches = matches;
      bestMatch = schedule;
    }
  }
  
  if (!bestMatch) {
    // Default to general recycling if no specific match
    bestMatch = RECYCLING_SCHEDULES[0]; // Plastics as default
  }
  
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  const targetDayOfWeek = bestMatch.dayOfWeek;
  
  // Calculate days until next pickup
  let daysUntil = targetDayOfWeek - currentDayOfWeek;
  if (daysUntil <= 0) {
    daysUntil += 7; // Next week if today or already passed
  }
  
  const pickupDate = new Date(today);
  pickupDate.setDate(today.getDate() + daysUntil);
  
  return {
    date: pickupDate,
    material: bestMatch.material,
    payout: bestMatch.payout
  };
}

export function getMaterialSchedule(material: string): RecyclingSchedule | null {
  return RECYCLING_SCHEDULES.find(schedule => 
    schedule.material.toLowerCase() === material.toLowerCase()
  ) || null;
}

export function getAllPickupDates(startDate: Date, endDate: Date): Array<{ date: Date; material: string; payout: number }> {
  const pickups: Array<{ date: Date; material: string; payout: number }> = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    for (const schedule of RECYCLING_SCHEDULES) {
      if (current.getDay() === schedule.dayOfWeek) {
        // Check if this is a valid pickup day based on frequency
        if (schedule.frequency === 'biweekly') {
          const firstDayOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
          const dayOfWeek = firstDayOfMonth.getDay();
          const weekOfMonth = Math.ceil((current.getDate() + dayOfWeek) / 7);
          // For biweekly: pickup on week 1 and 3 (or 2 and 4 depending on start week)
          const isValidWeek = weekOfMonth === schedule.biweeklyStartWeek || weekOfMonth === (schedule.biweeklyStartWeek! + 2);
          if (isValidWeek) {
            pickups.push({
              date: new Date(current),
              material: schedule.material,
              payout: schedule.payout
            });
          }
        } else {
          // Default weekly pickup
          pickups.push({
            date: new Date(current),
            material: schedule.material,
            payout: schedule.payout
          });
        }
      }
    }
    current.setDate(current.getDate() + 1);
  }
  
  return pickups.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function classifyItem(itemName: string): { material: string; schedule: RecyclingSchedule } | null {
  const itemLower = itemName.toLowerCase();
  
  // Find the best matching schedule based on keywords
  let bestMatch: RecyclingSchedule | null = null;
  let maxKeywordMatches = 0;
  
  for (const schedule of RECYCLING_SCHEDULES) {
    const matches = schedule.keywords.filter(keyword => itemLower.includes(keyword)).length;
    if (matches > maxKeywordMatches) {
      maxKeywordMatches = matches;
      bestMatch = schedule;
    }
  }
  
  if (!bestMatch) {
    // Default to general recycling if no specific match
    bestMatch = RECYCLING_SCHEDULES[0]; // Plastics as default
  }
  
  return {
    material: bestMatch.material,
    schedule: bestMatch
  };
}

export function getNextPickupForMaterial(material: string): Date | null {
  const schedule = getMaterialSchedule(material);
  if (!schedule) return null;
  
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  const targetDayOfWeek = schedule.dayOfWeek;
  
  // Calculate days until next pickup
  let daysUntil = targetDayOfWeek - currentDayOfWeek;
  if (daysUntil <= 0) {
    daysUntil += 7; // Next week if today or already passed
  }
  
  let pickupDate = new Date(today);
  pickupDate.setDate(today.getDate() + daysUntil);
  
  // For biweekly schedules, check if this is the right week
  if (schedule.frequency === 'biweekly') {
    let attempts = 0;
    const maxAttempts = 4; // Check up to 4 weeks ahead
    
    while (attempts < maxAttempts) {
      const firstDayOfMonth = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), 1);
      const dayOfWeek = firstDayOfMonth.getDay();
      const weekOfMonth = Math.ceil((pickupDate.getDate() + dayOfWeek) / 7);
      const isValidWeek = weekOfMonth === schedule.biweeklyStartWeek || weekOfMonth === (schedule.biweeklyStartWeek! + 2);
      
      if (isValidWeek) {
        break; // Found valid pickup date
      }
      
      // Add 7 more days and check again
      pickupDate.setDate(pickupDate.getDate() + 7);
      attempts++;
    }
  }
  
  return pickupDate;
}

export function createCollectionItem(itemName: string, scanned: boolean = true): CollectionItem | null {
  const classification = classifyItem(itemName);
  if (!classification) return null;
  
  return {
    id: Date.now().toString(),
    itemName,
    material: classification.material,
    dateAdded: new Date().toISOString(),
    scanned
  };
}