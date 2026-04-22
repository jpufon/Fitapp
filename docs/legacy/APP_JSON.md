# waliFit — app.json

> `apps/mobile/app.json` — copy this file exactly

```json
{
  "expo": {
    "name": "waliFit",
    "slug": "walifit",
    "version": "1.0.0",
    "scheme": "walifit",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0a0f0f"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.walifit.app",
      "infoPlist": {
        "NSHealthShareUsageDescription": "waliFit reads your step count to power the Vitality Tree — your daily activity score.",
        "NSHealthUpdateUsageDescription": "waliFit does not write health data.",
        "NSLocationWhenInUseUsageDescription": "waliFit uses GPS to track your runs. Location is only accessed while the app is open and a run is active.",
        "NSCameraUsageDescription": "waliFit uses the camera to import your training history from other apps during onboarding.",
        "NSPhotoLibraryUsageDescription": "waliFit accesses your photo library to import your training history from other apps."
      }
    },
    "android": {
      "package": "com.walifit.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0a0f0f"
      },
      "permissions": [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.ACTIVITY_RECOGNITION"
      ]
    },
    "plugins": [
      "expo-secure-store",
      "expo-font",
      [
        "expo-notifications",
        {
          "color": "#10b981",
          "sounds": ["./assets/sounds/timer-complete.wav"]
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "waliFit uses GPS to track your runs."
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    }
  }
}
```
