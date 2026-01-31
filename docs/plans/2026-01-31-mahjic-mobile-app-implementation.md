# Mahjic Mobile App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a native mobile app for recording Mahjong games with QR-based table linking, real-time scoring, and push notification confirmations.

**Architecture:** Expo (React Native) app as thin client. All ELO calculation and player data lives on existing mahjic.org API. Real-time sync via Supabase Realtime. Offline-first with local storage.

**Tech Stack:** Expo SDK 52+, React Native, TypeScript, Zustand (state), Supabase Realtime, expo-camera, expo-barcode-scanner, expo-nfc, Expo Push Notifications

**Design Doc:** `docs/plans/2026-01-31-mahjic-mobile-app-design.md`

**Existing API:** `https://mahjic.org/api/v1/` (see `/Users/sterlinglcannon/Desktop/Mahjic/src/app/api/v1/`)

---

## Phase 1: Project Setup & Auth

### Task 1: Create Expo Project

**Files:**
- Create: `/Users/sterlinglcannon/Desktop/Mahjic-App/` (new directory)

**Step 1: Create Expo project**

```bash
cd /Users/sterlinglcannon/Desktop
npx create-expo-app@latest Mahjic-App --template blank-typescript
cd Mahjic-App
```

**Step 2: Install core dependencies**

```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar
npx expo install @supabase/supabase-js
npx expo install zustand
npx expo install expo-secure-store
npx expo install react-native-url-polyfill
```

**Step 3: Set up file-based routing**

Create `app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
```

**Step 4: Create placeholder home screen**

Create `app/index.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mahjic</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF8F3',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
});
```

**Step 5: Update package.json main entry**

In `package.json`, ensure:

```json
{
  "main": "expo-router/entry"
}
```

**Step 6: Run and verify**

```bash
npx expo start
```

Expected: App launches with "Mahjic" text centered.

**Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Expo project with expo-router"
```

---

### Task 2: Supabase Client Setup

**Files:**
- Create: `lib/supabase.ts`
- Create: `lib/storage.ts`

**Step 1: Create secure storage adapter**

Create `lib/storage.ts`:

```tsx
import * as SecureStore from 'expo-secure-store';

export const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};
```

**Step 2: Create Supabase client**

Create `lib/supabase.ts`:

```tsx
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { ExpoSecureStoreAdapter } from './storage';

const supabaseUrl = 'https://nevmbqdvivaqwvuzfrrn.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**Step 3: Create environment file**

Create `.env`:

```
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Add to `.gitignore`:

```
.env
```

**Step 4: Commit**

```bash
git add lib/ .gitignore
git commit -m "feat: add Supabase client with secure storage"
```

---

### Task 3: Auth Store & Magic Link Login

**Files:**
- Create: `stores/authStore.ts`
- Create: `app/login.tsx`
- Modify: `app/index.tsx`

**Step 1: Create auth store**

Create `stores/authStore.ts`:

```tsx
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  signInWithEmail: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'mahjic://auth/callback',
      },
    });
    return { error: error as Error | null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
}));
```

**Step 2: Create login screen**

Create `app/login.tsx`:

```tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);

  const handleLogin = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await signInWithEmail(email.trim());
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a magic link to {email}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>Mahjic</Text>
      <Text style={styles.subtitle}>Sign in to track your rating</Text>

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send Magic Link'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF8F3',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B4D3E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: '#E07A5F',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Step 3: Update root layout with auth initialization**

Modify `app/_layout.tsx`:

```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
```

**Step 4: Update home to redirect based on auth**

Modify `app/index.tsx`:

```tsx
import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1B4D3E" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF8F3',
  },
});
```

**Step 5: Create authenticated home screen placeholder**

Create `app/home.tsx`:

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';

export default function HomeScreen() {
  const { user, signOut } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.rating}>1200</Text>
      <Text style={styles.label}>Your Rating</Text>

      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>START TABLE</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>JOIN TABLE</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={signOut} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF8F3',
    padding: 24,
  },
  rating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#1B4D3E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1B4D3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1B4D3E',
    fontSize: 18,
    fontWeight: '700',
  },
  signOut: {
    marginTop: 32,
  },
  signOutText: {
    color: '#999',
    fontSize: 14,
  },
});
```

**Step 6: Run and verify**

```bash
npx expo start
```

Expected: App shows loading, then redirects to login. Enter email, see "Check your email" message.

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add magic link auth with Supabase"
```

---

### Task 4: Deep Link Handling for Auth Callback

**Files:**
- Modify: `app.json`
- Create: `app/auth/callback.tsx`

**Step 1: Configure URL scheme**

Modify `app.json`:

```json
{
  "expo": {
    "name": "Mahjic",
    "slug": "mahjic",
    "scheme": "mahjic",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FDF8F3"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "org.mahjic.app"
    },
    "android": {
      "package": "org.mahjic.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FDF8F3"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ]
  }
}
```

**Step 2: Create auth callback handler**

Create `app/auth/callback.tsx`:

```tsx
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      // Extract tokens from URL params
      const accessToken = params.access_token as string;
      const refreshToken = params.refresh_token as string;

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error) {
          router.replace('/home');
          return;
        }
      }

      // Fallback: try to get session normally
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    };

    handleCallback();
  }, [params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1B4D3E" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF8F3',
  },
});
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add deep link handling for auth callback"
```

---

## Phase 2: Table Linking (QR Code)

### Task 5: Table Store & API Types

**Files:**
- Create: `stores/tableStore.ts`
- Create: `lib/types.ts`

**Step 1: Create shared types**

Create `lib/types.ts`:

```tsx
export interface Player {
  id: string;
  name: string;
  email?: string;
  rating: number;
  isVerified: boolean;
  isProxy: boolean;
  avatarUrl?: string;
}

export interface TableSession {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'ended';
  createdAt: string;
}

export interface GameResult {
  id: string;
  tableSessionId: string;
  winnerId: string | null; // null = wall game
  lineNumber?: number;
  points?: number;
  confirmations: {
    playerId: string;
    status: 'confirmed' | 'disputed' | 'pending';
  }[];
  status: 'pending' | 'confirmed' | 'disputed';
  createdAt: string;
}

export interface RatingChange {
  playerId: string;
  before: number;
  after: number;
  change: number;
}
```

**Step 2: Create table store**

Create `stores/tableStore.ts`:

```tsx
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Player, TableSession, GameResult, RatingChange } from '../lib/types';

function generateTableCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'MAH-';
  for (let i = 0; i < 3; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface TableState {
  currentTable: TableSession | null;
  results: GameResult[];
  ratingChanges: RatingChange[];
  loading: boolean;
  error: string | null;

  // Actions
  createTable: (hostPlayer: Player) => Promise<string>;
  joinTable: (code: string, player: Player) => Promise<boolean>;
  leaveTable: () => void;
  subscribeToTable: (tableId: string) => void;
  unsubscribe: () => void;
}

export const useTableStore = create<TableState>((set, get) => ({
  currentTable: null,
  results: [],
  ratingChanges: [],
  loading: false,
  error: null,

  createTable: async (hostPlayer: Player) => {
    const code = generateTableCode();
    const tableSession: TableSession = {
      id: crypto.randomUUID(),
      code,
      hostId: hostPlayer.id,
      players: [hostPlayer],
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };

    // In real implementation, this would POST to mahjic.org/api/v1/tables
    // For now, store in Supabase Realtime
    const { error } = await supabase
      .from('table_sessions')
      .insert(tableSession);

    if (error) {
      set({ error: error.message });
      return '';
    }

    set({ currentTable: tableSession, error: null });
    get().subscribeToTable(tableSession.id);
    return code;
  },

  joinTable: async (code: string, player: Player) => {
    set({ loading: true });

    // Find table by code
    const { data: table, error } = await supabase
      .from('table_sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('status', 'waiting')
      .single();

    if (error || !table) {
      set({ loading: false, error: 'Table not found' });
      return false;
    }

    if (table.players.length >= 4) {
      set({ loading: false, error: 'Table is full' });
      return false;
    }

    // Add player to table
    const updatedPlayers = [...table.players, player];
    const { error: updateError } = await supabase
      .from('table_sessions')
      .update({ players: updatedPlayers })
      .eq('id', table.id);

    if (updateError) {
      set({ loading: false, error: updateError.message });
      return false;
    }

    set({ currentTable: { ...table, players: updatedPlayers }, loading: false });
    get().subscribeToTable(table.id);
    return true;
  },

  leaveTable: () => {
    get().unsubscribe();
    set({ currentTable: null, results: [], ratingChanges: [] });
  },

  subscribeToTable: (tableId: string) => {
    supabase
      .channel(`table:${tableId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'table_sessions',
        filter: `id=eq.${tableId}`,
      }, (payload) => {
        set({ currentTable: payload.new as TableSession });
      })
      .subscribe();
  },

  unsubscribe: () => {
    supabase.removeAllChannels();
  },
}));
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add table store with create/join logic"
```

---

### Task 6: QR Code Generation (Start Table)

**Files:**
- Install: `react-native-qrcode-svg`
- Create: `app/table/start.tsx`

**Step 1: Install QR code generator**

```bash
npx expo install react-native-qrcode-svg react-native-svg
```

**Step 2: Create Start Table screen**

Create `app/table/start.tsx`:

```tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useTableStore } from '../../stores/tableStore';
import { useAuthStore } from '../../stores/authStore';

export default function StartTable() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentTable, createTable } = useTableStore();
  const [code, setCode] = useState('');

  useEffect(() => {
    const initTable = async () => {
      if (!user) return;

      const hostPlayer = {
        id: user.id,
        name: user.email?.split('@')[0] || 'Host',
        email: user.email || '',
        rating: 1200, // TODO: Fetch from API
        isVerified: false,
        isProxy: false,
      };

      const tableCode = await createTable(hostPlayer);
      if (tableCode) {
        setCode(tableCode);
        Vibration.vibrate(100);
      }
    };

    initTable();
  }, [user]);

  useEffect(() => {
    // Navigate to game when 2+ players and host starts
    if (currentTable?.status === 'playing') {
      router.replace('/table/game');
    }
  }, [currentTable?.status]);

  const playerCount = currentTable?.players.length || 0;
  const canStart = playerCount >= 2;

  const handleStart = async () => {
    // Update table status to playing
    // TODO: Implement start game
    router.replace('/table/game');
  };

  const qrValue = `mahjic://join/${code}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan to Join</Text>

      <View style={styles.qrContainer}>
        {code ? (
          <QRCode
            value={qrValue}
            size={200}
            backgroundColor="#FFF"
            color="#1B4D3E"
          />
        ) : (
          <Text>Generating...</Text>
        )}
      </View>

      <Text style={styles.code}>{code}</Text>
      <Text style={styles.hint}>or enter code manually</Text>

      <View style={styles.players}>
        <Text style={styles.playersLabel}>
          {playerCount}/4 players joined
        </Text>
        {currentTable?.players.map((p) => (
          <Text key={p.id} style={styles.playerName}>
            {p.name} {p.id === currentTable.hostId ? '(Host)' : ''}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.startButton, !canStart && styles.startButtonDisabled]}
        onPress={handleStart}
        disabled={!canStart}
      >
        <Text style={styles.startButtonText}>
          {canStart ? 'START GAME' : 'Waiting for players...'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF8F3',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B4D3E',
    marginBottom: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  code: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B4D3E',
    marginTop: 24,
    letterSpacing: 4,
  },
  hint: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  players: {
    marginTop: 32,
    alignItems: 'center',
  },
  playersLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 14,
    color: '#1B4D3E',
    marginTop: 4,
  },
  startButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#1B4D3E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  startButtonDisabled: {
    backgroundColor: '#CCC',
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 16,
  },
  cancelText: {
    color: '#999',
    fontSize: 14,
  },
});
```

**Step 3: Wire up home screen button**

Modify `app/home.tsx` to add navigation:

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.rating}>1200</Text>
      <Text style={styles.label}>Your Rating</Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push('/table/start')}
      >
        <Text style={styles.primaryButtonText}>START TABLE</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/table/join')}
      >
        <Text style={styles.secondaryButtonText}>JOIN TABLE</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={signOut} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF8F3',
    padding: 24,
  },
  rating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#1B4D3E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1B4D3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1B4D3E',
    fontSize: 18,
    fontWeight: '700',
  },
  signOut: {
    marginTop: 32,
  },
  signOutText: {
    color: '#999',
    fontSize: 14,
  },
});
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add QR code generation for starting tables"
```

---

### Task 7: QR Code Scanner (Join Table)

**Files:**
- Install: `expo-camera`, `expo-barcode-scanner`
- Create: `app/table/join.tsx`

**Step 1: Install camera dependencies**

```bash
npx expo install expo-camera expo-barcode-scanner
```

**Step 2: Create Join Table screen**

Create `app/table/join.tsx`:

```tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTableStore } from '../../stores/tableStore';
import { useAuthStore } from '../../stores/authStore';

export default function JoinTable() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { joinTable, error } = useTableStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);

  const handleJoin = async (code: string) => {
    if (!user || scanned) return;
    setScanned(true);

    const player = {
      id: user.id,
      name: user.email?.split('@')[0] || 'Player',
      email: user.email || '',
      rating: 1200, // TODO: Fetch from API
      isVerified: false,
      isProxy: false,
    };

    const success = await joinTable(code, player);

    if (success) {
      Vibration.vibrate([0, 100, 50, 100]); // Success pattern
      router.replace('/table/game');
    } else {
      Vibration.vibrate(500); // Error
      Alert.alert('Error', error || 'Could not join table');
      setScanned(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    // Parse mahjic://join/MAH-XXX format
    const match = data.match(/mahjic:\/\/join\/([A-Z0-9-]+)/i);
    if (match) {
      handleJoin(match[1]);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.subtitle}>
          We need camera access to scan QR codes
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => setShowManual(true)}
        >
          <Text style={styles.linkText}>Enter code manually instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showManual) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Enter Table Code</Text>

        <TextInput
          style={styles.input}
          placeholder="MAH-XXX"
          placeholderTextColor="#999"
          value={manualCode}
          onChangeText={setManualCode}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleJoin(manualCode)}
        >
          <Text style={styles.buttonText}>Join</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => setShowManual(false)}
        >
          <Text style={styles.linkText}>Scan QR instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <View style={styles.overlay}>
        <Text style={styles.scanText}>Scan host's QR code</Text>
      </View>

      <TouchableOpacity
        style={styles.manualButton}
        onPress={() => setShowManual(true)}
      >
        <Text style={styles.manualText}>Enter code manually</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manualButton: {
    position: 'absolute',
    bottom: 120,
    left: 24,
    right: 24,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualText: {
    color: '#FFF',
    fontSize: 16,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: '#FFF',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B4D3E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    width: '80%',
    height: 56,
    borderWidth: 2,
    borderColor: '#1B4D3E',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#FFF',
    marginBottom: 16,
    letterSpacing: 4,
  },
  button: {
    width: '80%',
    height: 48,
    backgroundColor: '#1B4D3E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
  },
  linkText: {
    color: '#1B4D3E',
    fontSize: 14,
  },
});
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add QR scanner for joining tables"
```

---

## Phase 3: Game Play & Scoring

### Task 8: Game On Screen

**Files:**
- Create: `app/table/game.tsx`
- Create: `components/PlayerCard.tsx`

**Step 1: Create PlayerCard component**

Create `components/PlayerCard.tsx`:

```tsx
import { View, Text, Image, StyleSheet } from 'react-native';
import type { Player } from '../lib/types';

interface PlayerCardProps {
  player: Player;
  ratingChange?: number;
  isCurrentUser?: boolean;
}

export function PlayerCard({ player, ratingChange, isCurrentUser }: PlayerCardProps) {
  return (
    <View style={[styles.card, isCurrentUser && styles.cardCurrent]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {player.name.charAt(0).toUpperCase()}
        </Text>
        {player.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓</Text>
          </View>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {player.name}
      </Text>

      <Text style={styles.rating}>{Math.round(player.rating)}</Text>

      {ratingChange !== undefined && ratingChange !== 0 && (
        <Text style={[
          styles.change,
          ratingChange > 0 ? styles.changePositive : styles.changeNegative,
        ]}>
          {ratingChange > 0 ? '+' : ''}{ratingChange}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardCurrent: {
    borderWidth: 2,
    borderColor: '#1B4D3E',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F0ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1B4D3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  rating: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
  change: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  changePositive: {
    color: '#22C55E',
  },
  changeNegative: {
    color: '#EF4444',
  },
});
```

**Step 2: Create Game On screen**

Create `app/table/game.tsx`:

```tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PlayerCard } from '../../components/PlayerCard';
import { useTableStore } from '../../stores/tableStore';
import { useAuthStore } from '../../stores/authStore';

export default function GameScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentTable, ratingChanges, leaveTable } = useTableStore();
  const [sessionStart] = useState(new Date());
  const [elapsed, setElapsed] = useState('0:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - sessionStart.getTime()) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setElapsed(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStart]);

  const handleEnd = () => {
    Alert.alert(
      'End Session?',
      'This will end the game for all players.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: () => {
            leaveTable();
            router.replace('/home');
          },
        },
      ]
    );
  };

  if (!currentTable) {
    router.replace('/home');
    return null;
  }

  const players = currentTable.players;
  const getRatingChange = (playerId: string) => {
    const change = ratingChanges.find((c) => c.playerId === playerId);
    return change?.change;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.elapsed}>{elapsed}</Text>
        <TouchableOpacity onPress={handleEnd}>
          <Text style={styles.endText}>End</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.table}>
        <View style={styles.row}>
          {players[0] && (
            <PlayerCard
              player={players[0]}
              ratingChange={getRatingChange(players[0].id)}
              isCurrentUser={players[0].id === user?.id}
            />
          )}
          {players[1] && (
            <PlayerCard
              player={players[1]}
              ratingChange={getRatingChange(players[1].id)}
              isCurrentUser={players[1].id === user?.id}
            />
          )}
        </View>
        <View style={styles.row}>
          {players[2] && (
            <PlayerCard
              player={players[2]}
              ratingChange={getRatingChange(players[2].id)}
              isCurrentUser={players[2].id === user?.id}
            />
          )}
          {players[3] && (
            <PlayerCard
              player={players[3]}
              ratingChange={getRatingChange(players[3].id)}
              isCurrentUser={players[3].id === user?.id}
            />
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.resultButton}
        onPress={() => router.push('/table/result')}
      >
        <Text style={styles.resultButtonText}>ENTER RESULT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  elapsed: {
    fontSize: 16,
    color: '#666',
  },
  endText: {
    fontSize: 16,
    color: '#E07A5F',
    fontWeight: '600',
  },
  table: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  resultButton: {
    marginHorizontal: 24,
    marginBottom: 40,
    height: 56,
    backgroundColor: '#1B4D3E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add Game On screen with player cards"
```

---

### Task 9: Enter Result Screen

**Files:**
- Create: `app/table/result.tsx`
- Create: `stores/resultStore.ts`

**Step 1: Create result store**

Create `stores/resultStore.ts`:

```tsx
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { GameResult } from '../lib/types';

interface ResultState {
  pendingResult: GameResult | null;
  submitting: boolean;

  submitResult: (
    tableSessionId: string,
    winnerId: string | null,
    lineNumber?: number,
    submitterId: string
  ) => Promise<void>;
  clearPending: () => void;
}

export const useResultStore = create<ResultState>((set) => ({
  pendingResult: null,
  submitting: false,

  submitResult: async (tableSessionId, winnerId, lineNumber, submitterId) => {
    set({ submitting: true });

    const result: GameResult = {
      id: crypto.randomUUID(),
      tableSessionId,
      winnerId,
      lineNumber,
      confirmations: [
        { playerId: submitterId, status: 'confirmed' },
      ],
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Save to Supabase and notify other players
    await supabase.from('game_results').insert(result);

    set({ pendingResult: result, submitting: false });
  },

  clearPending: () => set({ pendingResult: null }),
}));
```

**Step 2: Create Enter Result screen**

Create `app/table/result.tsx`:

```tsx
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTableStore } from '../../stores/tableStore';
import { useResultStore } from '../../stores/resultStore';
import { useAuthStore } from '../../stores/authStore';

export default function EnterResult() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentTable } = useTableStore();
  const { submitResult, submitting } = useResultStore();
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [step, setStep] = useState<'winner' | 'line'>('winner');

  if (!currentTable) {
    router.replace('/home');
    return null;
  }

  const handleWinnerSelect = (playerId: string | null) => {
    setSelectedWinner(playerId);
    if (playerId === null) {
      // Wall game - submit directly
      handleSubmit(null, undefined);
    } else {
      setStep('line');
    }
  };

  const handleSubmit = async (winnerId: string | null, line?: number) => {
    if (!user) return;

    await submitResult(
      currentTable.id,
      winnerId,
      line,
      user.id
    );

    router.back();
  };

  if (step === 'line' && selectedWinner) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Which line?</Text>
        <Text style={styles.subtitle}>Optional - for point tracking</Text>

        <ScrollView style={styles.lineGrid} contentContainerStyle={styles.lineGridContent}>
          {Array.from({ length: 50 }, (_, i) => i + 1).map((line) => (
            <TouchableOpacity
              key={line}
              style={[
                styles.lineButton,
                selectedLine === line && styles.lineButtonSelected,
              ]}
              onPress={() => setSelectedLine(line)}
            >
              <Text style={[
                styles.lineText,
                selectedLine === line && styles.lineTextSelected,
              ]}>
                {line}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleSubmit(selectedWinner, undefined)}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, !selectedLine && styles.submitButtonDisabled]}
            onPress={() => handleSubmit(selectedWinner, selectedLine ?? undefined)}
            disabled={submitting}
          >
            <Text style={styles.submitText}>
              {submitting ? 'Sending...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who won?</Text>

      <View style={styles.playerGrid}>
        {currentTable.players.map((player) => (
          <TouchableOpacity
            key={player.id}
            style={styles.playerButton}
            onPress={() => handleWinnerSelect(player.id)}
          >
            <View style={styles.playerAvatar}>
              <Text style={styles.playerAvatarText}>
                {player.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.playerName}>{player.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.wallButton}
        onPress={() => handleWinnerSelect(null)}
      >
        <Text style={styles.wallText}>WALL GAME</Text>
        <Text style={styles.wallSubtext}>No winner</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F3',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B4D3E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  playerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  playerButton: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  playerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F0ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerAvatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  wallButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#DDD',
    borderStyle: 'dashed',
  },
  wallText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
  },
  wallSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  cancelButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#999',
  },
  lineGrid: {
    flex: 1,
    marginTop: 16,
  },
  lineGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  lineButton: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  lineButtonSelected: {
    backgroundColor: '#1B4D3E',
    borderColor: '#1B4D3E',
  },
  lineText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  lineTextSelected: {
    color: '#FFF',
  },
  footer: {
    flexDirection: 'row',
    paddingVertical: 24,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    height: 56,
    backgroundColor: '#1B4D3E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add Enter Result screen with winner and line selection"
```

---

### Task 10: Push Notification Confirmation

**Files:**
- Install: `expo-notifications`
- Create: `lib/notifications.ts`
- Create: `app/confirm.tsx`

**Step 1: Install notifications**

```bash
npx expo install expo-notifications expo-device
```

**Step 2: Create notifications helper**

Create `lib/notifications.ts`:

```tsx
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-expo-project-id', // TODO: Get from app.json
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token.data;
}

export async function savePushToken(userId: string, token: string) {
  await supabase
    .from('player_push_tokens')
    .upsert({ user_id: userId, token, updated_at: new Date().toISOString() });
}

export async function sendConfirmationRequest(
  playerTokens: string[],
  winnerName: string,
  lineNumber?: number
) {
  // This would typically go through your backend
  // For Expo, you can use Expo Push API
  const message = lineNumber
    ? `${winnerName} claims Mahjong on Line ${lineNumber}. Confirm?`
    : `${winnerName} claims Mahjong. Confirm?`;

  // In production, POST to https://exp.host/--/api/v2/push/send
  console.log('Sending push to:', playerTokens, message);
}
```

**Step 3: Create confirmation screen (opened from push notification)**

Create `app/confirm.tsx`:

```tsx
import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export default function ConfirmResult() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();

  const resultId = params.resultId as string;
  const winnerName = params.winnerName as string;
  const lineNumber = params.lineNumber as string | undefined;

  useEffect(() => {
    Vibration.vibrate([0, 100, 50, 100]);
  }, []);

  const handleResponse = async (status: 'confirmed' | 'disputed') => {
    if (!user) return;

    // Update confirmation in database
    const { data: result } = await supabase
      .from('game_results')
      .select('confirmations')
      .eq('id', resultId)
      .single();

    if (result) {
      const confirmations = result.confirmations || [];
      confirmations.push({ playerId: user.id, status });

      await supabase
        .from('game_results')
        .update({ confirmations })
        .eq('id', resultId);
    }

    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Confirm Result?</Text>

        <Text style={styles.claim}>
          {winnerName} claims Mahjong
          {lineNumber ? ` on Line ${lineNumber}` : ''}
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => handleResponse('confirmed')}
          >
            <Text style={styles.confirmText}>✓ Confirm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.disputeButton}
            onPress={() => handleResponse('disputed')}
          >
            <Text style={styles.disputeText}>✗ Dispute</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.back()}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B4D3E',
    marginBottom: 16,
  },
  claim: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  disputeButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disputeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  skipButton: {
    marginTop: 16,
    padding: 12,
  },
  skipText: {
    color: '#999',
    fontSize: 16,
  },
});
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add push notification confirmation flow"
```

---

## Phase 4: Proxy Players

### Task 11: Add Proxy Player Flow

**Files:**
- Create: `app/table/add-player.tsx`
- Modify: `stores/tableStore.ts`

**Step 1: Create Add Player screen**

Create `app/table/add-player.tsx`:

```tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTableStore } from '../../stores/tableStore';

export default function AddPlayer() {
  const router = useRouter();
  const { currentTable } = useTableStore();
  const [mode, setMode] = useState<'email' | 'guest'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleAdd = async () => {
    if (!currentTable) return;

    const proxyPlayer = {
      id: crypto.randomUUID(),
      name: name.trim() || email.split('@')[0],
      email: mode === 'email' ? email.trim() : undefined,
      rating: 1200, // Default for new players
      isVerified: false,
      isProxy: true,
    };

    // TODO: Add player to table via store
    // For now, just go back
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>Add Player</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'email' && styles.tabActive]}
          onPress={() => setMode('email')}
        >
          <Text style={[styles.tabText, mode === 'email' && styles.tabTextActive]}>
            By Email
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'guest' && styles.tabActive]}
          onPress={() => setMode('guest')}
        >
          <Text style={[styles.tabText, mode === 'guest' && styles.tabTextActive]}>
            Guest
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'email' ? (
        <>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            placeholder="player@example.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Text style={styles.hint}>
            They'll receive a link to claim their rating after the game
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Grandma"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <Text style={styles.hint}>
            Guest players don't get ratings saved
          </Text>
        </>
      )}

      <TouchableOpacity
        style={[
          styles.addButton,
          !(email.trim() || name.trim()) && styles.addButtonDisabled,
        ]}
        onPress={handleAdd}
        disabled={!(email.trim() || name.trim())}
      >
        <Text style={styles.addButtonText}>Add to Table</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F3',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B4D3E',
    textAlign: 'center',
    marginBottom: 24,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#1B4D3E',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  addButton: {
    height: 56,
    backgroundColor: '#1B4D3E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#CCC',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#999',
  },
});
```

**Step 2: Add navigation from game screen**

Modify `app/table/game.tsx` header to include add button:

```tsx
// Add after the End button in header
<TouchableOpacity onPress={() => router.push('/table/add-player')}>
  <Text style={styles.addText}>+ Add</Text>
</TouchableOpacity>
```

And add the style:

```tsx
addText: {
  fontSize: 16,
  color: '#1B4D3E',
  fontWeight: '600',
},
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add proxy player flow (email or guest)"
```

---

## Phase 5: NFC Sticker Support

### Task 12: NFC Reading

**Files:**
- Install: `expo-nfc` (Note: Requires dev build, not Expo Go)
- Create: `lib/nfc.ts`
- Modify: `app/table/join.tsx`

**Step 1: Install NFC**

```bash
npx expo install react-native-nfc-manager
```

Note: NFC requires a development build. Add to `app.json` plugins:

```json
{
  "plugins": [
    ["react-native-nfc-manager", {
      "nfcPermission": "Tap to join Mahjong tables"
    }]
  ]
}
```

**Step 2: Create NFC helper**

Create `lib/nfc.ts`:

```tsx
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

let isInitialized = false;

export async function initNfc(): Promise<boolean> {
  if (isInitialized) return true;

  const supported = await NfcManager.isSupported();
  if (!supported) return false;

  await NfcManager.start();
  isInitialized = true;
  return true;
}

export async function readNfcTag(): Promise<string | null> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);

    const tag = await NfcManager.getTag();
    if (!tag?.ndefMessage?.[0]) {
      return null;
    }

    const record = tag.ndefMessage[0];
    const payload = Ndef.text.decodePayload(new Uint8Array(record.payload));

    // Expected format: mahjic://join/MAH-XXX or just MAH-XXX
    const match = payload.match(/(?:mahjic:\/\/join\/)?([A-Z0-9-]+)/i);
    return match ? match[1] : null;
  } catch (error) {
    console.error('NFC read error:', error);
    return null;
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
}

export async function writeNfcTag(tableCode: string): Promise<boolean> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);

    const url = `mahjic://join/${tableCode}`;
    const bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);

    if (!bytes) return false;

    await NfcManager.ndefHandler.writeNdefMessage(bytes);
    return true;
  } catch (error) {
    console.error('NFC write error:', error);
    return false;
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
}

export function cancelNfc() {
  NfcManager.cancelTechnologyRequest();
}
```

**Step 3: Update Join screen to check NFC first**

In `app/table/join.tsx`, add NFC detection at the top:

```tsx
import { initNfc, readNfcTag, cancelNfc } from '../../lib/nfc';

// In component, add:
const [nfcAvailable, setNfcAvailable] = useState(false);
const [scanning, setScanning] = useState(false);

useEffect(() => {
  const checkNfc = async () => {
    const available = await initNfc();
    setNfcAvailable(available);

    if (available) {
      // Start NFC scan immediately
      setScanning(true);
      const code = await readNfcTag();
      setScanning(false);

      if (code) {
        handleJoin(code);
      }
    }
  };

  checkNfc();

  return () => cancelNfc();
}, []);
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add NFC sticker reading for table join"
```

---

## Phase 6: Mahjic API Integration

### Task 13: Connect to Mahjic API

**Files:**
- Create: `lib/mahjicApi.ts`
- Modify: `stores/authStore.ts`
- Modify: `app/home.tsx`

**Step 1: Create Mahjic API client**

Create `lib/mahjicApi.ts`:

```tsx
const API_BASE = 'https://mahjic.org/api/v1';

interface PlayerProfile {
  id: string;
  name: string;
  email: string;
  rating: number;
  verifiedRating: number;
  gamesPlayed: number;
  tier: 'provisional' | 'verified';
}

interface SubmitSessionPayload {
  sourceId: string;
  rounds: {
    players: {
      playerId?: string;
      email?: string;
      name: string;
      mahjongs: number;
      points?: number;
    }[];
    gamesPlayed: number;
    wallGames: number;
  }[];
}

export async function getPlayerProfile(authToken: string): Promise<PlayerProfile | null> {
  try {
    const response = await fetch(`${API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }
}

export async function getPlayerById(playerId: string): Promise<PlayerProfile | null> {
  try {
    const response = await fetch(`${API_BASE}/players/${playerId}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to fetch player:', error);
    return null;
  }
}

export async function submitSession(
  apiKey: string,
  payload: SubmitSessionPayload
): Promise<{ success: boolean; results?: any[] }> {
  try {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Submit session failed:', error);
      return { success: false };
    }

    const results = await response.json();
    return { success: true, results };
  } catch (error) {
    console.error('Submit session error:', error);
    return { success: false };
  }
}
```

**Step 2: Add player profile to auth store**

Modify `stores/authStore.ts` to include player profile:

```tsx
import { getPlayerProfile } from '../lib/mahjicApi';

// Add to AuthState interface:
playerProfile: PlayerProfile | null;
fetchProfile: () => Promise<void>;

// Add to store:
playerProfile: null,

fetchProfile: async () => {
  const { session } = get();
  if (!session?.access_token) return;

  const profile = await getPlayerProfile(session.access_token);
  set({ playerProfile: profile });
},
```

**Step 3: Update home screen to show real rating**

Modify `app/home.tsx`:

```tsx
export default function HomeScreen() {
  const router = useRouter();
  const { signOut, playerProfile, fetchProfile } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  const rating = playerProfile?.rating ?? 1200;
  const isVerified = playerProfile?.tier === 'verified';

  return (
    <View style={styles.container}>
      <Text style={styles.rating}>{Math.round(rating)}</Text>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Your Rating</Text>
        {isVerified && <Text style={styles.verified}>✓ Verified</Text>}
      </View>
      {/* ... rest of component */}
    </View>
  );
}
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: integrate Mahjic API for player profiles"
```

---

## Phase 7: Polish & App Store Prep

### Task 14: App Icons & Splash Screen

**Files:**
- Create: `assets/icon.png` (1024x1024)
- Create: `assets/splash.png` (1284x2778)
- Create: `assets/adaptive-icon.png` (1024x1024)

**Step 1: Create or copy icon assets**

Copy the Mahjic hummingbird logo to:
- `assets/icon.png` - 1024x1024, app icon
- `assets/adaptive-icon.png` - 1024x1024, Android adaptive (foreground only)
- `assets/splash.png` - Full screen splash with logo centered

**Step 2: Update app.json with proper metadata**

```json
{
  "expo": {
    "name": "Mahjic",
    "slug": "mahjic",
    "scheme": "mahjic",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FDF8F3"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "org.mahjic.app",
      "infoPlist": {
        "NFCReaderUsageDescription": "Tap NFC stickers to join Mahjong tables"
      }
    },
    "android": {
      "package": "org.mahjic.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FDF8F3"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      ["expo-camera", {
        "cameraPermission": "Allow Mahjic to scan QR codes to join tables"
      }],
      ["expo-notifications", {
        "icon": "./assets/notification-icon.png",
        "color": "#1B4D3E"
      }]
    ],
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add app icons and splash screen"
```

---

### Task 15: Build & Submit

**Step 1: Install EAS CLI**

```bash
npm install -g eas-cli
eas login
```

**Step 2: Configure EAS Build**

```bash
eas build:configure
```

Creates `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

**Step 3: Build for iOS**

```bash
eas build --platform ios --profile production
```

**Step 4: Submit to App Store**

```bash
eas submit --platform ios
```

**Step 5: Commit**

```bash
git add .
git commit -m "chore: add EAS build configuration"
```

---

## Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| 1. Setup & Auth | Expo scaffold, Supabase, magic link | ⬜ |
| 2. Table Linking | QR generate, QR scan, deep links | ⬜ |
| 3. Game Play | Game On screen, Enter Result, confirmations | ⬜ |
| 4. Proxy Players | Add by email, add guest | ⬜ |
| 5. NFC Support | Read stickers, write stickers | ⬜ |
| 6. API Integration | Connect to mahjic.org, sync ratings | ⬜ |
| 7. Polish | Icons, splash, App Store submit | ⬜ |

**Estimated total:** 15 tasks across 7 phases

---

## Database Schema (Supabase)

The mobile app needs these additional tables:

```sql
-- Table sessions for real-time sync
CREATE TABLE table_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(7) NOT NULL UNIQUE,
  host_id UUID NOT NULL REFERENCES auth.users(id),
  players JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game results for confirmation flow
CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_session_id UUID NOT NULL REFERENCES table_sessions(id),
  winner_id UUID REFERENCES auth.users(id),
  line_number INTEGER,
  confirmations JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Push tokens for notifications
CREATE TABLE player_push_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  token TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE table_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE game_results;
```

---

## Related Files

- Design doc: `docs/plans/2026-01-31-mahjic-mobile-app-design.md`
- Existing ELO: `/Users/sterlinglcannon/Desktop/Mahjic/src/lib/elo.ts`
- Existing API: `/Users/sterlinglcannon/Desktop/Mahjic/src/app/api/v1/`
- Existing Stripe: `/Users/sterlinglcannon/Desktop/Mahjic/src/lib/stripe.ts`
