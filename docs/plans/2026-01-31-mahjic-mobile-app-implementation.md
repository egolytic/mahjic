# Mahjic Mobile App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a native mobile app for Mahjong players with:
- **Club integration** - Find your clubs, browse events, register, view schedule (via Bam Good Time)
- **Game recording** - QR-based table linking, real-time scoring, push notification confirmations
- **Rating tracking** - Synced with mahjic.org

**Auth:** Users log in with their Bam Good Time account. Must be a member of at least one club. If no clubs, prompt to ask organizer about bamgoodtime.com.

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

## Phase 2: Clubs & Events (Bam Good Time Integration)

### Task 5: Club Store & Bam Good Time API

**Files:**
- Create: `lib/bamApi.ts`
- Create: `stores/clubStore.ts`
- Modify: `lib/types.ts`

**Step 1: Create Bam Good Time API client**

Create `lib/bamApi.ts`:

```tsx
import { supabase } from './supabase';

const BAM_API_BASE = 'https://bamgoodtime.com/api';

export interface Club {
  id: string;
  slug: string;
  name: string;
  branding?: {
    logo_url?: string;
    primary_color?: string;
    tagline?: string;
  };
}

export interface ClubMembership {
  orgId: string;
  orgSlug: string;
  orgName: string;
  role: 'player' | 'helper' | 'admin';
  logoUrl?: string;
}

export interface Event {
  id: string;
  orgId: string;
  title: string;
  description?: string;
  type: 'lesson' | 'open_play' | 'league' | 'event';
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  capacity?: number;
  registeredCount: number;
  priceCents: number;
  paymentMode: 'free' | 'honor' | 'formal';
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  isRegistered: boolean;
  isWaitlisted: boolean;
}

export interface Registration {
  id: string;
  eventId: string;
  status: 'registered' | 'waitlist' | 'cancelled' | 'attended';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  createdAt: string;
}

// Fetch all clubs the current user is a member of
export async function fetchUserClubs(): Promise<ClubMembership[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Query users table grouped by org to find all memberships
  const { data: memberships, error } = await supabase
    .from('users')
    .select(`
      org_id,
      role,
      organizations!inner (
        id,
        slug,
        name,
        branding
      )
    `)
    .eq('id', user.id);

  if (error || !memberships) return [];

  return memberships.map((m: any) => ({
    orgId: m.org_id,
    orgSlug: m.organizations.slug,
    orgName: m.organizations.name,
    role: m.role,
    logoUrl: m.organizations.branding?.logo_url,
  }));
}

// Fetch upcoming events for a club
export async function fetchClubEvents(orgId: string): Promise<Event[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().split('T')[0];

  const { data: events, error } = await supabase
    .from('events')
    .select(`
      id,
      org_id,
      title,
      description,
      type,
      date,
      start_time,
      end_time,
      location,
      capacity,
      price_cents,
      payment_mode,
      status,
      registrations!left (
        id,
        user_id,
        status
      )
    `)
    .eq('org_id', orgId)
    .eq('status', 'published')
    .gte('date', today)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(20);

  if (error || !events) return [];

  return events.map((e: any) => {
    const myReg = e.registrations?.find((r: any) => r.user_id === user?.id);
    const activeRegs = e.registrations?.filter((r: any) =>
      r.status === 'registered' || r.status === 'waitlist'
    ) || [];

    return {
      id: e.id,
      orgId: e.org_id,
      title: e.title,
      description: e.description,
      type: e.type,
      date: e.date,
      startTime: e.start_time,
      endTime: e.end_time,
      location: e.location,
      capacity: e.capacity,
      registeredCount: activeRegs.filter((r: any) => r.status === 'registered').length,
      priceCents: e.price_cents || 0,
      paymentMode: e.payment_mode || 'free',
      status: e.status,
      isRegistered: myReg?.status === 'registered',
      isWaitlisted: myReg?.status === 'waitlist',
    };
  });
}

// Fetch user's upcoming registrations across all clubs
export async function fetchMySchedule(): Promise<(Event & { clubName: string })[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date().toISOString().split('T')[0];

  const { data: registrations, error } = await supabase
    .from('registrations')
    .select(`
      id,
      status,
      events!inner (
        id,
        org_id,
        title,
        date,
        start_time,
        end_time,
        location,
        type,
        organizations!inner (
          name
        )
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['registered', 'waitlist'])
    .gte('events.date', today)
    .order('events(date)', { ascending: true })
    .limit(20);

  if (error || !registrations) return [];

  return registrations.map((r: any) => ({
    id: r.events.id,
    orgId: r.events.org_id,
    title: r.events.title,
    date: r.events.date,
    startTime: r.events.start_time,
    endTime: r.events.end_time,
    location: r.events.location,
    type: r.events.type,
    clubName: r.events.organizations.name,
    isRegistered: r.status === 'registered',
    isWaitlisted: r.status === 'waitlist',
    // Minimal fields for schedule view
    description: undefined,
    capacity: undefined,
    registeredCount: 0,
    priceCents: 0,
    paymentMode: 'free' as const,
    status: 'published' as const,
  }));
}

// Register for an event (calls Bam Good Time API for atomic registration)
export async function registerForEvent(
  eventId: string,
  orgSlug: string
): Promise<{ success: boolean; waitlisted?: boolean; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(
      `https://${orgSlug}.bamgoodtime.com/api/events/${eventId}/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error || 'Registration failed' };
    }

    const data = await response.json();
    return { success: true, waitlisted: data.waitlisted };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}
```

**Step 2: Create club store**

Create `stores/clubStore.ts`:

```tsx
import { create } from 'zustand';
import {
  ClubMembership,
  Event,
  fetchUserClubs,
  fetchClubEvents,
  fetchMySchedule,
  registerForEvent,
} from '../lib/bamApi';

interface ClubState {
  clubs: ClubMembership[];
  selectedClub: ClubMembership | null;
  events: Event[];
  schedule: (Event & { clubName: string })[];
  loading: boolean;
  error: string | null;

  // Actions
  loadClubs: () => Promise<void>;
  selectClub: (club: ClubMembership) => void;
  loadEvents: () => Promise<void>;
  loadSchedule: () => Promise<void>;
  register: (eventId: string) => Promise<{ success: boolean; waitlisted?: boolean; error?: string }>;
}

export const useClubStore = create<ClubState>((set, get) => ({
  clubs: [],
  selectedClub: null,
  events: [],
  schedule: [],
  loading: false,
  error: null,

  loadClubs: async () => {
    set({ loading: true, error: null });
    const clubs = await fetchUserClubs();
    set({
      clubs,
      loading: false,
      selectedClub: clubs.length > 0 ? clubs[0] : null,
    });

    // Auto-load events if we have a club
    if (clubs.length > 0) {
      get().loadEvents();
    }
  },

  selectClub: (club: ClubMembership) => {
    set({ selectedClub: club, events: [] });
    get().loadEvents();
  },

  loadEvents: async () => {
    const { selectedClub } = get();
    if (!selectedClub) return;

    set({ loading: true });
    const events = await fetchClubEvents(selectedClub.orgId);
    set({ events, loading: false });
  },

  loadSchedule: async () => {
    set({ loading: true });
    const schedule = await fetchMySchedule();
    set({ schedule, loading: false });
  },

  register: async (eventId: string) => {
    const { selectedClub } = get();
    if (!selectedClub) return { success: false, error: 'No club selected' };

    const result = await registerForEvent(eventId, selectedClub.orgSlug);

    if (result.success) {
      // Refresh events to update registration status
      get().loadEvents();
      get().loadSchedule();
    }

    return result;
  },
}));
```

**Step 3: Commit**

```bash
git add lib/bamApi.ts stores/clubStore.ts
git commit -m "feat: add Bam Good Time API client and club store"
```

---

### Task 6: Home Screen with Club Integration

**Files:**
- Modify: `app/home.tsx`
- Create: `components/ClubCard.tsx`
- Create: `components/NoClubPrompt.tsx`

**Step 1: Create NoClubPrompt component**

Create `components/NoClubPrompt.tsx`:

```tsx
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

export function NoClubPrompt() {
  const handleLearnMore = () => {
    Linking.openURL('https://bamgoodtime.com');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🀄</Text>
      <Text style={styles.title}>Join a Club</Text>
      <Text style={styles.description}>
        Ask your Mahjong organizer to set up their club on Bam Good Time to find games, register for events, and track your rating.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleLearnMore}>
        <Text style={styles.buttonText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B4D3E',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#E8F0ED',
    borderRadius: 8,
  },
  buttonText: {
    color: '#1B4D3E',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

**Step 2: Create ClubCard component**

Create `components/ClubCard.tsx`:

```tsx
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ClubMembership } from '../lib/bamApi';

interface ClubCardProps {
  club: ClubMembership;
  isSelected: boolean;
  onPress: () => void;
}

export function ClubCard({ club, isSelected, onPress }: ClubCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
    >
      {club.logoUrl ? (
        <Image source={{ uri: club.logoUrl }} style={styles.logo} />
      ) : (
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>{club.orgName.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{club.orgName}</Text>
        <Text style={styles.role}>{club.role}</Text>
      </View>
      {isSelected && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: '#1B4D3E',
    backgroundColor: '#F8FBF9',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F0ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  role: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  checkmark: {
    fontSize: 18,
    color: '#1B4D3E',
    fontWeight: 'bold',
  },
});
```

**Step 3: Update home screen**

Modify `app/home.tsx`:

```tsx
import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useClubStore } from '../stores/clubStore';
import { ClubCard } from '../components/ClubCard';
import { NoClubPrompt } from '../components/NoClubPrompt';

export default function HomeScreen() {
  const router = useRouter();
  const { signOut, playerProfile } = useAuthStore();
  const { clubs, selectedClub, loading, loadClubs, selectClub, schedule, loadSchedule } = useClubStore();

  useEffect(() => {
    loadClubs();
    loadSchedule();
  }, []);

  const rating = playerProfile?.rating ?? 1200;
  const hasClubs = clubs.length > 0;
  const upcomingEvent = schedule[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => { loadClubs(); loadSchedule(); }} />
      }
    >
      {/* Rating Display */}
      <View style={styles.ratingSection}>
        <Text style={styles.rating}>{Math.round(rating)}</Text>
        <Text style={styles.label}>Your Rating</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
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
      </View>

      {/* Club Section */}
      {hasClubs ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Clubs</Text>
            <TouchableOpacity onPress={() => router.push('/clubs')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {clubs.slice(0, 2).map((club) => (
            <ClubCard
              key={club.orgId}
              club={club}
              isSelected={selectedClub?.orgId === club.orgId}
              onPress={() => selectClub(club)}
            />
          ))}

          {/* Next Event Preview */}
          {upcomingEvent && (
            <TouchableOpacity
              style={styles.nextEvent}
              onPress={() => router.push('/schedule')}
            >
              <Text style={styles.nextEventLabel}>NEXT UP</Text>
              <Text style={styles.nextEventTitle}>{upcomingEvent.title}</Text>
              <Text style={styles.nextEventDate}>
                {new Date(upcomingEvent.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })} • {upcomingEvent.startTime}
              </Text>
            </TouchableOpacity>
          )}

          {/* Events Link */}
          <TouchableOpacity
            style={styles.eventsLink}
            onPress={() => router.push('/events')}
          >
            <Text style={styles.eventsLinkText}>Browse Events →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <NoClubPrompt />
      )}

      {/* Sign Out */}
      <TouchableOpacity onPress={signOut} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F3',
  },
  content: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  rating: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  actions: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  primaryButton: {
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
  section: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
  seeAll: {
    fontSize: 14,
    color: '#E07A5F',
    fontWeight: '600',
  },
  nextEvent: {
    backgroundColor: '#1B4D3E',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  nextEventLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  nextEventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  nextEventDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  eventsLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  eventsLinkText: {
    fontSize: 16,
    color: '#1B4D3E',
    fontWeight: '600',
  },
  signOut: {
    marginTop: 32,
    alignItems: 'center',
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
git commit -m "feat: add club integration to home screen with no-club prompt"
```

---

### Task 7: Events List Screen

**Files:**
- Create: `app/events.tsx`
- Create: `components/EventCard.tsx`

**Step 1: Create EventCard component**

Create `components/EventCard.tsx`:

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Event } from '../lib/bamApi';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  lesson: 'Lesson',
  open_play: 'Open Play',
  league: 'League',
  event: 'Event',
};

export function EventCard({ event, onPress }: EventCardProps) {
  const dateObj = new Date(event.date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });

  const spotsLeft = event.capacity ? event.capacity - event.registeredCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const price = event.priceCents > 0 ? `$${(event.priceCents / 100).toFixed(0)}` : 'Free';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.dateBox}>
        <Text style={styles.dayName}>{dayName}</Text>
        <Text style={styles.dayNum}>{dayNum}</Text>
        <Text style={styles.month}>{month}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.typeRow}>
          <Text style={styles.type}>{EVENT_TYPE_LABELS[event.type] || event.type}</Text>
          {event.isRegistered && <Text style={styles.badge}>Registered</Text>}
          {event.isWaitlisted && <Text style={[styles.badge, styles.badgeWaitlist]}>Waitlist</Text>}
        </View>
        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.time}>{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</Text>
        {event.location && (
          <Text style={styles.location} numberOfLines={1}>{event.location}</Text>
        )}
      </View>

      <View style={styles.meta}>
        <Text style={styles.price}>{price}</Text>
        {spotsLeft !== null && (
          <Text style={[styles.spots, isFull && styles.spotsFull]}>
            {isFull ? 'Full' : `${spotsLeft} left`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dateBox: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FBF9',
    borderRadius: 8,
    padding: 8,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  dayNum: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
  month: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  type: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E07A5F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#1B4D3E',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
    overflow: 'hidden',
  },
  badgeWaitlist: {
    backgroundColor: '#F59E0B',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  time: {
    fontSize: 13,
    color: '#666',
  },
  location: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  meta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B4D3E',
  },
  spots: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  spotsFull: {
    color: '#EF4444',
    fontWeight: '600',
  },
});
```

**Step 2: Create events list screen**

Create `app/events.tsx`:

```tsx
import { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useClubStore } from '../stores/clubStore';
import { EventCard } from '../components/EventCard';
import { ClubCard } from '../components/ClubCard';

export default function EventsScreen() {
  const router = useRouter();
  const { clubs, selectedClub, events, loading, selectClub, loadEvents } = useClubStore();

  useEffect(() => {
    if (selectedClub) {
      loadEvents();
    }
  }, [selectedClub]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backButton}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Events</Text>
      <View style={{ width: 60 }} />
    </View>
  );

  const renderClubSelector = () => (
    <View style={styles.clubSelector}>
      {clubs.map((club) => (
        <TouchableOpacity
          key={club.orgId}
          style={[
            styles.clubTab,
            selectedClub?.orgId === club.orgId && styles.clubTabActive,
          ]}
          onPress={() => selectClub(club)}
        >
          <Text
            style={[
              styles.clubTabText,
              selectedClub?.orgId === club.orgId && styles.clubTabTextActive,
            ]}
            numberOfLines={1}
          >
            {club.orgName}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No upcoming events</Text>
      <Text style={styles.emptySubtext}>Check back later for new events</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {clubs.length > 1 && renderClubSelector()}

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => router.push(`/event/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadEvents} />
        }
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 16,
    color: '#1B4D3E',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
  clubSelector: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  clubTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  clubTabActive: {
    backgroundColor: '#1B4D3E',
    borderColor: '#1B4D3E',
  },
  clubTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  clubTabTextActive: {
    color: '#FFF',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add events list screen with club filtering"
```

---

### Task 8: Event Detail & Registration Screen

**Files:**
- Create: `app/event/[id].tsx`

**Step 1: Create event detail screen**

Create `app/event/[id].tsx`:

```tsx
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useClubStore } from '../../stores/clubStore';
import { Event } from '../../lib/bamApi';

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, selectedClub, register } = useClubStore();
  const [registering, setRegistering] = useState(false);

  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Event not found</Text>
        </View>
      </View>
    );
  }

  const dateObj = new Date(event.date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const price = event.priceCents > 0 ? `$${(event.priceCents / 100).toFixed(2)}` : 'Free';
  const spotsLeft = event.capacity ? event.capacity - event.registeredCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const canRegister = !event.isRegistered && !event.isWaitlisted;

  const handleRegister = async () => {
    if (!canRegister) return;

    setRegistering(true);
    const result = await register(event.id);
    setRegistering(false);

    if (result.success) {
      Alert.alert(
        result.waitlisted ? 'Added to Waitlist' : 'Registered!',
        result.waitlisted
          ? "You're on the waitlist. We'll notify you if a spot opens up."
          : 'You are registered for this event.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to register');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.type}>{event.type.replace('_', ' ').toUpperCase()}</Text>
        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>{formattedDate}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Time</Text>
          <Text style={styles.infoValue}>
            {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
          </Text>
        </View>

        {event.location && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{event.location}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Price</Text>
          <Text style={styles.infoValue}>{price}</Text>
        </View>

        {event.capacity && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Capacity</Text>
            <Text style={[styles.infoValue, isFull && styles.infoValueFull]}>
              {event.registeredCount} / {event.capacity}
              {isFull ? ' (Full)' : ` (${spotsLeft} spots left)`}
            </Text>
          </View>
        )}

        {event.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionLabel}>About</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        {/* Status Badge */}
        {event.isRegistered && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>✓ You're registered</Text>
          </View>
        )}
        {event.isWaitlisted && (
          <View style={[styles.statusBadge, styles.statusBadgeWaitlist]}>
            <Text style={styles.statusText}>⏳ You're on the waitlist</Text>
          </View>
        )}
      </ScrollView>

      {/* Register Button */}
      {canRegister && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.registerButton, registering && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={registering}
          >
            {registering ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.registerButtonText}>
                {isFull ? 'Join Waitlist' : 'Register'} • {price}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F3',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 16,
    color: '#1B4D3E',
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  type: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E07A5F',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B4D3E',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  infoValueFull: {
    color: '#EF4444',
  },
  descriptionSection: {
    marginTop: 24,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  statusBadge: {
    marginTop: 24,
    backgroundColor: '#D1FAE5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusBadgeWaitlist: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#FDF8F3',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  registerButton: {
    height: 56,
    backgroundColor: '#1B4D3E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add event detail and registration screen"
```

---

### Task 9: My Schedule Screen

**Files:**
- Create: `app/schedule.tsx`

**Step 1: Create schedule screen**

Create `app/schedule.tsx`:

```tsx
import { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useClubStore } from '../stores/clubStore';
import { Event } from '../lib/bamApi';

interface ScheduleEvent extends Event {
  clubName: string;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { schedule, loading, loadSchedule } = useClubStore();

  useEffect(() => {
    loadSchedule();
  }, []);

  const renderEvent = ({ item }: { item: ScheduleEvent }) => {
    const dateObj = new Date(item.date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = dateObj.getDate();
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push(`/event/${item.id}`)}
      >
        <View style={styles.dateBox}>
          <Text style={styles.dayName}>{dayName}</Text>
          <Text style={styles.dayNum}>{dayNum}</Text>
          <Text style={styles.month}>{month}</Text>
        </View>

        <View style={styles.eventInfo}>
          <Text style={styles.clubName}>{item.clubName}</Text>
          <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.eventTime}>
            {item.startTime}{item.endTime ? ` - ${item.endTime}` : ''}
          </Text>
          {item.location && (
            <Text style={styles.eventLocation} numberOfLines={1}>{item.location}</Text>
          )}
        </View>

        {item.isWaitlisted && (
          <View style={styles.waitlistBadge}>
            <Text style={styles.waitlistText}>Waitlist</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyText}>No upcoming events</Text>
      <Text style={styles.emptySubtext}>
        Browse events to find games to join
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => router.push('/events')}
      >
        <Text style={styles.browseButtonText}>Browse Events</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Schedule</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={schedule}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadSchedule} />
        }
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 16,
    color: '#1B4D3E',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dateBox: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B4D3E',
    borderRadius: 8,
    padding: 8,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  dayNum: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  month: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  clubName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E07A5F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 13,
    color: '#666',
  },
  eventLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  waitlistBadge: {
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
  },
  waitlistText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#1B4D3E',
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add My Schedule screen"
```

---

## Phase 3: Table Linking (QR Code)

### Task 10: Table Store & Game Types

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

### Task 11: QR Code Generation (Start Table)

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

### Task 12: QR Code Scanner (Join Table)

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

## Phase 4: Game Play & Scoring

### Task 13: Game On Screen

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

### Task 14: Enter Result Screen

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

### Task 15: Push Notification Confirmation

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

## Phase 5: Proxy Players

### Task 16: Add Proxy Player Flow

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

## Phase 6: NFC Sticker Support

### Task 17: NFC Reading

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

## Phase 7: Mahjic API Integration

### Task 18: Connect to Mahjic API

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

## Phase 8: Polish & App Store Prep

### Task 19: App Icons & Splash Screen

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

### Task 20: Build & Submit

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
| 1. Setup & Auth | Expo scaffold, Supabase, magic link, deep links | ⬜ |
| 2. Clubs & Events | Bam Good Time API, club home, events, schedule, registration | ⬜ |
| 3. Table Linking | QR generate, QR scan | ⬜ |
| 4. Game Play | Game On screen, Enter Result, confirmations | ⬜ |
| 5. Proxy Players | Add by email, add guest | ⬜ |
| 6. NFC Support | Read stickers, write stickers | ⬜ |
| 7. API Integration | Connect to mahjic.org, sync ratings | ⬜ |
| 8. Polish | Icons, splash, App Store submit | ⬜ |

**Estimated total:** 20 tasks across 8 phases

**Auth Flow:** Users must have a Bam Good Time club account. Creating a profile on bamgoodtime.com automatically creates your Mahjic rating profile. The mobile app uses shared Supabase auth - same login works for both.

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
