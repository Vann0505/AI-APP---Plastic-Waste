// components/Chat.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ChatMessage, useOpenRouterChatStream } from "@/hooks/use-openrouter";
import AsyncStorage from "@react-native-async-storage/async-storage"; // 👈 1. Import AsyncStorage
import { useHeaderHeight } from "@react-navigation/elements";
import React, { useEffect, useRef, useState } from "react"; // 👈 Import useEffect
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
// import { TouchableOpacity } from "@/components/touchable" // insane
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const MESSAGES_STORAGE_KEY = "chat_messages"; // 👈 2. Define a key for storage
export default function Chat() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStream, setCurrentStream] = useState("");
  const [input, setInput] = useState("");
  const [isLoaded, setIsLoaded] = useState(false); // To prevent premature saving
  const currentStreamRef = useRef("");

  // 👈 3. Add a useEffect to load messages when the component mounts
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const storedMessages = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        }
      } catch (e) {
        console.error("Failed to load messages from storage", e);
      } finally {
        setIsLoaded(true); // Mark loading as complete
      }
    };
    loadMessages();
  }, []); // The empty array ensures this effect runs only once on mount

  // 👈 4. Create a helper function to save messages
  const saveMessages = async (messagesToSave: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(
        MESSAGES_STORAGE_KEY,
        JSON.stringify(messagesToSave)
      );
    } catch (e) {
      console.error("Failed to save messages to storage", e);
    }
  };

  const { mutate: sendMessage, isPending } = useOpenRouterChatStream(
    (token) => {
      // Update the ref with the latest content
      currentStreamRef.current += token;
      // Update the state to trigger a re-render and show the stream
      setCurrentStream(currentStreamRef.current);
    }
  );

  const handleSend = (content: string) => {
    if (!content.trim()) return;

    // 1. Prepare the new message and the updated message list
    const newUserMessage: ChatMessage = { role: "user", content };
    const updatedMessages = [...messages, newUserMessage];

    // 2. Update state for the UI
    setMessages(updatedMessages);
    setInput("");
    setCurrentStream(""); // Clear the visual streaming bubble
    currentStreamRef.current = ""; // Reset the ref for the new response

    // 3. Call the mutation with the up-to-date message list
    sendMessage(updatedMessages, {
      onSuccess: () => {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: currentStreamRef.current.trim(),
        };

        // 👈 5. Update state and save the complete conversation
        setMessages((prevMessages) => {
          const finalMessages = [...prevMessages, assistantMessage];
          saveMessages(finalMessages); // Save the new, complete list
          return finalMessages;
        });

        setCurrentStream("");
      },
      // Optional: Add onError for better error handling
      onError: (error) => {
        console.error("Streaming error:", error);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I encountered an error." },
        ]);
        setCurrentStream("");
      },
    });
  };

  const handleNewChat = async () => {
    // Clear everything
    setMessages([]);
    setCurrentStream("");
    currentStreamRef.current = "";
    try {
      await AsyncStorage.removeItem(MESSAGES_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear messages from storage", e);
    }
  };

  return (
    <>
      <ThemedView
        style={{
          paddingHorizontal: 20,
          paddingBottom: 10,
          paddingTop: insets.top + 10,
          flexDirection: "row",
          justifyContent: "space-between",
          zIndex: 20,
        }}
      >
        <ThemedText type="title" style={{ fontSize: 26 }}>
          Recycling AI Chat
        </ThemedText>
        <TouchableOpacity
          onPress={handleNewChat}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: "#007AFF", // Or your theme's primary color
          }}
        >
          <ThemedText
            style={{
              color: "white",
              fontWeight: "600",
            }}
          >
            New Chat
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
      <KeyboardAvoidingView
        behavior="translate-with-padding"
        keyboardVerticalOffset={headerHeight}
        style={{ flex: 1 }}
      >
        <FlatList
          data={
            [
              ...messages,
              currentStream
                ? { role: "assistant", content: currentStream }
                : null,
            ]
              .filter(Boolean).reverse() as ChatMessage[]
          }
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View
              style={{
                padding: 10,
                margin: 6,
                backgroundColor: item.role === "user" ? "#DCF8C6" : "#ECECEC",
                alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                borderRadius: 12,
                maxWidth: "80%",
              }}
            >
              <Text selectable>{item.content}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 10 }}
          style={{ flex: 1 }}
          inverted
          // maintainVisibleContentPosition={{
          //   autoscrollToBottomThreshold: 0.2,
          //   startRenderingFromBottom: true,
          // }}
          //onStartReached={handler}
          // estimatedItemSize={320}
          // alignItemsAtEnd
          // maintainScrollAtEnd
          // maintainScrollAtEndThreshold={0.5}
        />
        <View
          style={{
            flexDirection: "row",
            padding: 10,
            borderTopWidth: 1,
            borderColor: "#ddd",
          }}
        >
          <TextInput
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: "#f1f1f1",
              borderRadius: 20,
            }}
            placeholder="Type a message"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend(input)}
          />
          <TouchableOpacity
            onPress={() => handleSend(input)}
            disabled={isPending}
            style={{
              marginLeft: 8,
              backgroundColor: isPending ? "#aaa" : "#007AFF",
              borderRadius: 20,
              paddingHorizontal: 16,
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
