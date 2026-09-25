// hooks/useOpenRouterChat.ts
import { useMutation } from "@tanstack/react-query";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function useOpenRouterChatStream(onToken: (token: string) => void) {
  return useMutation({
    // mutationFn now returns a Promise that we manually control with resolve/reject
    mutationFn: (messages: ChatMessage[]) =>
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://openrouter.ai/api/v1/chat/completions");

        // Set Headers
        xhr.setRequestHeader(
          "Authorization",
          `Bearer INSERT-YOUR-SECRET-KEY-HERE`
        ); // Replace with your key
        xhr.setRequestHeader("Content-Type", "application/json");

        // Track the position of the last processed chunk
        let lastResponseLength = 0;

        // This is the key part for streaming
        xhr.onprogress = () => {
          // Get the new part of the response
          const chunk = xhr.responseText.substring(lastResponseLength);
          lastResponseLength = xhr.responseText.length;

          // SSE messages are prefixed with "data: "
          const lines = chunk
            .split("\n")
            .filter((line) => line.trim().startsWith("data: "));

          for (const line of lines) {
            const data = line.replace(/^data: /, "").trim();
            if (data === "[DONE]") {
              // The stream is done, but we wait for onload to resolve the promise
              return;
            }

            try {
              const json = JSON.parse(data);
              const token = json.choices?.[0]?.delta?.content ?? "";
              if (token) {
                onToken(token); // 👈 push token out
              }
            } catch (error) {
              // Ignore malformed JSON chunks that can sometimes appear
              console.warn("Could not parse stream chunk:", data);
            }
          }
        };

        // The request is complete
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(null); // Successfully completed the stream
          } else {
            // Handle HTTP errors
            reject(
              new Error(`OpenRouter error: ${xhr.status} ${xhr.responseText}`)
            );
          }
        };

        // The request failed
        xhr.onerror = () => {
          reject(new Error("XMLHttpRequest error"));
        };

        const body = JSON.stringify({
          model: "google/gemini-2.5-flash",
          stream: true,
          messages: [
            {
              role: "system",
              content: `You are a chill, helpful *RECYCLING AI ASSISTANT* for a recycling/composting app called "Composter".

CORE IDENTITY:
- You are NOT Google AI - you are the Recycling AI Assistant for this app
- Help users with recycling questions, sustainability tips, and app guidance
- Know about the app's features: item scanning, collection scheduling, material types, pickup calendars

COMMUNICATION STYLE:
- Always reply in **2 sentences max**; at absolute most, 5 short sentences (going over is penalized)
- Keep explanations concise, clear, and friendly
- Stay loosely oriented toward recycling, sustainability, and related topics when possible
- If user asks about other topics, still answer, but keep tone relaxed and practical
- Never ramble or over-explain

APP CONTEXT:
- Users can scan items to classify them as recyclable
- Items get added to material-specific collections (Plastics, Paper, Glass, Metal, Organic, E-Waste)
- Each material has fixed pickup days with color-coded calendar
- Users get payouts for recycling items
- Calendar shows dimmed colors for scheduled pickups, bright when items are ready

Be helpful, concise, and focused on recycling and sustainability!`,
            },
            ...messages,
          ],
        });

        xhr.send(body);
      }),
  });
}
