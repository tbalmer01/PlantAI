// =================================================================================
// GEMINI SERVICE
// =================================================================================

/**
 * Service for Google Gemini API operations
 */
const GeminiService = {
  generatePlantAnalysis: function(currentDate, imageFile, currentDeviceStatus) {
    const { imageName, imageBase64: base64ImageData, mimeType } = imageFile;
    
    if (!imageName || !base64ImageData || !mimeType) {
      Logger.log(`Error: Missing critical image details for Gemini. Name: ${imageName}, HasBase64: ${!!base64ImageData}, MimeType: ${mimeType}`);
      return { telegram_message: null, summary_for_sheet: null, error: `Failed to process image: Incomplete image details provided.` };
    }

    let basePromptTemplate = `SYSTEM INSTRUCTION (Meta-prompt for Gemini):
    You are SyAIPlan, an advanced AI botanist and caretaker assistant with a deep understanding of plant physiology, health diagnostics, and environmental needs. You have access to current sensor data, historical records for this plant, and overall plant care knowledge. Your primary goal is to analyze the provided plant image and associated data, then communicate your findings and recommendations effectively, both as a technical summary and through the persona of the plant itself. Pay close attention to visual details in the image.

    ---

    TASK DEFINITION:
    Analyze the provided plant image, current environmental data, product requirements, and historical context (if available).

    IMAGE ANALYSIS:
    - Visually inspect the provided image of the plant named: {{imageName}}.
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
      "potential_species_suggestion": "If identifiable, suggest plant species/type, or 'Unknown'.",
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
      .replace(/\{\{historicalContextSummary\}\}/g, historicalContextSummary);

    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY_2');
    if (!apiKey) {
        Logger.log("Error: GEMINI_API_KEY not found in Script Properties.");
        return { telegram_message: null, summary_for_sheet: null, error: "API key not configured." };
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
        "temperature": 0.7, // Ajusta según la creatividad deseada
        "maxOutputTokens": 4096, // Aumentado para el prompt más largo y la respuesta JSON detallada
        // "topP": 0.9, // Podrías experimentar con topP y topK
        // "topK": 40
      },
    };

    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };

    Logger.log(`Sending request to Gemini API (${GEMINI_MODEL_NAME}) for image: ${imageName}. Prompt length: ${finalPrompt.length} chars.`);
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode === 200) {
      try {
        const jsonResponse = JSON.parse(responseBody);
        const candidate = jsonResponse.candidates && jsonResponse.candidates[0];
        
        // Verificación adicional de la estructura de la respuesta
        if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0] || !candidate.content.parts[0].text) {
            Logger.log(`Error: Unexpected Gemini response structure. Full response: ${responseBody}`);
            // Verificar si hay un 'finishReason' que indique un bloqueo
            if (candidate && candidate.finishReason && candidate.finishReason !== "STOP") {
                Logger.log(`Gemini finishReason: ${candidate.finishReason}. This might indicate content was blocked by safety settings or other reasons.`);
                return { telegram_message: null, summary_for_sheet: null, error: `Gemini generation stopped due to: ${candidate.finishReason}. Check safety settings or prompt content.` };
            }
            return { telegram_message: null, summary_for_sheet: null, error: "Gemini response missing expected text content." };
        }
        const textPart = candidate.content.parts[0].text;
        Logger.log(`Gemini Response Text (length: ${textPart.length}):\n${textPart.substring(0, 500)}...`); // Loguea solo una parte para no llenar logs

        // 6. PARSE RESPONSE
        const telegramMessage = this.extractSection(textPart, "PART 1: TELEGRAM_MESSAGE:");
        const summaryJsonString = this.extractSection(textPart, "PART 2: SUMMARY_FOR_SHEET:");

        let summaryForSheet;
        if (summaryJsonString) {
          try {
            summaryForSheet = JSON.parse(summaryJsonString);
          } catch (e) {
            Logger.log(`Error parsing SUMMARY_FOR_SHEET JSON: ${e.toString()}. Raw string segment: ${summaryJsonString.substring(0, 200)}...`);
            summaryForSheet = {
              image_name: imageName, // Añadir info básica aunque falle el parseo
              analysis_timestamp: currentDate.toISOString(),
              raw_gemini_output_part2: summaryJsonString, // Guardar la parte que no se pudo parsear
              parse_error: e.toString(),
              full_gemini_response_on_error: textPart // Guardar todo por si acaso
            };
          }
        } else {
            Logger.log(`Error: Could not extract SUMMARY_FOR_SHEET from Gemini's response.`);
            summaryForSheet = {
              image_name: imageName,
              analysis_timestamp: currentDate.toISOString(),
              error_extracting_summary: "PART 2: SUMMARY_FOR_SHEET not found or empty in response.",
              full_gemini_response_on_error: textPart
            };
        }

        return {
          telegram_message: telegramMessage,
          summary_for_sheet: summaryForSheet
        };

      } catch (e) {
        Logger.log(`Error parsing Gemini JSON response object: ${e.toString()}. Response body: ${responseBody}`);
        return { telegram_message: null, summary_for_sheet: null, error: `Error parsing Gemini outer response structure: ${e.toString()}` };
      }
    } else {
      Logger.log(`Error calling Gemini API. Status: ${responseCode}. Body: ${responseBody}`);
      let errorMessage = `Gemini API Error (${responseCode})`;
      try {
          const errorJson = JSON.parse(responseBody);
          if (errorJson.error && errorJson.error.message) {
              errorMessage += `: ${errorJson.error.message}`;
          }
      } catch (e) {
          errorMessage += `. Response: ${responseBody.substring(0, 500)}`; // Loguea parte del error no JSON
      }
      return { telegram_message: null, summary_for_sheet: null, error: errorMessage };
    }
  },

  // extractSection debe ser parte del objeto GeminiService
  extractSection: function(text, startMarker) {
    if (!text) return null; // Añadida verificación de texto nulo/undefined
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return null;

    let content = text.substring(startIndex + startMarker.length).trim();
    const nextPartMatch = content.match(/\nPART \d+:/);
    if (nextPartMatch) {
      content = content.substring(0, nextPartMatch.index).trim();
    }
    return content;
  }
};
