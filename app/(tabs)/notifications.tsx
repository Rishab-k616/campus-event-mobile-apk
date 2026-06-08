import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { Header, NotificationCard, PrimaryButton, Screen } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { api, NotificationItem } from "@/utils/api";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unread = notifications.filter((item) => !item.is_read).length;

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
    }
    setError(null);
    try {
      setNotifications(await api.getNotifications());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load])
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      await load();
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Could not mark notification as read.");
    }
  };

  const markAll = async () => {
    try {
      await api.markAllNotificationsRead();
      await load();
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Could not mark notifications as read.");
    }
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}>
      <Header title="Notification center" subtitle="Approvals, event updates, notices, and unread items." variant="student" />
      <View style={styles.summary}>
        <Text style={styles.summaryValue}>{unread}</Text>
        <Text style={styles.summaryLabel}>unread notifications</Text>
        <PrimaryButton title="Mark all as read" tone="muted" onPress={markAll} icon="checkmark-done-outline" />
      </View>
      {loading ? <Text style={styles.empty}>Loading notifications...</Text> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <PrimaryButton title="Try again" tone="muted" icon="refresh-outline" onPress={() => load(true)} />
        </View>
      ) : null}
      {notifications.map((item) => <NotificationCard key={item.id} item={item} onRead={() => markRead(item.id)} />)}
      {!loading && !notifications.length && !error ? <Text style={styles.empty}>No notifications yet.</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  summaryValue: { color: colors.text, fontSize: 34, fontWeight: "900" },
  summaryLabel: { color: colors.muted, fontWeight: "800" },
  errorBox: { backgroundColor: "#FEF2F2", borderColor: "#FECACA", borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  errorText: { color: colors.red, fontWeight: "800", lineHeight: 20 },
  empty: { color: colors.muted, textAlign: "center", fontWeight: "700", marginTop: spacing.lg }
});
