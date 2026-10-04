// Type definitions shim for Mobile Admin React Native environment
declare module 'react-native' {
  export const View: any;
  export const Text: any;
  export const TextInput: any;
  export const TouchableOpacity: any;
  export const StyleSheet: any;
  export const ActivityIndicator: any;
  export const ScrollView: any;
  export const FlatList: any;
  export const RefreshControl: any;
  export const StatusBar: any;
  export const KeyboardAvoidingView: any;
  export const Platform: any;
  export const Alert: any;
  export const Linking: any;
  export const Switch: any;
  export const Image: any;
  export type ViewStyle = any;
  export type TextStyle = any;
  export type ImageStyle = any;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
  export default AsyncStorage;
}

declare module 'expo-secure-store' {
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function getItemAsync(key: string): Promise<string | null>;
  export function deleteItemAsync(key: string): Promise<void>;
}

declare module 'expo-local-authentication' {
  export function hasHardwareAsync(): Promise<boolean>;
  export function isEnrolledAsync(): Promise<boolean>;
  export function authenticateAsync(options?: any): Promise<{ success: boolean; error?: string }>;
}

declare module 'expo-clipboard' {
  export function setStringAsync(text: string): Promise<boolean>;
}

declare module 'expo-status-bar' {
  export const StatusBar: any;
}

declare module 'react-native-safe-area-context' {
  export const SafeAreaProvider: any;
  export const SafeAreaView: any;
  export function useSafeAreaInsets(): { top: number; bottom: number; left: number; right: number };
}

declare module '@react-navigation/native' {
  export const NavigationContainer: any;
  export function useNavigation(): any;
  export function useRoute(): any;
}

declare module '@react-navigation/native-stack' {
  export function createNativeStackNavigator(): any;
}

declare module '@react-navigation/bottom-tabs' {
  export function createBottomTabNavigator(): any;
}

declare module 'lucide-react-native' {
  export const LayoutDashboard: any;
  export const ShoppingBag: any;
  export const Package: any;
  export const Wallet: any;
  export const MoreHorizontal: any;
  export const Search: any;
  export const Filter: any;
  export const Phone: any;
  export const MessageCircle: any;
  export const MessageSquare: any;
  export const MapPin: any;
  export const Clock: any;
  export const CheckCircle2: any;
  export const Truck: any;
  export const RotateCcw: any;
  export const XCircle: any;
  export const ChevronRight: any;
  export const ChevronDown: any;
  export const ChevronUp: any;
  export const Plus: any;
  export const Minus: any;
  export const AlertTriangle: any;
  export const CreditCard: any;
  export const TrendingUp: any;
  export const DollarSign: any;
  export const Shield: any;
  export const Sparkles: any;
  export const Users: any;
  export const Crown: any;
  export const X: any;
  export const ShieldCheck: any;
  export const UserCheck: any;
  export const Mail: any;
  export const Circle: any;
  export const Briefcase: any;
  export const Activity: any;
  export const Settings: any;
  export const ExternalLink: any;
  export const LogOut: any;
  export const Fingerprint: any;
  export const Globe: any;
  export const Bell: any;
  export const Info: any;
  export const RefreshCw: any;
  export const Server: any;
  export const Lock: any;
  export const Eye: any;
  export const EyeOff: any;
  export const FileText: any;
  export const Send: any;
  export const Copy: any;
  export const AlertCircle: any;
  export const ShieldAlert: any;
  export const User: any;
  export const Layers: any;
}
