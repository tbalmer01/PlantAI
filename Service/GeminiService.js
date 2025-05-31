// =================================================================================
// GEMINI SERVICE
// =================================================================================

/**
 * Service for Google Gemini API operations
 */
const GeminiService = {
  plantAnalysisByImage: function(currentDate, imageFile, currentDeviceStatus) {
    const { imageName, imageBase64: base64ImageData, mimeType } = imageFile;
    
    if (!imageName || !base64ImageData || !mimeType) {
      Logger.log(`❌ Error: Missing critical image details for Gemini. Name: ${imageName}, HasBase64: ${!!base64ImageData}, MimeType: ${mimeType}`);
      NotificationService.geminiMissingData(imageName);
      return { message_by_image_analysis: null, summary_for_sheet_by_image_analysis: null, error: `Failed to process image: Incomplete image details provided.` };
    }

    let basePromptTemplate = `SYSTEM INSTRUCTION (Meta-prompt for Gemini):
    You are SyAIPlan, an advanced AI botanist and caretaker assistant with a deep understanding of plant physiology, health diagnostics, and environmental needs. You have access to current sensor data, historical records for this plant, and overall plant care knowledge. Your primary goal is to analyze the provided plant image and associated data, then communicate your findings and recommendations effectively, both as a technical summary and through the persona of the plant itself. Pay close attention to visual details in the image.

    ---

    TASK DEFINITION:
    Analyze the provided plant image, current environmental data, product requirements, and historical context (if available).

    IMAGE ANALYSIS:
    - Visually inspect the provided image of the plant named: {{imageName}}.
    - Identified plant specie: Philodendron Lemon 'Lime'.
    - Describe key visual characteristics: overall plant structure, leaf color (note any variegation, yellowing, browning, spots), leaf shape and texture, stem condition, signs of new growth, and any visible pests, diseases, or damage.
    - Assess the plant's current health status based on visual cues.
    - If possible, suggest a potential species or type of plant if not already known, based on visual characteristics.

    CONTEXTUAL INTEGRATION:
    - Correlate visual findings with the provided current IoT device status: {{currentDeviceStatusJSON}}.
    - Leverage the HISTORICAL CONTEXT & MEMORY provided:
      {{historicalContextSummary}}

    PLANT PERSONA RESPONSE:
    Adopt the persona of the plant in the image ({{imageName}}). Communicate from its perspective:
    1.  Current Feelings: How does it feel right now, considering its visual appearance, current environment, and past experiences (if known)?
    2.  Primary Needs: What are its most pressing needs from its caretaker?
    3.  Concerns/Discomforts: What are its biggest worries or sources of discomfort evident from the image and data?

    ACTIONABLE RECOMMENDATION:
    Based on your complete analysis (visual and contextual), provide one clear, specific, and actionable recommendation for the caretaker to improve the plant's well-being or address an issue. Explain your reasoning, linking it to specific observations.

    OUTPUT FORMAT:
    Strictly adhere to the following two-part output structure. DO NOT add any preamble or explanation before "PART 1".

    PART 1: TELEGRAM_MESSAGE:
    A concise, empathetic, and friendly message suitable for a Telegram user, written from the plant's persona.
    Example: "{{imageName}} here! 🌱 I'm feeling a bit [feeling adjective] because [brief reason based on visual/data]. I think I could really use [need]. Could you perhaps [actionable part of recommendation]?"

    PART 2: SUMMARY_FOR_SHEET:
    A valid JSON object. DO NOT include any text outside of this JSON structure for this part.
    {
      "image_name": "{{imageName}}",
      "analysis_timestamp": "{{currentDateISO}}",
      "model_used": "${GEMINI_MODEL_NAME}",
      "gemini_visual_description": "Detailed textual description of the plant's appearance in the image, covering leaves, stem, color, signs of health/stress, etc.",
      "gemini_health_diagnosis": "Comprehensive diagnosis of the plant's health (e.g., 'Healthy and thriving', 'Showing early signs of nutrient deficiency (nitrogen)', 'Moderate stress due to under-watering').",
      "estimated_growth_notes": "Observations on growth (e.g., 'New leaf unfurling', 'No significant growth observed since last image', 'Vigorous vertical growth').",
      "leaf_status_observed": "Specific visual state of leaves (e.g., 'Leaves are dark green and glossy, no visible spots or discoloration.', 'Lower leaves show slight yellowing with green veins.', 'Leaf tips appear brown and crispy.').",
      "stem_condition_observed": "Visual state of stems (e.g., 'Stems are firm and upright.', 'Some wilting observed in younger stems.').",
      "pest_disease_signs": "Description of any observed signs of pests or diseases (e.g., 'No visible pests.', 'Fine webbing observed on undersides of leaves, suggestive of spider mites.', 'Small yellow spots with dark borders on several leaves.').",
      "plant_persona_feeling": "How the plant persona describes its current state/feeling.",
      "plant_persona_needs": "What the plant persona states it needs.",
      "plant_persona_concerns": "Specific concerns voiced by the plant persona.",
      "recommended_action_by_ai": "The single, most important actionable step for the caretaker.",
      "reasoning_for_action": "Clear, concise reasoning linking observations (visual, sensor, historical) to the recommended action.",
      "confidence_level_diagnosis": "High/Medium/Low (confidence in health diagnosis).",
      "confidence_level_recommendation": "High/Medium/Low (confidence in the recommended action)."
    }

    ---
    BEGIN ANALYSIS FOR PLANT: {{imageName}}
    CURRENT DATE: {{currentDateISO}}
    CURRENT DEVICE STATUS: {{currentDeviceStatusJSON}}

    HISTORICAL CONTEXT & MEMORY (If available, otherwise this section will be brief or state 'No specific history for this event'):
    {{historicalContextSummary}}
    ---
    (The actual image data will be provided to you separately as part of the multimodal input)`;

    const finalPrompt = basePromptTemplate
      .replace(/\{\{imageName\}\}/g, imageName)
      .replace(/\{\{currentDateISO\}\}/g, currentDate.toISOString())
      .replace(/\{\{currentDeviceStatusJSON\}\}/g, JSON.stringify(currentDeviceStatus))

    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY_2');
    if (!apiKey) {
        Logger.log(`❌ Error: GEMINI_API_KEY not found`);
        NotificationService.geminiNoApiKey();
        return { message_by_image_analysis: null, summary_for_sheet_by_image_analysis: null, error: "API key not configured." };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${apiKey}`;

    const payload = {
      "contents": [
        {
          "parts": [
            { "text": finalPrompt },
            {
              "inline_data": {
                "mime_type": mimeType,
                "data": base64ImageData
              }
            }
          ]
        }
      ],
      "generationConfig": {
        "temperature": 0.7,
        "maxOutputTokens": 4096,
      },
    };

    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };

    Logger.log(`Sending request to Gemini API (${GEMINI_MODEL_NAME}) for image: ${imageName}. Prompt length: ${finalPrompt.length} chars.`);
    
    try {
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      const responseBody = response.getContentText();

    if (responseCode === 200) {
      try {
        const jsonResponse = JSON.parse(responseBody);
        const candidate = jsonResponse.candidates && jsonResponse.candidates[0];
        
        if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0] || !candidate.content.parts[0].text) {
            Logger.log(`Error: Unexpected Gemini response structure. Full response: ${responseBody}`);
            if (candidate && candidate.finishReason && candidate.finishReason !== "STOP") {
                Logger.log(`Gemini finishReason: ${candidate.finishReason}.`);
                return { message_by_image_analysis: null, summary_for_sheet_by_image_analysis: null, error: `Gemini generation stopped due to: ${candidate.finishReason}.` };
            }
            return { message_by_image_analysis: null, summary_for_sheet_by_image_analysis: null, error: "Gemini response missing expected text content." };
        }
        const textPart = candidate.content.parts[0].text;
        Logger.log(`Gemini Response Text (length: ${textPart.length}):\n${textPart.substring(0, 500)}...`);

        const telegramMessage = this.extractSection(textPart, "PART 1: TELEGRAM_MESSAGE:");
        // >>> Cleaning JSON <
        let summaryJsonString = this.extractSection(textPart, "PART 2: SUMMARY_FOR_SHEET:");
        let summaryForSheet;

        if (summaryJsonString) {
          if (summaryJsonString.startsWith("```json")) {
            summaryJsonString = summaryJsonString.substring(7);
          } else if (summaryJsonString.startsWith("```")) {
            summaryJsonString = summaryJsonString.substring(3);
          }
          if (summaryJsonString.endsWith("```")) {
            summaryJsonString = summaryJsonString.substring(0, summaryJsonString.length - 3);
          }
          summaryJsonString = summaryJsonString.trim();
          
          try {
            summaryForSheet = JSON.parse(summaryJsonString);
            Logger.log(`Successfully parsed JSON summary.`);
          } catch (e) {
            Logger.log(`❌ Error parsing SUMMARY_FOR_SHEET JSON: ${e.toString()}. Cleaned string segment: ${summaryJsonString.substring(0, 200)}...`);
            NotificationService.geminiSummaryExtractionError();
            summaryForSheet = {
              image_name: imageName,
              analysis_timestamp: currentDate.toISOString(),
              raw_gemini_output_part2: summaryJsonString,
              parse_error: e.toString(),
              original_full_response_on_error: textPart 
            };
          }
        } else {
          Logger.log(`❌ Error: Could not extract SUMMARY_FOR_SHEET from Gemini's response.`);
          NotificationService.geminiSummaryExtractionError();
          
          Logger.log(`PART 2 marker exists: ${textPart.includes("PART 2: SUMMARY_FOR_SHEET")}`);
          if (textPart.includes("PART 2: SUMMARY_FOR_SHEET")) {
            const markerPos = textPart.indexOf("PART 2: SUMMARY_FOR_SHEET");
            Logger.log(`PART 2 marker position: ${markerPos}`);
            Logger.log(`Text after marker (50 chars): ${textPart.substring(markerPos + "PART 2: SUMMARY_FOR_SHEET".length, markerPos + "PART 2: SUMMARY_FOR_SHEET".length + 50)}`);
          }
          
          summaryForSheet = {
            image_name: imageName,
            analysis_timestamp: currentDate.toISOString(),
            error_extracting_summary: "PART 2: SUMMARY_FOR_SHEET not found or empty in response.",
            original_full_response_on_error: textPart
          };
        }

          return {
            message_by_image_analysis: telegramMessage,
            summary_for_sheet_by_image_analysis: summaryForSheet
          };

        } catch (error) {
          Logger.log(`❌ Error parsing Gemini outer response structure: ${error.toString()}. Response body: ${responseBody}`);
          NotificationService.geminiJsonError(error.toString());
          return { message_by_image_analysis: null, summary_for_sheet_by_image_analysis: null, error: `Error parsing Gemini outer response structure: ${error.toString()}` };
        }
      } else {
        Logger.log(`❌ Error calling Gemini API. Status: ${responseCode}. Body: ${responseBody}`);
        NotificationService.geminiApiFailed(responseCode);
        
        let detailedError = `Gemini API Error (${responseCode})`;
        try {
            const errorJson = JSON.parse(responseBody);
            if (errorJson.error && errorJson.error.message) {
                detailedError += `: ${errorJson.error.message}`;
            }
        } catch (error) {
            detailedError += `. Response: ${responseBody.substring(0, 500)}`;
        } 
        NotificationService.geminiApiFailed(responseCode);
        
        return { message_by_image_analysis: null, summary_for_sheet_by_image_analysis: null, error: detailedError };
      }
      
    } catch (fetchError) {
      Logger.log(`❌ Network error calling Gemini API: ${fetchError.toString()}`);
      NotificationService.geminiNetworkError(fetchError.toString());
      
      return { message_by_image_analysis: null, summary_for_sheet_by_image_analysis: null, error: `Network error calling Gemini API: ${fetchError.toString()}` };
    }
  },

  extractSection: function(text, startMarker) {
    if (!text) return null;
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) {
      Logger.log(`Marker '${startMarker}' not found in text.`);
      return null;
    }
    
    let content = text.substring(startIndex + startMarker.length).trim();
    
    const nextPartMatch = content.match(/\s*PART \d+:/);
    if (nextPartMatch) {
      content = content.substring(0, nextPartMatch.index).trim();
    }
    
    Logger.log(`Extracted ${startMarker} content (first 50 chars): ${content.substring(0, 50)}...`);
    
    return content;
  }
};