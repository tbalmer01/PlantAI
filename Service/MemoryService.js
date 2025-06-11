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
  retrieveRelevantMemory: function (currentContext) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_IMAGE_ANALYSIS);
      if (!sheet) {
        Logger.log(`⚠️ Memory sheet not found: ${SHEET_IMAGE_ANALYSIS}`);
        return { entries: [], summary: 'No historical data available' };
      }

      // Get all historical data from Image_Analysis sheet
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return { entries: [], summary: 'No historical data available' };
      }

      // Read all columns from Image_Analysis sheet (14 columns based on Gemini analysis structure)
      const range = sheet.getRange(2, 1, lastRow - 1, 14);
      const values = range.getValues();

      // Convert to structured data matching Gemini analysis format
      const historyEntries = values
        .map(row => ({
          timestamp: row[0], // Column A: Timestamp
          imageName: row[1], // Column B: Image_name
          modelUsed: row[2], // Column C: Model_used
          visualDescription: row[3], // Column D: Gemini_visual_description
          healthDiagnosis: row[4], // Column E: Gemini_health_diagnosis
          growthNotes: row[5], // Column F: Estimated_growth_notes
          leafStatus: row[6], // Column G: Leaf_status_observed
          stemCondition: row[7], // Column H: Stem_condition_observed
          pestDiseaseSign: row[8], // Column I: Pest_disease_signs
          plantPersonaFeeling: row[9], // Column J: Plant_persona_feeling
          plantPersonaNeeds: row[10], // Column K: Plant_persona_needs
          plantPersonaConcerns: row[11], // Column L: Plant_persona_concerns
          recommendedAction: row[12], // Column M: Recommended_action_by_ai
          reasoning: row[13], // Column N: Reasoning_for_action
        }))
        .filter(entry => entry.timestamp && entry.imageName); // Filter out empty rows

      // Filter for relevance (last 10 entries by default)
      const recentEntries = historyEntries.slice(-10);

      // Create a summary of trends
      const summary = this.generateHistorySummary(recentEntries);

      return {
        entries: recentEntries,
        summary: summary,
      };
    } catch (error) {
      Logger.log(`❌ Error retrieving memory: ${error.toString()}`);
      return { entries: [], summary: 'Error retrieving historical data' };
    }
  },

  /**
   * Generates a summary of historical trends from Gemini analysis data
   * @param {Array} entries - Historical data entries from Image_Analysis sheet
   * @returns {string} Summary of trends and patterns
   */
  generateHistorySummary: function (entries) {
    if (!entries || entries.length === 0) {
      return 'No historical data available';
    }

    // Extract health progression from Gemini diagnoses
    const healthProgression = entries
      .map(entry => ({
        date: entry.timestamp,
        health: entry.healthDiagnosis || 'Unknown',
        feeling: entry.plantPersonaFeeling || 'Unknown',
        needs: entry.plantPersonaNeeds || 'Unknown',
        concerns: entry.plantPersonaConcerns || 'Unknown',
        action: entry.recommendedAction || 'None',
        reasoning: entry.reasoning || 'No reasoning provided',
      }))
      .filter(item => item.health !== 'Unknown');

    // Generate comprehensive summary
    let summary = `HISTORICAL PLANT MEMORY (${entries.length} analyses):\n\n`;

    if (healthProgression.length > 0) {
      // Recent health trend
      const recentHealth = healthProgression.slice(-3);
      summary += 'RECENT HEALTH TREND:\n';
      recentHealth.forEach(h => {
        const date = h.date instanceof Date ? h.date.toLocaleDateString() : h.date;
        summary += `• ${date}: ${h.health} - Feeling: ${h.feeling}\n`;
      });

      // Most recent recommendations and outcomes
      const lastEntry = healthProgression[healthProgression.length - 1];
      summary += `\nLAST AI RECOMMENDATION: ${lastEntry.action}\n`;
      summary += `REASONING: ${lastEntry.reasoning}\n`;

      // Plant persona insights
      if (lastEntry.needs !== 'Unknown') {
        summary += `PLANT'S CURRENT NEEDS: ${lastEntry.needs}\n`;
      }
      if (lastEntry.concerns !== 'Unknown') {
        summary += `PLANT'S CONCERNS: ${lastEntry.concerns}\n`;
      }

      // Pattern recognition
      const healthKeywords = healthProgression.map(h => h.health.toLowerCase());
      const commonHealthTerms = this.findCommonTerms(healthKeywords);
      if (commonHealthTerms.length > 0) {
        summary += `\nCOMMON HEALTH PATTERNS: ${commonHealthTerms.join(', ')}\n`;
      }
    } else {
      summary += 'No detailed health progression data available.\n';
    }

    summary += `\nTOTAL IMAGES ANALYZED: ${entries.length}`;
    if (entries.length > 0) {
      const firstDate =
        entries[0].timestamp instanceof Date
          ? entries[0].timestamp.toLocaleDateString()
          : entries[0].timestamp;
      const lastDate =
        entries[entries.length - 1].timestamp instanceof Date
          ? entries[entries.length - 1].timestamp.toLocaleDateString()
          : entries[entries.length - 1].timestamp;
      summary += `\nMONITORING PERIOD: ${firstDate} to ${lastDate}`;
    }

    return summary;
  },

  /**
   * Helper function to find common terms in health descriptions
   * @param {Array} terms - Array of health description terms
   * @returns {Array} Common terms found
   */
  findCommonTerms: function (terms) {
    const termCounts = {};
    terms.forEach(term => {
      const words = term.split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          // Only count significant words
          termCounts[word] = (termCounts[word] || 0) + 1;
        }
      });
    });

    // Return terms that appear more than once
    return Object.keys(termCounts).filter(term => termCounts[term] > 1);
  },

  /**
   * Stores new memory entry with reflection on decisions made
   * @param {Object} analysisResult - Current analysis result
   * @param {Object} decisions - Decisions made based on analysis
   * @returns {boolean} Success status
   */
  storeMemoryWithReflection: function (analysisResult, decisions) {
    try {
      // Create reflection on decisions
      const reflection = {
        timestamp: new Date(),
        analysis_summary: analysisResult.summary_for_sheet?.summary || 'No summary available',
        decisions_made: {
          lighting: decisions.lighting,
          aeration: decisions.aeration,
          notification: decisions.notification,
        },
        expected_outcomes: 'To be evaluated in next analysis',
      };

      // Store reflection in a separate sheet for learning
      const reflectionSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
        CONFIG.SHEETS.REFLECTION_NAME
      );
      if (reflectionSheet) {
        reflectionSheet.appendRow([
          reflection.timestamp,
          JSON.stringify(reflection.analysis_summary),
          JSON.stringify(reflection.decisions_made),
          reflection.expected_outcomes,
        ]);
      }

      return true;
    } catch (error) {
      Logger.log(`❌ Error storing memory reflection: ${error.toString()}`);
      return false;
    }
  },
};
