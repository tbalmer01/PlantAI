// =================================================================================
// GOOGLE VISION SERVICE
// =================================================================================

const VisionService = {
  /**
   * Analyzes an image using Google Vision API and processes the response.
   */
  analyzeImageAndParseResponse: function(imageName, imageToAnalyze) {
    Logger.log(`📤 Analyzing new image with Google Vision service`);
    const visionResponse = this.getVisionResponse(imageToAnalyze);
    if (!visionResponse) {
      Logger.log(`❌ Failed calling the service: VisionService.getVisionResponse()`);
      return null;
    }

    Logger.log("📤 Processing Google Vision response");
    const parsedResponse = this.parseVisionResponse(imageName, visionResponse);
    if (!parsedResponse) {
      Logger.log(`❌ Failed calling the service: VisionService.parseVisionResponse()`);
      return null;
    }

    return parsedResponse;
  },

  /**
   * Compares current image with historical images to detect changes
   * 
   * 
   
  compareWithHistoricalImages: function(currentImageBase64, historicalEntries) {
    try {
      if (!historicalEntries || historicalEntries.length === 0) {
        return { hasComparison: false, changes: [] };
      }
      
      // Get the most recent previous entry for comparison
      const previousEntry = historicalEntries[historicalEntries.length - 1];
      
      // Extract current image dominant color
      const currentImageAnalysis = this.getVisionResponse(currentImageBase64);
      if (!currentImageAnalysis) {
        return { hasComparison: false, changes: [] };
      }
      
      const currentColor = currentImageAnalysis.responses[0].imagePropertiesAnnotation?.dominantColors?.colors[0]?.color || 
                          { red: 0, green: 0, blue: 0 };
      
      // Compare with previous dominant color
      const previousColor = previousEntry.dominantColor;
      
      // Calculate color difference (simple Euclidean distance)
      const colorDifference = Math.sqrt(
        Math.pow(currentColor.red - previousColor.red, 2) +
        Math.pow(currentColor.green - previousColor.green, 2) +
        Math.pow(currentColor.blue - previousColor.blue, 2)
      );
      
      // Determine if there's a significant change (threshold can be adjusted)
      const significantColorChange = colorDifference > 30;
      
      // Compare labels
      const currentLabels = currentImageAnalysis.responses[0].labelAnnotations
        ? currentImageAnalysis.responses[0].labelAnnotations.map(label => label.description)
        : [];
      
      const previousLabels = previousEntry.labels.split(", ");
      
      // Find new labels that weren't present before
      const newLabels = currentLabels.filter(label => !previousLabels.includes(label));
      
      // Find labels that disappeared
      const disappearedLabels = previousLabels.filter(label => !currentLabels.includes(label));
      
      return {
        hasComparison: true,
        changes: [
          {
            type: "color",
            significant: significantColorChange,
            difference: colorDifference.toFixed(2),
            direction: this.determineColorChangeDirection(previousColor, currentColor)
          },
          {
            type: "labels",
            newLabels: newLabels,
            disappearedLabels: disappearedLabels,
            significant: newLabels.length > 0 || disappearedLabels.length > 0
          }
        ]
      };
    } catch (error) {
      Logger.log(`❌ Error comparing with historical images: ${error.toString()}`);
      return { hasComparison: false, changes: [] };
    }
  }, */

  /**
   * Determines the direction of color change (e.g., "greener", "yellower")
   * 
   * 
   
  determineColorChangeDirection: function(previousColor, currentColor) {
    // Calculate differences in each channel
    const redDiff = currentColor.red - previousColor.red;
    const greenDiff = currentColor.green - previousColor.green;
    const blueDiff = currentColor.blue - previousColor.blue;
    
    // Determine primary change
    if (Math.abs(greenDiff) > Math.abs(redDiff) && Math.abs(greenDiff) > Math.abs(blueDiff)) {
      return greenDiff > 0 ? "greener" : "less green";
    } else if (Math.abs(redDiff) > Math.abs(greenDiff) && Math.abs(redDiff) > Math.abs(blueDiff)) {
      return redDiff > 0 ? "redder" : "less red";
    } else if (Math.abs(blueDiff) > Math.abs(greenDiff) && Math.abs(blueDiff) > Math.abs(redDiff)) {
      return blueDiff > 0 ? "bluer" : "less blue";
    }
    
    // Check for yellow (red+green)
    if (redDiff > 0 && greenDiff > 0) {
      return "yellower";
    }
    
    // Check for brown (decrease in all channels)
    if (redDiff < 0 && greenDiff < 0 && blueDiff < 0) {
      return "darker/browner";
    }
    
    return "subtle change";
  }, */

  // ============================================================================
  // DOMAIN MAPPING LAYER – Data extraction & domain interpretation
  // ============================================================================

  /** 
   * Processes the Vision API response
   */
  parseVisionResponse: function(imageName, visionResponse) {
    if (!visionResponse?.responses?.[0]) {
      Logger.log(`❌ No valid response received from Google Vision API.`);
      return null;
    }

    const { timestamp } = Utils.getTime();

    const response = visionResponse.responses[0];
  
    const labelAnnotations = response.labelAnnotations || [];
    const labels = labelAnnotations.map(label => label.description);
    const labelSummary = labels.length > 0 ? labels.join(", ") : "Not detected";
    const plantIdentification = labels[0] || "Unknown Plant";
  
    const colors = response.imagePropertiesAnnotation?.dominantColors?.colors || [];
    const dominantColor = colors.length > 0 ? colors[0].color : { red: 0, green: 0, blue: 0 };
    const dominantColorPixelFraction = colors[0]?.pixelFraction || 0;
  
    const cropConfidence = response.cropHintsAnnotation?.cropHints?.[0]?.confidence || null;
  
    const colorString = `rgb(${dominantColor.red}, ${dominantColor.green}, ${dominantColor.blue})`;
  
    return {
      forGemini: {
        fullRawResponse: response
      },
      sheetRow: [
        timestamp,
        imageName,
        plantIdentification,
        labelSummary,
        colorString,
        dominantColorPixelFraction.toFixed(3),
        cropConfidence !== null ? cropConfidence.toFixed(2) : "-"
      ]
    };
  },

  // ============================================================================
  // API INTEGRATION LAYER – Raw communication with Google Vision
  // ============================================================================

  /**
   * Analyzes an image using Google Vision API
   */
    getVisionResponse: function(image) {
      if (typeof image !== "string" || image.length === 0) {
        Logger.log(`🔴 Error: image is not a valid string.`);
        return null;
      }
  
      const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;
  
      const requestBody = {
        requests: [{
          image: { content: image },
          features: [
            { type: "LABEL_DETECTION", maxResults: 10 },
            { type: "IMAGE_PROPERTIES" },
            { type: "OBJECT_LOCALIZATION", maxResults: 10 },
          ]
        }]
      };
  
      const response = UrlFetchApp.fetch(apiUrl, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(requestBody),
        muteHttpExceptions: true
      });
  
      const responseText = response.getContentText();
      Logger.log(`📤 Raw Vision API Response: ${responseText}`);
  
      const jsonResponse = JSON.parse(responseText);
  
      if (!jsonResponse.responses || jsonResponse.responses.length === 0) {
        Logger.log(`🔴 Error: Vision API response does not contain any valid data.`);
        return null;
      }
  
      return jsonResponse;
    },
  
};

