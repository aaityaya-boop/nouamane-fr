import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Wallet,
  MoreHorizontal,
} from 'lucide-react-native';
import { COLORS } from '../constants/theme';

// Screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { OrdersListScreen } from '../screens/orders/OrdersListScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { ProductsScreen } from '../screens/products/ProductsScreen';
import { CashScreen } from '../screens/cash/CashScreen';
import { MoreScreen } from '../screens/more/MoreScreen';
import { CustomersScreen } from '../screens/more/CustomersScreen';
import { TeamScreen } from '../screens/more/TeamScreen';
import { AuditLogsScreen } from '../screens/more/AuditLogsScreen';
import { SettingsScreen } from '../screens/more/SettingsScreen';

const Tab = createBottomTabNavigator();
const OrdersStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: COLORS.navy,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <OrdersStack.Screen
        name="OrdersList"
        component={OrdersListScreen}
        options={{ title: 'Commandes' }}
      />
      <OrdersStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Détail Commande' }}
      />
    </OrdersStack.Navigator>
  );
}

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: COLORS.navy,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <MoreStack.Screen
        name="MoreHome"
        component={MoreScreen}
        options={{ title: 'Menu & Profil' }}
      />
      <MoreStack.Screen
        name="Customers"
        component={CustomersScreen}
        options={{ title: 'Clients & CRM' }}
      />
      <MoreStack.Screen
        name="Team"
        component={TeamScreen}
        options={{ title: 'Équipe & Accès' }}
      />
      <MoreStack.Screen
        name="AuditLogs"
        component={AuditLogsScreen}
        options={{ title: 'Journal d\'Audit' }}
      />
      <MoreStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Paramètres' }}
      />
    </MoreStack.Navigator>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: COLORS.navy,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        tabBarActiveTintColor: COLORS.skyBlue,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Tableau de bord',
          tabBarLabel: 'Tableau',
          tabBarIcon: ({ color, size }: { color: string; size?: number }) => <LayoutDashboard size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Commandes',
          tabBarIcon: ({ color, size }: { color: string; size?: number }) => <ShoppingBag size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: 'Stock & Produits',
          tabBarLabel: 'Produits',
          tabBarIcon: ({ color, size }: { color: string; size?: number }) => <Package size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Cash"
        component={CashScreen}
        options={{
          title: 'Encaissements & Caisse',
          tabBarLabel: 'Caisse',
          tabBarIcon: ({ color, size }: { color: string; size?: number }) => <Wallet size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Plus',
          tabBarIcon: ({ color, size }: { color: string; size?: number }) => <MoreHorizontal size={size || 22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
