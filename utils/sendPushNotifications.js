import { getMessaging } from "firebase-admin/messaging";

export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  try {
    const message = {
      notification: { title, body },
      data,
      token: fcmToken,
    };

    const response = await getMessaging().send(message);
    console.log("✅ Notification sent:", response);
    return true;
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    return false;
  }
};

export const sendToMultipleUsers = async (users, title, body, data = {}) => {
  if (!Array.isArray(users) || users.length === 0) {
    console.log("⚠️ No users to send notifications to.");
    return [];
  }

  const results = await Promise.all(users.map(async (user, index) => {
    const fcmToken = user?.fcmToken || user?.user?.fcmToken;
    if (!fcmToken) {
      console.log(`⚠️ User ${user._id} has no FCM token.`);
      return false;
    }
    return await sendPushNotification(fcmToken, title, body, data);
  }));

  return results;
};