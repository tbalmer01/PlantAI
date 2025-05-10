// =================================================================================
// GEMINI SERVICE
// =================================================================================

/**
 * Service for Google Gemini API operations
 */
const GeminiService = {
  generatePlantAnalysis: function(currentDate, visionInput, devices, prdReference, imageFileName) {
    if (!visionInput) {
      Logger.log("🔴 GeminiService: Missing visionInput (parsed Vision data) for generatePlantAnalysis.");
      return null;
    }
    if (!devices) devices = [];

    const { 
      plantIdentification,
      labels,
      dominantColor,
      dominantColorPixelFraction,
      // cropConfidence // We can include this in the prompt if desired
    } = visionInput;
    
    const lightSensors = devices.filter(d => d.type === 'LIGHT_SENSOR');
    const humiditySensors = devices.filter(d => d.type === 'HUMIDITY_SENSOR');
    const temperatureSensors = devices.filter(d => d.type === 'TEMPERATURE_SENSOR');
    
    const lightEstimation = lightSensors.length > 0 ? lightSensors.map(d => d.state).join(", ") : "Unknown";
    const humidityEstimation = humiditySensors.length > 0 ? humiditySensors.map(d => d.state).join(", ") : "Unknown";
    const temperatureEstimation = temperatureSensors.length > 0 ? temperatureSensors.map(d => d.state).join(", ") : "Unknown";

    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-002:generateContent?key=${GEMINI_API_KEY}`;

    const PLANT_ANALYSIS_PROMPT = `
      **PLANT SELF-ANALYSIS SYSTEM - INTELLIGENT GROWTH OPTIMIZATION**  

      **CONTEXT:**  
      You are an intelligent plant. Analyze your condition using the provided data to optimize growth.  

      **DATA SOURCES:**  
      1.  **Product Requirement Document (PRD):** 
          \`\`\`
          ${prdReference || "No PRD information provided."}
          \`\`\`
      2.  **Complete Growth History (Recent entries from Google Sheets, CSV format):**  
          \`\`\`csv
          \`\`\`
      3.  **Today's Observations (from Vision API & Sensors - ${currentDate}):**  
          - Image File Name: ${imageFileName}
          - Identified Plant: ${plantIdentification || "Planta no identificada"}  
          - Detected Labels from Image: ${(labels && labels.length > 0) ? labels.join(", ") : "No labels detected"}  
          - Dominant Color (RGB): (${dominantColor?.red || 0}, ${dominantColor?.green || 0}, ${dominantColor?.blue || 0})  
          ${dominantColorPixelFraction !== undefined ? `- Dominant Color Pixel Fraction: ${dominantColorPixelFraction.toFixed(3)}` : ''}
          - Current Light Exposure: ${lightEstimation}
          - Current Humidity: ${humidityEstimation}
          - Current Temperature: ${temperatureEstimation}

      **TASK:**  
      Analyze my condition based on ALL data sources. Provide the following insights:  
      1. Diagnosis: Assess current health, identify stress, deficiencies, diseases, or environmental issues.  
      2. Long-Term Growth Analysis: Compare today's state with historical log. Am I improving or declining?  
      3. Action Plan: Recommend specific actions (light, water, nutrients, environment).  
      4. Critical Alerts: If urgent intervention is required, describe immediate corrective actions.  
      5. Summary for Google Sheets (JSON format): Provide a structured summary. 'date' should be ${currentDate}, 'file_name' should be ${imageFileName}.
      6. Telegram Message: Short, engaging message for caretaker.  

      **FORMAT RESPONSE AS JSON (ensure the entire output is a single valid JSON object):**  
      \`\`\`json
      {
        "plant_health_diagnosis": "...",
        "long_term_growth_analysis": "...",
        "recommended_action_plan": "...",
        "critical_alerts_details": "...",
        "summary_for_sheet": {
          "date": "${currentDate}",
          "file_name": "${imageFileName}",
          "identified_plant": "${(plantIdentification || "Planta no identificada").replace(/"/g, '\\"')}",
          "labels": "${((labels && labels.length > 0) ? labels.join(", ") : "No labels detected").replace(/"/g, '\\"')}",
          "dominant_color": { "red": ${dominantColor?.red || 0}, "green": ${dominantColor?.green || 0}, "blue": ${dominantColor?.blue || 0} },
          "light_exposure": "${lightEstimation.replace(/"/g, '\\"')}",
          "humidity": "${humidityEstimation.replace(/"/g, '\\"')}",
          "temperature": "${temperatureEstimation.replace(/"/g, '\\"')}",
          "diagnosis_summary": "...",
          "growth_trend_summary": "...", 
          "recommended_actions_summary": "...",
          "critical_alerts_summary": "...",
          "ai_notes": "..."
        },
        "telegram_message": "..."
      }
      \`\`\`
    `;

    const requestBody = {
      contents: [{ role: "user", parts: [{ text: PLANT_ANALYSIS_PROMPT }] }],
      generationConfig: { responseMimeType: "application/json" }
    };

    // Logger.log("⬆️ Gemini Prompt (first 500 chars): " + PLANT_ANALYSIS_PROMPT.substring(0,500) + "...");

    try {
        const fetchResponse = UrlFetchApp.fetch(apiUrl, {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify(requestBody),
            muteHttpExceptions: true,
            headers: { 'Content-Type': 'application/json' }
        });
        const responseCode = fetchResponse.getResponseCode();
        const responseText = fetchResponse.getContentText();
        if (responseCode === 200) { /* ... (rest of the robust response parsing from previous example) ... */ 
            if (!responseText || responseText.trim().length === 0) { /* ... */ return "No response..."; }
            try {
                const parsedJson = JSON.parse(responseText);
                if (parsedJson.candidates && parsedJson.candidates[0]?.content?.parts?.[0]?.text) {
                    const candidateText = parsedJson.candidates[0].content.parts[0].text;
                    try {
                        const finalJsonResponse = JSON.parse(candidateText);
                        Logger.log(`📥 GeminiService: Parsed JSON from candidate received.`);
                        return finalJsonResponse;
                    } catch (e) { /* ... */ Logger.log(`🔴 GeminiService: Error parsing JSON from candidate. ${e}`); return `Error parsing JSON from Gemini candidate`; }
                } else if (parsedJson.plant_health_diagnosis) {
                    Logger.log(`📥 GeminiService: Direct JSON response received.`);
                    return parsedJson;
                } else { /* ... */  Logger.log(`🔴 GeminiService: Unexpected JSON structure.`); return `Unexpected JSON structure from Gemini`; }
            } catch (e) { /* ... */ Logger.log(`🔴 GeminiService: Error parsing response as JSON. ${e}`); return `Error parsing response from Gemini (Code 200)`; }
        } else { /* ... */ Logger.log(`🔴 GeminiService: API request failed code ${responseCode}.`); return `Error from Gemini API (Code ${responseCode})`; }
    } catch (e) { /* ... */ Logger.log(`🔴 GeminiService: Exception during UrlFetchApp.fetch. ${e}`); return `Exception during API call`; }
  }
};