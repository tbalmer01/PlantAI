// =================================================================================
// SINRIC SERVICE
// =================================================================================

const SinricProService = {
  getSinricDevices: function () {
    try {
      const authResponse = UrlFetchApp.fetch('https://api.sinric.pro/api/v1/auth', {
        method: 'post',
        headers: {
          'x-sinric-api-key': PropertiesService.getScriptProperties().getProperty('SINRIC_API_KEY'),
          'Content-Type': 'application/json',
        },
        muteHttpExceptions: true,
      });

      const authCode = authResponse.getResponseCode();
      if (authCode !== 200) {
        Logger.log(`❌ Error authenticating: ${authResponse.getContentText()}`);
        NotificationService.sinricAuthFailed(authCode);
        return [];
      }

      const { accessToken } = JSON.parse(authResponse.getContentText());
      if (!accessToken) {
        Logger.log(`❌ No accessToken received.`);
        NotificationService.sinricNoToken();
        return [];
      }

      const devicesResponse = UrlFetchApp.fetch('https://api.sinric.pro/api/v1/devices', {
        method: 'get',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        muteHttpExceptions: true,
      });

      const devicesCode = devicesResponse.getResponseCode();
      if (devicesCode !== 200) {
        Logger.log(`❌ Error getting devices: ${devicesResponse.getContentText()}`);
        NotificationService.sinricDevicesFailed(devicesCode);
        return [];
      }

      const { devices } = JSON.parse(devicesResponse.getContentText());
      if (!devices || devices.length === 0) {
        Logger.log(`❌ No devices found.`);
        NotificationService.sinricNoDevices();
        return [];
      }

      const indoorGardenDevices = devices.filter(
        device => device.name && device.name.includes('Indoor Garden')
      );

      Logger.log(`📤 Number of Indoor Garden devices found: ${indoorGardenDevices.length}`);
      Logger.log(`📤 Indoor Garden devices with states:`);

      const formattedDevices = indoorGardenDevices.map(device => {
        const name = device.name || '';
        const powerState = device.powerState || 'Off';
        const isOn = powerState === 'On' ? 'on' : 'off';

        let temperature = null;
        let humidity = null;

        if (typeof device.temperature !== 'undefined') temperature = device.temperature;
        if (typeof device.humidity !== 'undefined') humidity = device.humidity;

        const extras = [];
        if (temperature !== null) extras.push(`temp: ${temperature}`);
        if (humidity !== null) extras.push(`hum: ${humidity}`);

        const extrasText = extras.length ? ' | ' + extras.join(', ') : '';
        Logger.log(`--> ${name.padEnd(40, ' ')}: ${isOn}${extrasText}`);

        let deviceType = device.type || (device.product ? device.product.name : '') || '';
        if (name.toLowerCase().includes('sensor') || temperature !== null || humidity !== null) {
          deviceType = 'SENSOR';
        } else if (
          name.toLowerCase().includes('iluminacion') ||
          name.toLowerCase().includes('luz')
        ) {
          deviceType = 'LIGHT';
        } else if (name.toLowerCase().includes('ventilacion')) {
          deviceType = 'AERATION';
        } else if (name.toLowerCase().includes('switch')) {
          deviceType = 'SWITCH';
        }

        return {
          ID: device.id || device.deviceId || '',
          Name: name,
          Type: deviceType,
          IsOn: isOn,
          Status: {
            power: powerState,
            temperature: temperature,
            humidity: humidity,
            isOnline: device.isOnline || false,
          },
          Temperature: temperature,
          Humidity: humidity,
        };
      });

      return formattedDevices;
    } catch (error) {
      Logger.log(`❌ Error general in getSinricDevices: ${error.message}`);
      NotificationService.sinricError(error.message || error.toString());
      return [];
    }
  },

  setDevicePowerState: function (deviceId, state) {
    if (!deviceId) {
      Logger.log(`❌ Device not found: ${deviceId}`);
      NotificationService.sinricDeviceNotFound(deviceId);
      return;
    }

    try {
      const authResponse = UrlFetchApp.fetch('https://api.sinric.pro/api/v1/auth', {
        method: 'post',
        headers: {
          'x-sinric-api-key': PropertiesService.getScriptProperties().getProperty('SINRIC_API_KEY'),
          'Content-Type': 'application/json',
        },
      });

      const { accessToken } = JSON.parse(authResponse.getContentText());

      const payload = {
        type: 'request',
        action: 'setPowerState',
        value: JSON.stringify({ state }),
      };

      const response = UrlFetchApp.fetch(
        `https://api.sinric.pro/api/v1/devices/${deviceId}/action`,
        {
          method: 'post',
          contentType: 'application/json',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true,
        }
      );

      const code = response.getResponseCode();
      const text = response.getContentText();

      if (code === 200) {
        Logger.log(`✅ Dispositivo ${deviceId} => ${state}`);
      } else {
        Logger.log(`❌ Error controlling device ${deviceId}. Code: ${code}`);
        NotificationService.sinricError(text);
      }
    } catch (err) {
      Logger.log(`❌ Error controlling device ${deviceId}: ${err.message}`);
      NotificationService.sinricError(err.toString());
    }
  },

  turnOnLight1: function () {
    this.setDevicePowerState(LIGHT_DEVICE_1, ON_STATE);
  },

  turnOffLight1: function () {
    this.setDevicePowerState(LIGHT_DEVICE_1, OFF_STATE);
  },

  turnOnLight2: function () {
    this.setDevicePowerState(LIGHT_DEVICE_2, ON_STATE);
  },

  turnOffLight2: function () {
    this.setDevicePowerState(LIGHT_DEVICE_2, OFF_STATE);
  },

  turnOnAeration: function () {
    this.setDevicePowerState(AERATION_DEVICE, ON_STATE);
  },

  turnOffAeration: function () {
    this.setDevicePowerState(AERATION_DEVICE, OFF_STATE);
  },

  turnOnGenericDevice: function () {
    this.setDevicePowerState(GENERIC_DEVICE, ON_STATE);
  },

  turnOffGenericDevice: function () {
    this.setDevicePowerState(GENERIC_DEVICE, OFF_STATE);
  },
};
