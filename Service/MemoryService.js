// =================================================================================
// MEMORY SERVICE
// =================================================================================

/**
 * Service for managing contextual memory of the AI system
 * Stores and retrieves relevant historical data for decision-making
 */
const MemoryService = {
    /**
     * Retrieves relevant historical data based on current context
     * @param {Object} currentContext - Current plant state and environmental data
     * @returns {Object} Relevant historical data
     */
    retrieveRelevantMemory: function(currentContext) {
      try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
        if (!sheet) {
          Logger.log(`⚠️ Memory sheet not found: ${SHEET_NAME}`);
          return { entries: [], summary: "No historical data available" };
        }
        
        // Get all historical data
        const lastRow = sheet.getLastRow();
        if (lastRow < 2) {
          return { entries: [], summary: "No historical data available" };
        }
        
        const range = sheet.getRange(2, 1, lastRow - 1, 7);
        const values = range.getValues();
        
        // Convert to structured data
        const historyEntries = values.map(row => ({
          timestamp: row[0],
          fileName: row[1],
          labels: row[2],
          dominantColor: {
            red: parseFloat(row[3]),
            green: parseFloat(row[4]),
            blue: parseFloat(row[5])
          },
          analysis: row[6]
        }));
        
        // Filter for relevance (last 10 entries by default)
        const recentEntries = historyEntries.slice(-10);
        
        // Create a summary of trends
        const summary = this.generateHistorySummary(recentEntries);
        
        return {
          entries: recentEntries,
          summary: summary
        };
      } catch (error) {
        Logger.log(`❌ Error retrieving memory: ${error.toString()}`);
        return { entries: [], summary: "Error retrieving historical data" };
      }
    },
    
    /**
     * Generates a summary of historical trends
     * @param {Array} entries - Historical data entries
     * @returns {string} Summary of trends
     */
    generateHistorySummary: function(entries) {
      if (!entries || entries.length === 0) {
        return "No historical data available";
      }
      
      // Extract key information from previous analyses
      const healthTrends = entries.map(entry => {
        try {
          // Try to extract structured data from Gemini responses
          const jsonMatch = entry.analysis.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            const parsedData = JSON.parse(jsonMatch[1].trim());
            return {
              date: entry.timestamp,
              health: parsedData.plant_health || "Unknown",
              trend: parsedData.growth_trend || "Unknown",
              actions: parsedData.action_plan || "None"
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      }).filter(item => item !== null);
      
      // Generate summary text
      let summary = `Historical Data Summary (${entries.length} entries):\n`;
      
      if (healthTrends.length > 0) {
        summary += "Health Progression: ";
        summary += healthTrends.map(t => t.health).join(" → ");
        summary += "\n";
        
        // Add most recent recommendations
        const lastRecommendations = healthTrends[healthTrends.length - 1]?.actions || "None";
        summary += `Last Recommendations: ${lastRecommendations}\n`;
      } else {
        summary += "No structured health data available in history.\n";
      }
      
      return summary;
    },
    
    /**
     * Stores new memory entry with reflection on decisions made
     * @param {Object} analysisResult - Current analysis result
     * @param {Object} decisions - Decisions made based on analysis
     * @returns {boolean} Success status
     */
    storeMemoryWithReflection: function(analysisResult, decisions) {
      try {
        // Create reflection on decisions
        const reflection = {
          timestamp: new Date(),
          analysis_summary: analysisResult.summary_for_sheet?.summary || "No summary available",
          decisions_made: {
            lighting: decisions.lighting,
            aeration: decisions.aeration,
            notification: decisions.notification
          },
          expected_outcomes: "To be evaluated in next analysis"
        };
        
        // Store reflection in a separate sheet for learning
        const reflectionSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.REFLECTION_NAME);
        if (reflectionSheet) {
          reflectionSheet.appendRow([
            reflection.timestamp,
            JSON.stringify(reflection.analysis_summary),
            JSON.stringify(reflection.decisions_made),
            reflection.expected_outcomes
          ]);
        }
        
        return true;
      } catch (error) {
        Logger.log(`❌ Error storing memory reflection: ${error.toString()}`);
        return false;
      }
    }
  };