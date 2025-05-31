// =================================================================================
// NOTIFICATION SERVICE
// =================================================================================

// SERVICE NAMES
const SPREADSHEET_SERVICE = 'Spreadsheet Service';
const DRIVE_SERVICE = 'Drive Service';
const SINRIC_SERVICE = 'SinricPro API Service';
const IMAGE_SEARCH_SERVICE = 'Image Search Service';
const DEVICE_CONTROL_SERVICE = 'Device Control Service';
const TELEGRAM_SERVICE = 'Telegram Service';
const GEMINI_SERVICE = 'Gemini Service';
const MAIN_FLOW = 'Main Flow';

const NotificationService = {
  // DRIVE SERVICE ERRORS
  imageNotFound: (imageName) => NotificationService._send(DRIVE_SERVICE, `Image not found: ${imageName}`),
  imageNoName: () => NotificationService._send(DRIVE_SERVICE, `No image name provided`),
  imageEmpty: (imageName) => NotificationService._send(DRIVE_SERVICE, `The image is empty or corrupted: ${imageName}`),
  imageConversionFailed: (imageName) => NotificationService._send(DRIVE_SERVICE, `Failed to convert image to Base64: ${imageName}`),
  imageFindingError: (imageName) => NotificationService._send(DRIVE_SERVICE, `Error finding image ${imageName}`),
  imageProcessingError: (imageName, error) => NotificationService._send(DRIVE_SERVICE, `Error processing image ${imageName}: ${error}`),
  prdNotFound: (prdName) => NotificationService._send(DRIVE_SERVICE, `PRD document not found: ${prdName}`),
  prdErrorGetting: (error) => NotificationService._send(DRIVE_SERVICE, `Error getting PRD document: ${error}`),
  
  // SINRIC SERVICE ERRORS  
  sinricAuthFailed: (statusCode) => NotificationService._send(SINRIC_SERVICE, `Authentication failed with status ${statusCode}`),
  sinricNoToken: () => NotificationService._send(SINRIC_SERVICE, `No accessToken received from SinricPro`),
  sinricDevicesFailed: (statusCode) => NotificationService._send(SINRIC_SERVICE, `Devices API failed with status ${statusCode}`),
  sinricError: (error) => NotificationService._send(SINRIC_SERVICE, `SinricPro service error: ${error}`),
  sinricNoDevices: () => NotificationService._send(SINRIC_SERVICE, `No devices found in SinricPro`),
  sinricDeviceNotFound: (deviceId) => NotificationService._send(SINRIC_SERVICE, `Device not found: ${deviceId}`),
  
  // INTERACTOR ERRORS
  sheetNotFound: (sheetName) => NotificationService._send(IMAGE_SEARCH_SERVICE, `Sheet not found: ${sheetName}`),
  imageDataFailed: (imageName) => NotificationService._send(IMAGE_SEARCH_SERVICE, `Failed to get image data for: ${imageName}`),
  imageSearchFailed: (error) => NotificationService._send(IMAGE_SEARCH_SERVICE, `Image search failed: ${error}`),
  deviceControlFailed: (error) => NotificationService._send(DEVICE_CONTROL_SERVICE, `Device control failed: ${error}`),
  
  // SPREADSHEET SERVICE ERRORS
  spreadsheetNotFound: (sheetName) => NotificationService._send(SPREADSHEET_SERVICE, `Sheet not found: ${sheetName}`),
  logDataFailed: (sheetName) => NotificationService._send(SPREADSHEET_SERVICE, `Failed to log data to ${sheetName}`),
  logDevicesFailed: (error) => NotificationService._send(SPREADSHEET_SERVICE, `Failed to log devices data: ${error}`),
  summaryIsNull: () => NotificationService._send(SPREADSHEET_SERVICE, `Cannot log Gemini analysis: summary is null or undefined`),
  logAnalysisFailed: (error) => NotificationService._send(SPREADSHEET_SERVICE, `Failed to log image analysis: ${error}`),
  
  // TELEGRAM SERVICE ERRORS
  telegramApiFailed: (statusCode, response) => NotificationService._send(TELEGRAM_SERVICE, `Telegram API failed with status ${statusCode}: ${response}`),
  telegramError: (error) => NotificationService._send(TELEGRAM_SERVICE, `Telegram service error: ${error}`),
  
  // GEMINI SERVICE ERRORS
  geminiMissingData: (imageName) => NotificationService._send(GEMINI_SERVICE, `Missing critical image details for analysis: ${imageName}`),
  geminiNoApiKey: () => NotificationService._send(GEMINI_SERVICE, `GEMINI_API_KEY not found`),
  geminiJsonError: (error) => NotificationService._send(GEMINI_SERVICE, `Error parsing Gemini JSON response: ${error}`),
  geminiApiFailed: (statusCode) => NotificationService._send(GEMINI_SERVICE, `Gemini API Error (${statusCode})`),
  geminiNetworkError: (error) => NotificationService._send(GEMINI_SERVICE, `Network error calling Gemini API: ${error}`),
  geminiSummaryExtractionError: () => NotificationService._send(GEMINI_SERVICE, `Error extracting SUMMARY_FOR_SHEET from Gemini's response.`),
  
  // MAIN FLOW ERRORS
  mainFlowFailed: (error) => NotificationService._send(MAIN_FLOW, `Main flow execution failed: ${error}`),

  // INTERNAL METHOD
  _send: function(serviceName, errorMessage) {
    try {
      const message = `🚨 *${serviceName} Error*\n\n${errorMessage}`;
      TelegramService.sendMessage(message);
      Logger.log(`🚨 ERROR NOTIFICATION SENT: ${serviceName} - ${errorMessage}`);
      return true;
    } catch (notificationError) {
      Logger.log(`❌ Failed to send error notification: ${notificationError.toString()}`);
      return false;
    }
  }
}; 



