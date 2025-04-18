# Product Requirement Document (PRD): Symbiotic AI-Plant Interface

## 1. Overview

### 1.1 Project Objective
The goal of this project is to develop a symbiotic interface between an AI system and a set of plants, starting with a single plant and scaling to 5-10 over time. The AI monitors, learns, and adapts to its relationship with the plants, making autonomous decisions to optimize growth based on sensor data and image analysis. It develops a contextual memory system that integrates visual and environmental data, enabling it to refine its strategies and improve plant health over time.

### 1.2 High-Level Functionality
- Automated monitoring and control of environmental variables (lighting and aeration)
- Image-based analysis of plant health using Google Vision API and Gemini AI
- Decision-making based on data analysis and schedules
- Interaction with users through Telegram notifications
- Historical data logging in Google Sheets for continuous improvement

## 2. System Architecture

### 2.1 Core Components

#### Hardware & IoT Devices
- **SinricPro Smart Devices**: Controls lighting and aeration for plants
  - Two lighting devices for plant illumination
  - Aeration device for root oxygenation
  - Temperature & humidity sensor
  - Additional generic smart device

#### Software & Services
- **Google Apps Script**: Core application framework for automation and integration
- **Google Drive**: Storage system for plant images
- **Google Vision API**: Image analysis for label detection and color classification
- **Gemini API**: AI-powered interpretation and decision-making for plant health
- **SinricPro API**: IoT device control for environmental adjustments
- **Telegram Bot**: Communication channel for notifications and alerts
- **Google Sheets**: Data storage with defined structures for:
  - Device and sensor data
  - Image analysis results
  - User notifications
  - Contextual memory
  - Incidents and anomalies

### 2.2 User Interaction
- **Telegram Bot**: AI communicates with the user, providing insights, alerts, and suggestions
- **Google Sheets**: Stores and tracks AI logs, sensor readings, and decision-making history

## 3. Workflow & Data Flow

### 3.1 Process Flow
1. **Image Capture & Processing**: 
   - Regular image storage in Google Drive
   - Google Apps Script detects new images
   - Vision API processes images for object detection and color analysis
   - Gemini API interprets data for plant health assessment

2. **Environmental Control**:
   - Schedule-based activation and deactivation of lights (8 AM on, 6 PM off)
   - Regular aeration cycles (4-hour intervals)
   - Sensor data logging and monitoring

3. **Decision-Making**:
   - Scheduled automation based on time of day
   - AI analysis considers visual cues and historical data
   - Device adjustments based on plant needs

4. **User Notifications**:
   - Telegram messages with analysis results
   - Critical alerts for urgent intervention needs

5. **Data Logging**:
   - All device status, sensor data, and analysis results stored in Google Sheets
   - Structured data storage for future reference and learning

## 4. Functional Requirements

### 4.1 Environmental Control System
- **Lighting Management**:
  - Automated on/off schedule (8 AM to 6 PM)
  - Two separate lighting devices for redundancy

- **Aeration System**:
  - Scheduled aeration cycles at 8 AM, 12 PM, 4 PM, and 8 PM
  - One hour duration per cycle

- **Sensor Monitoring**:
  - Temperature and humidity tracking
  - Data logging every 6 hours

### 4.2 Image Analysis System
- **Google Drive Integration**:
  - Automatic detection of new images
  - Size optimization for processing

- **Vision API Analysis**:
  - Plant identification through label detection
  - Color analysis for health indicators
  - Object localization

- **Gemini API Interpretation**:
  - Comprehensive health assessment
  - Growth trend analysis
  - Actionable recommendations

### 4.3 Decision System
- **Schedule-Based Automation**:
  - Time-triggered device control
  - Regular cycles for consistency

- **AI-Driven Adjustments**:
  - Analysis-based recommendations
  - Critical alert generation

- **Memory-Based Learning**:
  - Historical data consideration
  - Trend analysis for improved decisions

### 4.4 Communication System
- **Telegram Notifications**:
  - Analysis results sharing
  - Critical alerts for urgent issues
  - Weekly summaries

- **Google Sheets Reporting**:
  - Structured data storage
  - Historical tracking
  - Performance metrics

## 5. Data Storage Structure

### 5.1 Google Sheets Structure
- **Devices_and_Sensors Sheet**:
  - Timestamp, Temperature, Humidity
  - Light1 Status, Light2 Status
  - Aeration Status, Generic Device Status
  - Comments/Alerts

- **Image_Analysis Sheet**:
  - Timestamp, Image Name
  - Plant Identification, Labels
  - Dominant Color, Pixel Fraction
  - Crop Confidence

- **User_Notifications Sheet**:
  - Timestamp, Notification Type
  - Message Content
  - User Response, Follow-up Actions

- **Contextual_Memory Sheet**:
  - Historical data summaries
  - Pattern recognition
  - Learning outcomes

- **Incidents_And_Anomalies Sheet**:
  - Problem tracking
  - Resolution steps
  - Preventive measures

## 6. Integration APIs

### 6.1 Google Vision API
- Label detection for plant identification
- Color analysis for health assessment
- Object localization for growth tracking

### 6.2 Gemini API
- Context-aware analysis using:
  - Vision API results
  - Historical data
  - Product requirement guidelines
- Structured response format with:
  - Plant health assessment
  - Growth trends
  - Action recommendations
  - Telegram-ready messages

### 6.3 SinricPro API
- Device status monitoring
- Power state control
- Environmental data collection
- Authentication and secure access

### 6.4 Telegram API
- User notification delivery
- Format-rich messaging
- Alert prioritization

## 7. Schedule & Execution

### 7.1 Time-Based Operations
- **Hourly Operations**:
  - Environmental status checks
  - Notification assessment

- **Daily Operations**:
  - Lighting cycle (8 AM - 6 PM)
  - Aeration cycles (4 times daily)
  - Memory consolidation

- **Weekly Operations**:
  - Performance review
  - Report generation
  - System maintenance

## 8. Future Enhancements

### 8.1 AI Model Evolution
- Advanced pattern recognition
- Predictive maintenance
- Self-optimizing schedules

### 8.2 Hardware Expansion
- Additional sensor types
- Multiple growing zones
- Climate control integration

### 8.3 User Interface
- Web dashboard development
- Mobile application
- Voice assistant integration

## 9. Conclusion
This system creates a self-sustaining, AI-driven plant management environment that continuously learns and adapts. By integrating image analysis, environmental control, and user communication, it optimizes plant growth with minimal human intervention while building intelligence through data collection and analysis.