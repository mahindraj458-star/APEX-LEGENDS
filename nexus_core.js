/**
 * ai-processor.js
 * Handles communication with the Gemini API to analyze blog content.
 * Includes exponential backoff for reliability.
 */

// API Configuration
const apiKey = ""; // Set by environment at runtime
const MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

/**
 * Main function to analyze the blog page content.
 */
async function analyzeBlogContent() {
  const outputElement = document.getElementById('ai-insight');
  
  if (!outputElement) {
    console.error("Error: Element with ID 'ai-insight' not found.");
    return;
  }

  // 1. Prepare the prompt by gathering text from your blog
  // This assumes your blog content is inside a main container
  const blogContent = document.body.innerText || "No content found";
  
  const systemPrompt = "You are a helpful blog assistant. Summarize the following blog content and provide 3 key takeaways.";
  const userQuery = `Please analyze this blog content: ${blogContent.substring(0, 5000)}`; // Limit length for safety

  outputElement.innerHTML = "<em>AI is thinking...</em>";

  // 2. Execute API call with Exponential Backoff
  try {
    const responseText = await fetchWithRetry(systemPrompt, userQuery);
    outputElement.innerHTML = responseText;
  } catch (error) {
    outputElement.innerHTML = `<span style="color: red;">Failed to load AI insights. Please try again later.</span>`;
  }
}

/**
 * Fetch helper with Exponential Backoff (1s, 2s, 4s, 8s, 16s)
 */
async function fetchWithRetry(systemPrompt, userQuery, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${MODEL_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userQuery }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    } catch (err) {
      if (i === retries - 1) throw err; // Final attempt failed
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 3. Initialize when the window loads
window.onload = () => {
  // Optional: Add a small delay to ensure dynamic blog content (from dat.js) has rendered
  setTimeout(analyzeBlogContent, 1000);
};
