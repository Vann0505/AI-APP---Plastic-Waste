import { ThemedText } from '@/components/themed-text';
import { Design } from '@/constants/design';
import { classifyItem, createCollectionItem } from '@/constants/recycling-schedule';
import { OpenRouter } from '@openrouter/sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const openRouter = new OpenRouter({
  apiKey: 'INSERT-YOUR-SECRET-KEY-HERE', // Use the same key as in the hook
});

type ScanResult = {
  item: string;
  recyclable: boolean;
  reason: string;
};

type CollectionItem = {
  id: string;
  itemName: string;
  material: string;
  dateAdded: string;
  scanned: boolean;
};

export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mockImages = [
    'https://c8.alamy.com/comp/CBC50F/burning-household-waste-in-the-indian-countryside-CBC50F.jpg',
    'https://static.vecteezy.com/system/resources/previews/021/081/702/non_2x/plastic-waste-concept-of-pollution-and-environmental-disaster-png.png',
    'https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTA4L3Jhd3BpeGVsb2ZmaWNlN19waG90b2dyYXBoeV9vZl9wbGFzdGljX3dhc3RlX3BpbGVfZm9yX3JlY3ljbGluZ19lZGJlYzZmMy0yMzY3LTQxOTQtOTQ5NS1hZTJiYjM0YTNjNmMucG5n.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Cardboard_waste_collection_at_Piattaforma_Ecologica_-_Legnano_%28MI%29%2C_Lombardy%2C_Italy_-_2021-02-26.jpg/640px-Cardboard_waste_collection_at_Piattaforma_Ecologica_-_Legnano_%28MI%29%2C_Lombardy%2C_Italy_-_2021-02-26.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Glass_bottle_beach_%2851719%29.jpg/640px-Glass_bottle_beach_%2851719%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Silver_scraps-_1.jpg/640px-Silver_scraps-_1.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Biodegradable_waste.jpg/640px-Biodegradable_waste.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Revox_B215_-_e-waste_-_old_capacitors.jpg/640px-Revox_B215_-_e-waste_-_old_capacitors.jpg',
    
  ];

  const selectMockImage = (url: string) => {
    setImageUri(url);
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const addToCollection = async (item: string) => {
    const collectionItem = createCollectionItem(item, true);
    
    if (!collectionItem) {
      Alert.alert('Error', 'Unable to classify this item for recycling');
      return;
    }

    try {
      const data = await AsyncStorage.getItem('collectionItems');
      const items: CollectionItem[] = data ? JSON.parse(data) : [];
      items.push(collectionItem);
      await AsyncStorage.setItem('collectionItems', JSON.stringify(items));
      
      const classification = classifyItem(item);
      Alert.alert(
        'Added to Collection', 
        `${classification.material} item added to your ${classification.material} collection. Ready for pickup on the next scheduled day!`
      );
      router.push('/schedule');
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to collection');
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const classifyImage = async () => {
    if (!imageUri) return;

    setLoading(true);
    setError(null);
    try {
      let base64Image: string;
      if (imageUri.startsWith('http')) {
        // Remote URL
        const response = await fetch(imageUri);
        const blob = await response.blob();
        base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } else if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } else {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        base64Image = `data:image/jpeg;base64,${base64}`;
      }

      let content: string;
      let parsed: any;
      let attempts = 0;
      const maxAttempts = 3;
      do {
        const response = await openRouter.chat.send({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze the image and classify the main item. Determine if it is recyclable. Respond ONLY with a valid JSON object in this exact format: {"item": "item name", "recyclable": true/false, "reason": "brief reason"}. Do not include any markdown, code blocks, or additional text. Just the JSON.',
                },
                {
                  type: 'image_url',
                  imageUrl: {
                    url: base64Image,
                  },
                },
              ],
            },
          ],
          stream: false,
        });

        content = (response.choices[0]?.message?.content as string) || '';
        try {
          parsed = JSON.parse(content);
          // Normalize compostable to boolean
          parsed.recyclable = parsed.recyclable === true || parsed.recyclable === 'Yes' || parsed.recyclable === 'yes' || parsed.recyclable === 'True' || parsed.recyclable === 'true';
          break;
        } catch {
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error('Failed to get valid JSON response');
          }
        }
      } while (attempts < maxAttempts);

      setResult(parsed);
    } catch (error) {
      setError('Failed to classify image. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ThemedText type="title">Scan Item</ThemedText>
      <ThemedText>Take a photo or select an image to classify and recycle!</ThemedText>
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <ThemedText type="subtitle">No image selected</ThemedText>
            <ThemedText>Tap below to choose</ThemedText>
          </View>
        )}
      </View>
      <ThemedText type="subtitle">Choose an image:</ThemedText>
      <View style={styles.buttonContainer}>
        <Button title="From Gallery" onPress={pickImage} />
        <Button title="Use Camera" onPress={openCamera} />
      </View>
      <ThemedText type="subtitle">Or select a mock image:</ThemedText>
      <View style={styles.mockImagesContainer}>
        {mockImages.map((url, index) => (
          <TouchableOpacity key={index} onPress={() => selectMockImage(url)} style={styles.mockImageButton}>
            <Image source={{ uri: url }} style={styles.mockImage} />
          </TouchableOpacity>
        ))}
      </View>
      {imageUri && (
        <Button title="Classify" onPress={classifyImage} disabled={loading} />
      )}
      {loading && <ThemedText>Classifying...</ThemedText>}
      {error && <ThemedText style={{ color: 'red' }}>{error}</ThemedText>}
      {result && (
        <View style={[styles.result, { backgroundColor: Design.colors.cardBackground }]}>
          <ThemedText type="subtitle">Classification Result</ThemedText>
          <View style={styles.resultItem}>
            <ThemedText type="defaultSemiBold">Item:</ThemedText>
            <ThemedText>{result.item}</ThemedText>
          </View>
          <View style={styles.resultItem}>
            <ThemedText type="defaultSemiBold">Recyclable:</ThemedText>
            <ThemedText style={{ color: result.recyclable ? 'green' : 'red' }}>
              {result.recyclable ? 'Yes' : 'No'}
            </ThemedText>
          </View>
          <View style={styles.resultItem}>
            <ThemedText type="defaultSemiBold">Reason:</ThemedText>
            <ThemedText>{result.reason}</ThemedText>
          </View>
          {result.recyclable && (
            <View style={styles.scheduleButtonContainer}>
              <Button title="Add to Collection" onPress={() => addToCollection(result.item)} />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  imageContainer: {
    width: 200,
    height: 200,
    marginVertical: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Design.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  result: {
    padding: 15,
    borderWidth: 1,
    borderColor: Design.colors.border,
    borderRadius: 10,
    width: '100%',
  },
  resultItem: {
    marginBottom: 10,
  },
  scheduleButtonContainer: {
    marginTop: 10,
  },
  mockImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  mockImageButton: {
    margin: 5,
  },
  mockImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
});