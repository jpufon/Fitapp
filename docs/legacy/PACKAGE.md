# waliFit — package.json

> `apps/mobile/package.json` — copy this file exactly

```json
{
  "name": "@walifit/mobile",
  "version": "1.0.0",
  "main": "App.tsx",
  "private": true,
  "scripts": {
    "start":   "expo start",
    "android": "expo start --android",
    "ios":     "expo start --ios",
    "lint":    "eslint . --ext .ts,.tsx",
    "test":    "jest"
  },
  "dependencies": {
    "expo":                          "~53.0.0",
    "react":                         "18.3.1",
    "react-native":                  "0.76.5",

    "expo-status-bar":               "~2.0.0",
    "expo-font":                     "~13.0.1",
    "expo-secure-store":             "~14.0.0",
    "expo-crypto":                   "~14.0.0",
    "expo-haptics":                  "~14.0.0",
    "expo-notifications":            "~0.29.0",
    "expo-image-picker":             "~16.0.0",
    "expo-location":                 "~18.0.0",
    "expo-blur":                     "~14.0.1",
    "expo-linear-gradient":          "~14.0.0",

    "@react-navigation/native":      "^6.1.18",
    "@react-navigation/bottom-tabs": "^6.6.1",
    "@react-navigation/native-stack":"^6.11.0",
    "react-native-screens":          "~4.3.0",
    "react-native-safe-area-context":"4.12.0",
    "react-native-gesture-handler":  "~2.20.2",
    "react-native-reanimated":       "~3.16.1",

    "@gluestack-ui/themed":          "^1.1.69",
    "@gluestack-style/react":        "^1.0.57",
    "nativewind":                    "^4.1.23",

    "react-native-mmkv":             "^3.1.0",
    "zustand":                       "^5.0.2",
    "@tanstack/react-query":         "^5.62.7",

    "@supabase/supabase-js":         "^2.46.2",

    "lucide-react-native":           "^0.468.0",
    "lottie-react-native":           "^7.1.0",
    "react-native-maps":             "^1.20.1",
    "react-native-svg":              "^15.9.0",

    "react-hook-form":               "^7.54.2",
    "zod":                           "^3.23.8"
  },
  "devDependencies": {
    "@babel/core":               "^7.25.2",
    "@types/react":              "~18.3.12",
    "typescript":                "~5.3.3",
    "tailwindcss":               "^3.4.16",
    "jest":                      "^29.7.0",
    "jest-expo":                 "~53.0.0",
    "@testing-library/react-native": "^12.9.0",
    "msw":                       "^2.6.6",
    "eslint":                    "^9.15.0"
  }
}
```
