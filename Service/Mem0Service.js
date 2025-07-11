// =================================================================================
// MEM0 SERVICE
// =================================================================================

/**
 * Service for integrating with Mem0 cloud API for intelligent memory management
 * Replaces the basic MemoryService with cloud-based semantic memory
 */
const Mem0Service = {
  
  /**
   * Mem0 API configuration
   */
  API_BASE_URL: 'https://api.mem0.ai/v1',
  USER_ID: 'philodendron_lemon_lime', // Unique identifier for our plant
  
  /**
   * Gets the Mem0 API key from secure properties
   * @returns {string} API key
   */
  getApiKey: function() {
    return PropertiesService.getScriptProperties().getProperty('MEM0_API_KEY');
  },
  
  /**
   * Adds a new memory to Mem0 cloud storage
   * @param {string} content - The memory content to store
   * @param {string} role - The role (user/assistant) for the memory
   * @returns {Object} Response from Mem0 API
   */
  addMemory: function(content, role = 'user') {
    try {
      Logger.log(`🧠 Adding memory to Mem0: ${content.substring(0, 100)}...`);
      
      const payload = {
        messages: [{
          role: role,
          content: content
        }],
        user_id: this.USER_ID
      };
      
      const apiKey = this.getApiKey();
      if (!apiKey) {
        Logger.log('❌ Error: MEM0_API_KEY not found in properties');
        return {
          success: false,
          error: 'MEM0_API_KEY not found in properties'
        };
      }
      
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload)
      };
      
      const response = UrlFetchApp.fetch(`${this.API_BASE_URL}/memories/`, options);
      const responseData = JSON.parse(response.getContentText());
      
      if (response.getResponseCode() === 201 || response.getResponseCode() === 200) {
        Logger.log(`✅ Memory added successfully: ${responseData.id}`);
        return {
          success: true,
          id: responseData.id,
          memory: responseData.memory,
          data: responseData
        };
      } else {
        Logger.log(`❌ Error adding memory: ${response.getResponseCode()} - ${response.getContentText()}`);
        return {
          success: false,
          error: `HTTP ${response.getResponseCode()}: ${response.getContentText()}`
        };
      }
      
    } catch (error) {
      Logger.log(`❌ Exception adding memory: ${error.toString()}`);
      return {
        success: false,
        error: error.toString()
      };
    }
  },
  
  /**
   * Searches for relevant memories in Mem0 cloud storage
   * @param {string} query - Search query for retrieving relevant memories
   * @param {number} limit - Maximum number of memories to retrieve (default: 5)
   * @returns {Object} Relevant memories from Mem0 API
   */
  searchMemory: function(query, limit = 5) {
    try {
      Logger.log(`🔍 Searching Mem0 for: ${query}`);
      
      const payload = {
        query: query,
        user_id: this.USER_ID,
        limit: limit
      };
      
      const apiKey = this.getApiKey();
      if (!apiKey) {
        Logger.log('❌ Error: MEM0_API_KEY not found in properties');
        return {
          success: false,
          error: 'MEM0_API_KEY not found in properties',
          memories: [],
          count: 0
        };
      }
      
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload)
      };
      
      const response = UrlFetchApp.fetch(`${this.API_BASE_URL}/memories/search/`, options);
      const responseData = JSON.parse(response.getContentText());
      
      if (response.getResponseCode() === 200) {
        Logger.log(`✅ Found ${responseData.results ? responseData.results.length : 0} relevant memories`);
        return {
          success: true,
          memories: responseData.results || [],
          count: responseData.results ? responseData.results.length : 0
        };
      } else {
        Logger.log(`❌ Error searching memories: ${response.getResponseCode()} - ${response.getContentText()}`);
        return {
          success: false,
          error: `HTTP ${response.getResponseCode()}: ${response.getContentText()}`,
          memories: [],
          count: 0
        };
      }
      
    } catch (error) {
      Logger.log(`❌ Exception searching memories: ${error.toString()}`);
      return {
        success: false,
        error: error.toString(),
        memories: [],
        count: 0
      };
    }
  },
  
  /**
   * Retrieves all memories for the plant (with optional filtering)
   * @param {number} limit - Maximum number of memories to retrieve
   * @returns {Object} All memories from Mem0 API
   */
  getAllMemories: function(limit = 10) {
    try {
      Logger.log(`📚 Retrieving all memories (limit: ${limit})`);
      
      const apiKey = this.getApiKey();
      if (!apiKey) {
        Logger.log('❌ Error: MEM0_API_KEY not found in properties');
        return {
          success: false,
          error: 'MEM0_API_KEY not found in properties',
          memories: [],
          count: 0
        };
      }
      
      const options = {
        method: 'GET',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = UrlFetchApp.fetch(
        `${this.API_BASE_URL}/memories/?user_id=${this.USER_ID}&limit=${limit}`, 
        options
      );
      const responseData = JSON.parse(response.getContentText());
      
      if (response.getResponseCode() === 200) {
        Logger.log(`✅ Retrieved ${responseData.results ? responseData.results.length : 0} memories`);
        return {
          success: true,
          memories: responseData.results || [],
          count: responseData.results ? responseData.results.length : 0
        };
      } else {
        Logger.log(`❌ Error retrieving memories: ${response.getResponseCode()} - ${response.getContentText()}`);
        return {
          success: false,
          error: `HTTP ${response.getResponseCode()}: ${response.getContentText()}`,
          memories: [],
          count: 0
        };
      }
      
    } catch (error) {
      Logger.log(`❌ Exception retrieving memories: ${error.toString()}`);
      return {
        success: false,
        error: error.toString(),
        memories: [],
        count: 0
      };
    }
  },
  
  /**
   * Formats plant analysis data for storage in Mem0
   * @param {Object} analysisResult - Gemini analysis result
   * @param {Object} environmentData - Current environmental conditions
   * @returns {string} Formatted content for memory storage
   */
  formatPlantMemory: function(analysisResult, environmentData) {
    const timestamp = new Date().toISOString();
    const date = new Date();
    const summary = analysisResult.summary_for_sheet || {};
    
    // Add seasonal and temporal context
    const season = this.getCurrentSeason();
    const timeOfDay = this.getTimeOfDay();
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    const memoryContent = `
PLANT ANALYSIS MEMORY - ${date.toLocaleDateString()} ${timeOfDay}
Date: ${timestamp}
Season: ${season} | Day: ${dayOfWeek} | Time: ${timeOfDay}

=== HEALTH ASSESSMENT ===
Overall Health: ${summary.health_diagnosis || 'Unknown'}
Leaf Condition: ${summary.leaf_status || 'Unknown'}
Stem Status: ${summary.stem_condition || 'Unknown'}
Growth Observations: ${summary.growth_notes || 'No notes'}

=== VISUAL ANALYSIS ===
Plant Appearance: ${summary.visual_description || 'No description available'}

=== ENVIRONMENTAL CONDITIONS ===
Temperature: ${environmentData.temperature || 'N/A'}°C
Humidity: ${environmentData.humidity || 'N/A'}%
Season Context: ${season}
Time Context: ${timeOfDay}

=== AI RECOMMENDATIONS ===
Recommended Action: ${summary.recommended_action || 'No specific recommendation'}
Reasoning: ${summary.reasoning || 'No reasoning provided'}

=== PLANT PERSONA & COMMUNICATION ===
Emotional State: ${summary.plant_persona_feeling || 'Unknown'}
Expressed Needs: ${summary.plant_persona_needs || 'No specific needs expressed'}
Concerns: ${summary.plant_persona_concerns || 'No concerns noted'}

=== CONTEXT TAGS ===
health_status:${summary.health_diagnosis || 'unknown'} temperature:${environmentData.temperature || 'unknown'} humidity:${environmentData.humidity || 'unknown'} season:${season} time:${timeOfDay} action_taken:${summary.recommended_action ? 'yes' : 'no'}
    `.trim();
    
    return memoryContent;
  },
  
  /**
   * Helper function to determine current season
   * @returns {string} Current season
   */
  getCurrentSeason: function() {
    const now = new Date();
    const month = now.getMonth() + 1; // getMonth() returns 0-11
    
    // Southern Hemisphere seasons (Argentina)
    if (month >= 12 || month <= 2) return 'summer';
    if (month >= 3 && month <= 5) return 'autumn';
    if (month >= 6 && month <= 8) return 'winter';
    if (month >= 9 && month <= 11) return 'spring';
    
    return 'unknown';
  },
  
  /**
   * Helper function to determine time of day
   * @returns {string} Time of day
   */
  getTimeOfDay: function() {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  },
  
  /**
   * Generates search query for retrieving relevant historical context
   * @param {Object} currentConditions - Current plant and environmental conditions
   * @returns {string} Search query for Mem0
   */
  generateSearchQuery: function(currentConditions) {
    const queryParts = [];
    
    // Temperature-based queries with ranges
    if (currentConditions.temperature) {
      const temp = parseFloat(currentConditions.temperature);
      if (!isNaN(temp)) {
        // Create temperature range queries for better context matching
        if (temp < 18) {
          queryParts.push('cold temperature low temperature below 18');
        } else if (temp > 25) {
          queryParts.push('warm temperature high temperature above 25');
        } else {
          queryParts.push('optimal temperature moderate temperature 18-25');
        }
        queryParts.push(`temperature ${Math.round(temp)}`);
      }
    }
    
    // Humidity-based queries with ranges
    if (currentConditions.humidity) {
      const humidity = parseFloat(currentConditions.humidity);
      if (!isNaN(humidity)) {
        if (humidity < 40) {
          queryParts.push('low humidity dry conditions below 40');
        } else if (humidity > 70) {
          queryParts.push('high humidity humid conditions above 70');
        } else {
          queryParts.push('optimal humidity moderate humidity 40-70');
        }
        queryParts.push(`humidity ${Math.round(humidity)}`);
      }
    }
    
    // Seasonal context
    if (currentConditions.season) {
      queryParts.push(`season ${currentConditions.season}`);
      
      // Add season-specific care keywords
      switch(currentConditions.season) {
        case 'summer':
          queryParts.push('summer care hot weather watering frequency');
          break;
        case 'winter':
          queryParts.push('winter care cold weather reduced watering');
          break;
        case 'spring':
          queryParts.push('spring growth new leaves active growth');
          break;
        case 'autumn':
          queryParts.push('autumn care slower growth preparation');
          break;
      }
    }
    
    // Time of day context
    const timeOfDay = this.getTimeOfDay();
    queryParts.push(`${timeOfDay} analysis`);
    
    // Add general plant health and care keywords
    queryParts.push('plant health analysis recommendation care philodendron lemon lime');
    
    return queryParts.join(' ');
  },
  
  /**
   * Creates a contextual summary from retrieved memories for AI analysis
   * @param {Array} memories - Array of memories from Mem0
   * @returns {string} Formatted context summary
   */
  createContextSummary: function(memories) {
    if (!memories || memories.length === 0) {
      return 'No relevant historical context available.';
    }
    
    let contextSummary = `RELEVANT HISTORICAL CONTEXT (${memories.length} memories):\n\n`;
    
    memories.forEach((memory, index) => {
      contextSummary += `${index + 1}. ${memory.memory}\n`;
      if (memory.score) {
        contextSummary += `   (Relevance: ${(memory.score * 100).toFixed(1)}%)\n`;
      }
      contextSummary += '\n';
    });
    
    return contextSummary;
  },
  
  /**
   * Test function to verify Mem0 connectivity
   * @returns {Object} Test results
   */
  testConnection: function() {
    try {
      Logger.log('🧪 Testing Mem0 connection...');
      
      const testMemory = `Test connection at ${new Date().toISOString()}`;
      const addResult = this.addMemory(testMemory, 'system');
      
      if (addResult.success) {
        const searchResult = this.searchMemory('test connection');
        
        return {
          success: true,
          message: 'Mem0 connection successful',
          addMemory: addResult.success,
          searchMemory: searchResult.success,
          memoriesFound: searchResult.count
        };
      } else {
        return {
          success: false,
          message: 'Failed to add test memory',
          error: addResult.error
        };
      }
      
    } catch (error) {
      return {
        success: false,
        message: 'Connection test failed',
        error: error.toString()
      };
    }
  }
};