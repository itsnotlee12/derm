import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '@/lib/constants';
import {
  getCurrentUser,
  getAppNotifications,
  markAppNotificationRead,
} from '@/lib/store';
import type { AppNotification } from '@/lib/store';

const TYPE_CONFIG: Record<
  AppNotification['type'],
  { emoji: string; color: string; bg: string }
> = {
  appointment: { emoji: '📅', color: '#2563eb', bg: '#dbeafe' },
  scan: { emoji: '🔬', color: COLORS.primary, bg: COLORS.primaryLight },
  subscription: { emoji: '⭐', color: '#d97706', bg: '#fef3c7' },
  general: { emoji: '🔔', color: COLORS.textSecondary, bg: COLORS.border },
};

// Override config for appointment subtypes
function getNotifConfig(notif: AppNotification): { emoji: string; color: string; bg: string; borderColor?: string } {
  if (notif.subtype === 'appointment-scheduled') {
    return { emoji: '✅', color: '#15803d', bg: '#dcfce7', borderColor: '#86efac' };
  }
  if (notif.subtype === 'appointment-rejected') {
    return { emoji: '❌', color: '#dc2626', bg: '#fee2e2', borderColor: '#fca5a5' };
  }
  return TYPE_CONFIG[notif.type];
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  async function loadNotifications() {
    const user = await getCurrentUser();
    if (!user) return;
    setUserId(user.id);
    const notifs = await getAppNotifications(user.id);
    setNotifications(notifs);
  }

  async function handleMarkAllRead() {
    if (!userId) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markAppNotificationRead(userId, n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markBtn}>
            <Text style={styles.markBtnTxt}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 52, marginBottom: 12 }}>🔔</Text>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySub}>
            Appointment confirmations, scan results, and updates will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.list}>
            {notifications.map((notif) => {
              const config = getNotifConfig(notif);
              return (
                <View
                  key={notif.id}
                  style={[
                    styles.card,
                    !notif.read && styles.cardUnread,
                    config.borderColor ? { borderColor: config.borderColor, borderWidth: 1.5 } : undefined,
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
                    <Text style={styles.iconEmoji}>{config.emoji}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <Text style={[styles.cardTitle, { color: config.color }]} numberOfLines={1}>
                        {notif.title}
                      </Text>
                      {!notif.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.cardMsg} numberOfLines={3}>
                      {notif.message}
                    </Text>
                    <Text style={styles.cardTime}>
                      {timeAgo(notif.timestamp)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function timeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(isoString).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  markBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
  },
  markBtnTxt: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardUnread: {
    borderColor: COLORS.borderDark,
    backgroundColor: '#fff',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 20 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
    flexShrink: 0,
  },
  cardMsg: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 4 },
  cardTime: { fontSize: 11, color: COLORS.textLight },
});
