// =================================================================================
// DECISION SERVICE
// =================================================================================

/**
 * Service for making decisions based on collected data
 * This service analyzes data from various sources and makes decisions
 * about environmental adjustments, notifications, and other actions.
 */
const DecisionService = {
  /**
   * Parses the Gemini response to extract structured data
   * @param {string} geminiResponse - The raw response from Gemini API
   * @returns {Object|null} Structured data extracted from the response or null if error
   */
  parseGeminiResponse: function (geminiResponse) {
    try {
      // Extract JSON from the response
      const jsonMatch = geminiResponse.match(/```json\s*([\s\S]*?)\s*```/);

      if (!jsonMatch || !jsonMatch[1]) {
        Logger.log(`⚠️ No JSON found in Gemini response.`);
        return null;
      }

      const jsonString = jsonMatch[1].trim();
      const parsedData = Utils.safeJsonParse(jsonString);

      if (!parsedData) {
        Logger.log(`⚠️ Failed to parse JSON from Gemini response.`);
        return null;
      }

      Logger.log(`✅ Gemini response parsed successfully.`);
      return parsedData;
    } catch (error) {
      Logger.log(`❌ Error parsing Gemini response: ${error.toString()}`);
      return null;
    }
  },

  /**
   * Determines if the lighting should be adjusted based on analysis and time
   * @param {Object} analysisData - The parsed analysis data from Gemini
   * @returns {Object} Decision about lighting adjustments
   */
  decideLightingAdjustments: function (analysisData) {
    try {
      // Get current time
      const now = new Date();
      const currentHour = now.getHours();

      // Get lighting schedule from config
      const { START_HOUR, END_HOUR } = CONFIG.ENVIRONMENT.LIGHTING_SCHEDULE;

      // Determine if lights should be on based on schedule
      const shouldBeOnBySchedule = currentHour >= START_HOUR && currentHour < END_HOUR;

      // Check if there are any overrides from the analysis
      let override = false;
      let overrideReason = "";

      if (analysisData && analysisData.action_plan) {
        // Look for lighting recommendations in the action plan
        const actionPlan = analysisData.action_plan.toLowerCase();

        if (actionPlan.includes("increase light") || actionPlan.includes("more light")) {
          override = true;
          overrideReason = "Plant needs more light based on analysis";
        } else if (actionPlan.includes("reduce light") || actionPlan.includes("less light")) {
          override = false;
          overrideReason = "Plant needs less light based on analysis";
        }
      }

      // Make final decision
      const finalDecision = override !== null ? override : shouldBeOnBySchedule;

      return {
        shouldBeOn: finalDecision,
        reason: override !== null ? overrideReason : `Based on schedule (${START_HOUR}:00 - ${END_HOUR}:00)`,
        isOverride: override !== null
      };
    } catch (error) {
      Logger.log(`❌ Error deciding lighting adjustments: ${error.toString()}`);
      return {
        shouldBeOn: null,
        reason: "Error in decision process",
        isOverride: false
      };
    }
  },

  /**
   * Determines if the aeration should be adjusted based on analysis and time
   * @param {Object} analysisData - The parsed analysis data from Gemini
   * @returns {Object} Decision about aeration adjustments
   */
  decideAerationAdjustments: function (analysisData) {
    try {
      // Get current time
      const now = new Date();
      const currentHour = now.getHours();

      // Get aeration schedule from config
      const intervals = CONFIG.ENVIRONMENT.AERATION_SCHEDULE.INTERVALS;

      // Determine if aerator should be on based on schedule
      let shouldBeOnBySchedule = false;
      let activeInterval = null;

      for (const interval of intervals) {
        if (currentHour >= interval.START_HOUR && currentHour < interval.END_HOUR) {
          shouldBeOnBySchedule = true;
          activeInterval = interval;
          break;
        }
      }

      // Check if there are any overrides from the analysis
      let override = null;
      let overrideReason = "";

      if (analysisData && analysisData.action_plan) {
        // Look for aeration recommendations in the action plan
        const actionPlan = analysisData.action_plan.toLowerCase();

        if (actionPlan.includes("increase aeration") || actionPlan.includes("more oxygen")) {
          override = true;
          overrideReason = "Plant needs more aeration based on analysis";
        } else if (actionPlan.includes("reduce aeration") || actionPlan.includes("less oxygen")) {
          override = false;
          overrideReason = "Plant needs less aeration based on analysis";
        }
      }

      // Make final decision
      const finalDecision = override !== null ? override : shouldBeOnBySchedule;

      return {
        shouldBeOn: finalDecision,
        reason: override !== null ? overrideReason : activeInterval
          ? `Based on schedule (${activeInterval.START_HOUR}:00 - ${activeInterval.END_HOUR}:00)`
          : "Outside scheduled intervals",
        isOverride: override !== null
      };
    } catch (error) {
      Logger.log(`❌ Error deciding aeration adjustments: ${error.toString()}`);
      return {
        shouldBeOn: null,
        reason: "Error in decision process",
        isOverride: false
      };
    }
  },

  /**
   * Determines if a notification should be sent to the user
   * @param {Object} analysisData - The parsed analysis data from Gemini
   * @returns {Object} Decision about notification
   */
  decideNotification: function (analysisData) {
    try {
      if (!analysisData) {
        return {
          shouldNotify: false,
          message: "",
          isUrgent: false
        };
      }

      // Check if there are any critical alerts
      const hasCriticalAlerts = analysisData.critical_alerts &&
        analysisData.critical_alerts.trim().length > 0 &&
        analysisData.critical_alerts !== "None" &&
        analysisData.critical_alerts !== "N/A";

      // Get the telegram message if available
      const telegramMessage = analysisData.telegram_message || "";

      return {
        shouldNotify: hasCriticalAlerts || telegramMessage.length > 0,
        message: hasCriticalAlerts ? analysisData.critical_alerts : telegramMessage,
        isUrgent: hasCriticalAlerts
      };
    } catch (error) {
      Logger.log(`❌ Error deciding notification: ${error.toString()}`);
      return {
        shouldNotify: false,
        message: "",
        isUrgent: false
      };
    }
  },

  /**
   * Makes all decisions based on the analysis data
   * @param {string} geminiResponse - The raw response from Gemini API
   * @returns {Object} All decisions
   */
  makeDecisions: function (geminiResponse) {
    // Parse the Gemini response
    const parsedData = this.parseGeminiResponse(geminiResponse);

    // Make decisions
    const lightingDecision = this.decideLightingAdjustments(parsedData);
    const aerationDecision = this.decideAerationAdjustments(parsedData);
    const notificationDecision = this.decideNotification(parsedData);

    return {
      parsedData,
      lighting: lightingDecision,
      aeration: aerationDecision,
      notification: notificationDecision
    };
  },

  /**
   * Executes the decisions by controlling devices and sending notifications
   * @param {Object} decisions - The decisions to execute
   * @returns {boolean} True if successful, false otherwise
   */
  executeDecisions: function (decisions) {
    try {
      let success = true;

      // Execute lighting decision
      if (decisions.lighting && decisions.lighting.shouldBeOn !== null) {
        Logger.log(`📤 Executing lighting decision: ${decisions.lighting.shouldBeOn ? "ON" : "OFF"} (${decisions.lighting.reason})`);

        const lightingResult = decisions.lighting.shouldBeOn
          ? SinricService.turnOnDevice(CONFIG.SINRIC.DEVICES.GROW_LIGHT)
          : SinricService.turnOffDevice(CONFIG.SINRIC.DEVICES.GROW_LIGHT);

        if (!lightingResult) {
          Logger.log(`⚠️ Failed to execute lighting decision.`);
          success = false;
        }
      }

      // Execute aeration decision
      if (decisions.aeration && decisions.aeration.shouldBeOn !== null) {
        Logger.log(`📤 Executing aeration decision: ${decisions.aeration.shouldBeOn ? "ON" : "OFF"} (${decisions.aeration.reason})`);

        const aerationResult = decisions.aeration.shouldBeOn
          ? SinricService.turnOnDevice(CONFIG.SINRIC.DEVICES.AERATOR)
          : SinricService.turnOffDevice(CONFIG.SINRIC.DEVICES.AERATOR);

        if (!aerationResult) {
          Logger.log(`⚠️ Failed to execute aeration decision.`);
          success = false;
        }
      }

      // Execute notification decision
      if (decisions.notification && decisions.notification.shouldNotify) {
        Logger.log(`📤 Executing notification decision: ${decisions.notification.isUrgent ? "URGENT" : "NORMAL"}`);

        const prefix = decisions.notification.isUrgent ? "🚨 URGENT: " : "";
        const message = `${prefix}${decisions.notification.message}`;

        TelegramService.sendMessage(message);
      }

      return success;
    } catch (error) {
      Logger.log(`❌ Error executing decisions: ${error.toString()}`);
      return false;
    }
  },

  /**
   * Evaluates the effectiveness of previous decisions
   * @param {Object} currentAnalysis - Current plant analysis
   * @param {Object} historicalData - Historical data including previous decisions
   * @returns {Object} Evaluation of decision effectiveness
   */
  evaluatePreviousDecisions: function(currentAnalysis, historicalData) {
    try {
      // Get the reflection sheet
      const reflectionSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.REFLECTION_NAME);
      if (!reflectionSheet || reflectionSheet.getLastRow() < 2) {
        return { effectiveness: "unknown", learnings: [] };
      }
      
      // Get the last decision made
      const lastRow = reflectionSheet.getLastRow();
      const lastDecision = reflectionSheet.getRange(lastRow, 1, 1, 4).getValues()[0];
      
      // Parse the decision data
      const lastDecisionDate = lastDecision[0];
      const lastAnalysisSummary = JSON.parse(lastDecision[1]);
      const lastDecisionsMade = JSON.parse(lastDecision[2]);
      
      // Compare with current state to evaluate effectiveness
      const currentHealth = currentAnalysis.plant_health || "";
      const healthImproved = currentHealth.toLowerCase().includes("good") || 
                            currentHealth.toLowerCase().includes("healthy") ||
                            currentHealth.toLowerCase().includes("improving");
      
      // Determine if decisions were effective
      const effectiveness = healthImproved ? "positive" : "negative";
      
      // Extract learnings
      const learnings = [];
      if (lastDecisionsMade.lighting && lastDecisionsMade.lighting.isOverride) {
        learnings.push({
          decision: "lighting",
          action: lastDecisionsMade.lighting.shouldBeOn ? "increased" : "decreased",
          outcome: healthImproved ? "beneficial" : "detrimental"
        });
      }
      
      if (lastDecisionsMade.aeration && lastDecisionsMade.aeration.isOverride) {
        learnings.push({
          decision: "aeration",
          action: lastDecisionsMade.aeration.shouldBeOn ? "increased" : "decreased",
          outcome: healthImproved ? "beneficial" : "detrimental"
        });
      }
      
      // Update the reflection with outcomes
      reflectionSheet.getRange(lastRow, 4).setValue(
        healthImproved ? "Positive outcome - plant health improved" : "Negative outcome - plant health did not improve"
      );
      
      return { effectiveness, learnings };
    } catch (error) {
      Logger.log(`❌ Error evaluating previous decisions: ${error.toString()}`);
      return { effectiveness: "unknown", learnings: [] };
    }
  },

  /**
   * Applies reinforcement learning to improve decision making
   * @param {Object} decisions - Current decisions
   * @param {Object} evaluation - Evaluation of previous decisions
   * @returns {Object} Refined decisions
   */
  refineDecisionsWithLearning: function(decisions, evaluation) {
    try {
      // If we don't have meaningful evaluation data, return original decisions
      if (evaluation.effectiveness === "unknown" || evaluation.learnings.length === 0) {
        return decisions;
      }
      
      // Clone the decisions object to avoid modifying the original
      const refinedDecisions = JSON.parse(JSON.stringify(decisions));
      
      // Apply learnings to current decisions
      evaluation.learnings.forEach(learning => {
        if (learning.decision === "lighting" && refinedDecisions.lighting) {
          // If previous similar decision had negative outcome, consider reversing
          if (learning.outcome === "detrimental" && 
              refinedDecisions.lighting.isOverride &&
              refinedDecisions.lighting.shouldBeOn === (learning.action === "increased")) {
            
            // Reverse the decision with caution
            refinedDecisions.lighting.shouldBeOn = !refinedDecisions.lighting.shouldBeOn;
            refinedDecisions.lighting.reason += " (Adjusted based on learning from previous outcomes)";
          }
        }
        
        if (learning.decision === "aeration" && refinedDecisions.aeration) {
          // Similar logic for aeration
          if (learning.outcome === "detrimental" && 
              refinedDecisions.aeration.isOverride &&
              refinedDecisions.aeration.shouldBeOn === (learning.action === "increased")) {
            
            refinedDecisions.aeration.shouldBeOn = !refinedDecisions.aeration.shouldBeOn;
            refinedDecisions.aeration.reason += " (Adjusted based on learning from previous outcomes)";
          }
        }
      });
      
      return refinedDecisions;
    } catch (error) {
      Logger.log(`❌ Error refining decisions with learning: ${error.toString()}`);
      return decisions; // Return original decisions if error
    }
  }
}; 