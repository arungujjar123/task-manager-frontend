import React, { useState } from "react";
import { useNotification } from "../context/NotificationContext";

const NOTIFICATION_ENABLED_KEY = "browserNotificationsEnabled";

const NotificationSettings = () => {
  const { success, info, warning, error } = useNotification();
  const [isBrowserEnabled, setIsBrowserEnabled] = useState(
    localStorage.getItem(NOTIFICATION_ENABLED_KEY) === "true",
  );
  const [permission, setPermission] = useState(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  });

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      warning("Browser notifications are not supported in this browser.");
      return "unsupported";
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const handleBrowserToggle = async (event) => {
    const nextEnabled = event.target.checked;
    if (nextEnabled) {
      const result = await requestPermission();
      if (result === "granted") {
        localStorage.setItem(NOTIFICATION_ENABLED_KEY, "true");
        setIsBrowserEnabled(true);
        success("Browser notifications enabled.");
      } else {
        localStorage.setItem(NOTIFICATION_ENABLED_KEY, "false");
        setIsBrowserEnabled(false);
        if (result === "denied") {
          error("Notifications are blocked. Allow them in browser settings.");
        } else {
          warning("Notifications permission not granted.");
        }
      }
      return;
    }

    localStorage.setItem(NOTIFICATION_ENABLED_KEY, "false");
    setIsBrowserEnabled(false);
    info("Browser notifications disabled.");
  };

  const testBrowserNotification = () => {
    if (!("Notification" in window)) {
      warning("Browser notifications are not supported in this browser.");
      return;
    }
    if (Notification.permission !== "granted") {
      warning("Please allow browser notifications first.");
      return;
    }
    new Notification("Task Reminder", {
      body: "Test reminder from TaskManager.",
    });
  };

  const testSuccessNotification = () => {
    success("This is a success notification!");
  };

  const testInfoNotification = () => {
    info("This is an info notification!");
  };

  const testWarningNotification = () => {
    warning("This is a warning notification!");
  };

  const testErrorNotification = () => {
    error("This is an error notification!");
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Reminder pop-ups work only when this tab is open. Enable browser
          notifications to receive reminder alerts.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-md px-4 py-3 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-800">
              Browser Notifications
            </p>
            <p className="text-xs text-gray-500">Permission: {permission}</p>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={isBrowserEnabled}
              onChange={handleBrowserToggle}
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors ${
                isBrowserEnabled ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`h-5 w-5 bg-white rounded-full shadow transform transition-transform ${
                  isBrowserEnabled ? "translate-x-5" : "translate-x-1"
                }`}
              ></div>
            </div>
          </label>
        </div>

        <button
          onClick={testBrowserNotification}
          className="mb-4 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Test Browser Reminder
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={testSuccessNotification}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Test Success
          </button>

          <button
            onClick={testInfoNotification}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Test Info
          </button>

          <button
            onClick={testWarningNotification}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Test Warning
          </button>

          <button
            onClick={testErrorNotification}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Test Error
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
