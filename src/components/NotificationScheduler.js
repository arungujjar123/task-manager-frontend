import React, { useEffect, useRef } from "react";
import API from "../api/API";
import { useNotification } from "../context/NotificationContext";

const NOTIFICATION_ENABLED_KEY = "browserNotificationsEnabled";
const NOTIFIED_REMINDERS_KEY = "notifiedReminders";
const POLL_INTERVAL_MS = 30000;
const REMINDER_WINDOW_MS = 60000;

const loadNotifiedMap = () => {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_REMINDERS_KEY) || "{}");
  } catch {
    return {};
  }
};

const saveNotifiedMap = (map) => {
  localStorage.setItem(NOTIFIED_REMINDERS_KEY, JSON.stringify(map));
};

const NotificationScheduler = () => {
  const { info, warning } = useNotification();
  const warnedRef = useRef(false);

  useEffect(() => {
    let intervalId;
    let isActive = true;

    const checkReminders = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const enabled = localStorage.getItem(NOTIFICATION_ENABLED_KEY) === "true";
      if (!enabled) {
        return;
      }

      if (!("Notification" in window)) {
        if (!warnedRef.current) {
          warning("Browser notifications are not supported in this browser.");
          warnedRef.current = true;
        }
        return;
      }

      if (Notification.permission !== "granted") {
        if (!warnedRef.current) {
          info("Allow browser notifications to receive reminder pop-ups.");
          warnedRef.current = true;
        }
        return;
      }

      try {
        const response = await API.get("/tasks");
        const tasks = Array.isArray(response.data) ? response.data : [];
        const now = Date.now();
        const notifiedMap = loadNotifiedMap();
        let updated = false;

        for (const task of tasks) {
          if (!task.reminder) {
            continue;
          }

          const reminderTime = new Date(task.reminder).getTime();
          if (Number.isNaN(reminderTime)) {
            continue;
          }

          const reminderIso = new Date(reminderTime).toISOString();
          const alreadyNotified = notifiedMap[task._id] === reminderIso;

          if (alreadyNotified) {
            continue;
          }

          const isDue =
            reminderTime <= now && now - reminderTime <= REMINDER_WINDOW_MS;
          if (isDue) {
            new Notification("Task Reminder", {
              body: task.title || "You have a task reminder.",
            });
            notifiedMap[task._id] = reminderIso;
            updated = true;
          }
        }

        if (updated) {
          saveNotifiedMap(notifiedMap);
        }
      } catch (error) {
        console.error("Failed to check task reminders:", error);
      }
    };

    checkReminders();
    intervalId = setInterval(() => {
      if (isActive) {
        checkReminders();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [info, warning]);

  return null;
};

export default NotificationScheduler;
