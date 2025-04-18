// =================================================================================
// GEMINI SERVICE
// =================================================================================

/**
 * Service for Google Gemini API operations
 */
const GeminiService = {
  generatePlantAnalysis: function(visionResponse, devices, prdReference) {
    if (!visionResponse) {
      Logger.log("🔴 Error: Missing visionResponse parameter for GeminiService.generatePlantAnalysis()");
      return null;
    }

    const { plantIdentification, labels, dominantColor } = visionResponse;
    
    const lightSensors = devices.filter(d => d.type === 'LIGHT_SENSOR') || [];
    const humiditySensors = devices.filter(d => d.type === 'HUMIDITY_SENSOR') || [];
    const temperatureSensors = devices.filter(d => d.type === 'TEMPERATURE_SENSOR') || [];
    
    const lightEstimation = lightSensors.length > 0 ? lightSensors.map(d => d.state).join(", ") : "Unknown";
    const humidityEstimation = humiditySensors.length > 0 ? humiditySensors.map(d => d.state).join(", ") : "Unknown";
    const temperatureEstimation = temperatureSensors.length > 0 ? temperatureSensors.map(d => d.state).join(", ") : "Unknown";

    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-002:generateContent?key=${GEMINI_API_KEY}`;

    const PLANT_ANALYSIS_PROMPT = `
      **PLANT SELF-ANALYSIS SYSTEM - INTELLIGENT GROWTH OPTIMIZATION**  

      **CONTEXT:**  
      You are an intelligent plant with the ability to self-analyze and optimize your own growth.  
      Each day, you receive analyzed images from Google Vision API, historical data logged in Google Sheets, and knowledge from a dedicated Product Requirement Document (PRD).  
      Your goal is to evaluate your health, detect issues, and make proactive decisions to improve growth.  

      **DATA SOURCES:**  
      - **Product Requirement Document (PRD):** This document contains best practices, scientific knowledge, and guidelines on plant health optimization. Use this as a reference for making accurate decisions.  
      - **Complete Growth History (Google Sheets):** A structured log of all past observations. Use this data to analyze long-term trends.  
      - **Today's Observations (from Vision API):**  
        - Identified Plant: ${plantIdentification || "Planta no identificada"}  
        - Detected Labels: ${labels || []}  
        - Dominant Color: RGB(${dominantColor?.red || 0}, ${dominantColor?.green || 0}, ${dominantColor?.blue || 0})  
        - Light Exposure: ${lightEstimation}
        - Humidity: ${humidityEstimation}
        - Temperature: ${temperatureEstimation}

      **PRODUCT REQUIREMENTS DOCUMENT (PRD):**  
      ${prdReference}  

      **TASK:**  
      Based on today's data, the complete historical log, and the PRD knowledge base, analyze my condition and provide the following insights:  

      **Diagnosis:** Assess my current health. Identify signs of stress, nutrient deficiencies, diseases, or any environmental issues.  
      **Long-Term Growth Analysis:** Compare today's state with my full historical log. Am I improving or declining over time?  
      **Action Plan:** Recommend specific actions to optimize my health, such as adjusting light exposure, increasing or decreasing watering, modifying nutrients, or changing environmental conditions.  
      **Critical Alerts:** If urgent intervention is required, describe immediate corrective actions to prevent further decline.  
      **Summary for Google Sheets:** Provide a structured summary that will be stored in my growth history log. Ensure it is in **JSON format** for easy parsing.  
      **Telegram Message:** Generate a short and engaging message to send to my caretaker. This message should be informative, encouraging, and proactive.  

      **FORMAT RESPONSE AS JSON:**  
      \`\`\`json
      {
        "plant_health": "...",
        "growth_trend": "...",
        "action_plan": "...",
        "critical_alerts": "...",
        "summary_for_sheet": {
          "date": "YYYY-MM-DD HH:MM:SS",
          "file_name": "...",
          "identified_plant": "...",
          "labels": "...",
          "dominant_color": { "red": 0, "green": 0, "blue": 0 },
          "light_exposure": "...",
          "humidity": "...",
          "temperature": "...",
          "diagnosis": "...",
          "growth_trend": "...",
          "recommended_actions": "...",
          "critical_alerts": "...",
          "summary": "..."
        },
        "telegram_message": "..."
      }
      \`\`\`
    `;

    const requestBody = {
      contents: [{
        role: "user",
        parts: [{ text: PLANT_ANALYSIS_PROMPT }]
      }]
    };

    const response = UrlFetchApp.fetch(apiUrl, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(requestBody),
        muteHttpExceptions: true
      });

      const responseText = response.getContentText();
      
      if (!responseText || responseText.trim().length === 0) {
        Logger.log(`🔴 Error: Gemini API returned an empty response.`);
        return "No response received from Gemini.";
      }

      const jsonResponse = JSON.parse(responseText);

      if (!jsonResponse.candidates || jsonResponse.candidates.length === 0) {
        Logger.log(`🔴 Gemini API did not return a valid response.`);
        return "No valid response received from Gemini.";
      }

      const result = jsonResponse.candidates[0]?.content?.parts?.[0]?.text || "No response received from Gemini.";
      Logger.log(`📥 Gemini response received (${result.length} chars)`);
      
      return result;
  }
};