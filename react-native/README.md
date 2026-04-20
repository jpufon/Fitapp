# waliFit - React Native Version

This is the **React Native conversion** of the waliFit web app. This version runs as a native mobile app on iOS and Android.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on your phone (for testing)
- Optional: Xcode (for iOS) or Android Studio (for Android)

### Installation

1. **Navigate to this directory:**
   ```bash
   cd react-native
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Run on your device:**
   - Scan the QR code with Expo Go app (Android)
   - Scan with Camera app (iOS)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

## 📱 What's Included

### Completed Screens:
✅ **HomeScreen** - Full vitality tree, progress stats, workout card
✅ **VitalityTree Component** - Animated tree with growth states
✅ **App Navigation** - Bottom tab navigation
✅ **Theme System** - Complete color palette
✅ **Onboarding** - (Placeholder - needs implementation)

### Still Need Implementation:
- TrainScreen
- CalendarScreen
- ArenaScreen
- ProfileScreen
- All sub-screens (workout logging, custom builder, etc.)

## 🎨 Design System

All colors from the web version are preserved in `theme.ts`:

**Primary Colors:**
- Emerald: `#10b981` (vitality/growth)
- Amber: `#fbbf24` (energy/achievements)
- Blue: `#60a5fa` (hydration/calm)
- Purple: `#a78bfa` (history/premium)

**Backgrounds:**
- Deep charcoal: `#0a0f0f`
- Card surface: `#141818`
- Secondary: `#1a1f1f`

## 📁 Project Structure

```
react-native/
├── App.tsx              # Main app with navigation
├── theme.ts             # Color system & design tokens
├── app.json             # Expo configuration
├── package.json         # Dependencies
├── components/
│   └── VitalityTree.tsx # Vitality tree component
└── screens/
    └── HomeScreen.tsx   # Home screen (fully implemented)
```

## 🔧 Key Differences from Web Version

| Web (React) | Native (React Native) |
|------------|---------------------|
| `<div>` | `<View>` |
| `<h1>` | `<Text style={styles.title}>` |
| Tailwind CSS | StyleSheet API |
| Motion (Framer Motion) | React Native Reanimated |
| CSS gradients | expo-linear-gradient |
| lucide-react | @expo/vector-icons |

## 📦 Dependencies

**Core:**
- `expo` - Development framework
- `react-native` - Mobile framework
- `expo-router` - File-based routing

**UI:**
- `@expo/vector-icons` - Icons (Ionicons)
- `expo-linear-gradient` - Gradients
- `expo-blur` - Blur effects
- `react-native-reanimated` - Animations

**Navigation:**
- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `@react-navigation/native-stack`

## 🎯 Next Steps to Complete

1. **Implement remaining screens:**
   - Copy patterns from HomeScreen
   - Convert web components to React Native
   - Use StyleSheet for styling

2. **Add animations:**
   - Use React Native Reanimated
   - Port Motion animations from web version

3. **Test on devices:**
   - Use Expo Go for quick testing
   - Build standalone apps for production

4. **Add native features:**
   - Camera for progress photos
   - GPS for run tracking
   - Push notifications
   - Offline storage

## 🐛 Troubleshooting

**"Metro bundler not starting"**
```bash
npx expo start -c
```

**"Module not found"**
```bash
rm -rf node_modules
npm install
```

**"Expo Go app can't connect"**
- Make sure phone and computer are on same WiFi
- Try using tunnel: `npx expo start --tunnel`

## 📖 Resources

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Expo Icons Directory](https://icons.expo.fyi/)

## 🎨 Design Notes

The React Native version preserves:
- ✅ Same dark theme aesthetic
- ✅ Emerald/amber color palette
- ✅ Premium glassmorphism effects
- ✅ All spacing and typography scales
- ✅ Vitality Tree gamification

---

**Built with ❤️ by waliFit Team**

*This is a React Native conversion of the web app. Both versions share the same design system and UX.*
