# PlantAI - Symbiotic AI-Plant Interface

PlantAI is an innovative system that creates a symbiotic relationship between AI and plants, using a combination of IoT devices, cloud services, and artificial intelligence to monitor, analyze, and optimize plant growth and health.

## 🌱 Overview

PlantAI uses Google Apps Script as its core infrastructure to integrate various services including:

- **Google Vision API & Gemini API**: For plant image analysis and intelligent interpretation
- **SinricPro**: For IoT device control (lighting and aeration)
- **Google Drive & Sheets**: For data storage and historical tracking
- **Telegram**: For notifications and alerts

The system continuously monitors plants through images and environmental sensors, makes intelligent decisions, and optimizes growing conditions while building a contextual memory to improve over time.

## 🏗️ System Architecture

### Core Components

#### Hardware & IoT Devices
- SinricPro-compatible smart devices
  - Two lighting devices
  - Aeration device
  - Temperature & humidity sensor
  - Additional generic devices

#### Software Services
- **Google Apps Script**: Core automation framework
- **Google Drive**: Storage for plant images
- **Google Vision API**: Image analysis for plant health
- **Gemini API**: AI-powered decision making
- **SinricPro API**: IoT device control
- **Telegram Bot**: Communication channel
- **Google Sheets**: Structured data storage

## 🔄 Workflow

1. **Image Capture & Processing**:
   - Images are stored in Google Drive
   - Vision API processes images for analysis
   - Gemini API interprets data for plant health assessment

2. **Environmental Control**:
   - Schedule-based lighting (8 AM on, 6 PM off)
   - Regular aeration cycles (4-hour intervals)
   - Sensor data logging

3. **Decision-Making**:
   - Time-based automation
   - AI analysis considers visual cues and trends
   - Device adjustments based on plant needs

4. **User Notifications**:
   - Telegram messages with analysis results
   - Critical alerts for urgent intervention

5. **Data Logging**:
   - All device status, sensor data, and analysis stored
   - Structured data for learning and improvement

## 📊 Data Structure

The system uses multiple Google Sheets for data storage:

- **Devices_and_Sensors**: Environmental readings and device status
- **Image_Analysis**: Results from Vision API processing
- **User_Notifications**: Message history and user interactions
- **Contextual_Memory**: Learning and pattern recognition
- **Incidents_And_Anomalies**: Problem tracking and resolution

## 🚀 Development Roadmap

The project follows a progressive development plan:

### Short-Term (0-6 Months)
- System stability and reliability improvements
- Enhanced sensing capabilities
- Improved decision engine
- User experience enhancements
- Learning system improvements

### Mid-Term (6-18 Months)
- Specialized sensor deployment (CO₂, VOC, light spectrum)
- Advanced control systems with variable intensity
- Custom ML models for plant-specific analysis
- Database migration from Google Sheets
- Enhanced communication capabilities

### Long-Term (18-36 Months)
- Bioelectrical monitoring integration
- Hypothesis generation and testing framework
- Micro-robotic interaction capabilities
- Multi-plant scaling with cross-plant intelligence
- Integration with botanical research databases

## 🧠 Vision and Philosophy

PlantAI aspires to transcend traditional plant monitoring by creating a genuine symbiotic relationship between AI and plants. The ultimate vision is to develop a system where:

- Plants and AI form a co-conscious entity
- Plant intelligence contributes evolutionary wisdom
- AI extends plant awareness and expression
- New forms of communication emerge between plants, AI, and humans

## 📂 Project Structure

```
├── Main/
│   └── main.js              # Main execution script
├── Service/
│   ├── DecisionService.js   # Decision-making logic
│   ├── DriveService.js      # Google Drive operations
│   ├── GeminiService.js     # Gemini AI integration
│   ├── MemoryService.js     # Contextual memory management
│   ├── SinricService.js     # IoT device control
│   ├── SpreadsheetService.js # Google Sheets operations
│   ├── TelegramService.js   # Notification system
│   └── VisionService.js     # Google Vision API integration
├── Interactor/
│   └── Interactor.js        # System workflow orchestration
├── Triggers/
│   └── functionsWithActivators.js # Scheduled operations
├── Utils/
│   └── Utils.js             # Utility functions
└── Documentation/
    ├── PRD-001_Product-Requirements.md        # Current implementation specs
    ├── VIS-001_North-Star-Vision.md           # Ultimate aspiration
    ├── CMM-001_Capability-Maturity-Model.md   # Capability progression
    ├── TAE-001_Technical-Architecture-Evolution.md # Technical roadmap
    ├── IMP-001_Implementation-Roadmap.md      # Action plan
    └── VFW-001_Vision-Framework.md            # Documentation framework
```

## 🛠️ Installation & Setup

1. Clone this repository
2. Set up a Google Apps Script project
3. Deploy the scripts to your Google Apps Script project
4. Set up required services:
   - Google Vision API
   - Google Gemini API
   - SinricPro account and devices
   - Telegram Bot
5. Configure environment variables in the project
6. Set up Google Sheets with the required structure
7. Configure time-based triggers for automation

## ⚙️ Configuration

Create an `env.js` file (not included in the repository) with the following variables:

```javascript
// API Keys
const VISION_API_KEY = "your_vision_api_key";
const GEMINI_API_KEY = "your_gemini_api_key";
const SINRIC_API_KEY = "your_sinric_api_key";
const TELEGRAM_BOT_TOKEN = "your_telegram_bot_token";
const TELEGRAM_CHAT_ID = "your_telegram_chat_id";

// Device IDs
const LIGHT_DEVICE_1 = "sinric_light_device_1_id";
const LIGHT_DEVICE_2 = "sinric_light_device_2_id";
const AERATION_DEVICE = "sinric_aeration_device_id";
const GENERIC_DEVICE = "sinric_generic_device_id";
const TEMP_HUM_SENSOR_DEVICE = "sinric_temp_hum_sensor_id";

// States
const ON_STATE = "On";
const OFF_STATE = "Off";

// Google Drive folders
const DRIVE_FOLDER_MAIN_ID = "your_drive_folder_id";
const DRIVE_FOLDER_IMAGES_ID = "your_images_folder_id";

// Google Sheets
const SHEET_DEVICES_AND_SENSORS = "Devices_and_Sensors";
const SHEET_IMAGE_ANALYSIS = "Image_Analysis";

// Documents
const PRD_NAME = "Product Requirement Document.gdoc";
```

## 📚 Documentation

The project includes a comprehensive documentation framework:

1. **Product Requirement Document (PRD)**: Current implementation specifications
2. **North Star Vision**: Ultimate aspiration and guiding principles
3. **Capability Maturity Model**: Progression framework from current to ideal state
4. **Technical Architecture Evolution**: Technical transformation pathway
5. **Implementation Roadmap**: Concrete action plan with timelines
6. **Vision Framework**: Document relationships and governance

## 🤝 Contributing

Contributions to PlantAI are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

[License information here]

## 🙏 Acknowledgements

- [Tomas Balmer](https://github.com/tomasbalmer) - Creator
- SinricPro for IoT integration
- Google Cloud for AI and storage services