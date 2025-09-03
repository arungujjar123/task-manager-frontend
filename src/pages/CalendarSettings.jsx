import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/API";
import NotificationSettings from "../components/NotificationSettings";
import { useNotification } from "../context/NotificationContext";

const CalendarSettings = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [syncSettings, setSyncSettings] = useState({
    syncTasksToCalendar: false,
    calendarSyncFrequency: "manual",
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { success, error, warning } = useNotification();

  useEffect(() => {
    const fetchCalendarStatus = async () => {
      try {
        const response = await API.get("/calendar/status");
        setIsConnected(response.data.connected);
        setSyncSettings(response.data.settings);

        // Show appropriate messages if there are configuration issues
        if (!response.data.envConfigured) {
          warning(
            "Google Calendar API credentials are not configured on the server. Please ask your administrator to set up the required credentials."
          );
        } else if (
          response.data.tokenStatus === "invalid" &&
          response.data.connected
        ) {
          warning(
            "Your Google Calendar access has expired. Please reconnect your account."
          );
        }
      } catch (error) {
        console.error("Error fetching calendar status:", error);
        error("Failed to load calendar settings");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarStatus();

    // Check URL parameters for connection status
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar") === "connected") {
      success("Google Calendar connected successfully!");
      // Clear the URL parameter
      navigate("/settings", { replace: true });
      // Refresh status
      fetchCalendarStatus();
    }
  }, [navigate, success, error, warning]);

  const handleConnectCalendar = async () => {
    try {
      setLoading(true);
      const response = await API.post("/calendar/connect");

      // Check if we got an authUrl
      if (!response.data.authUrl) {
        throw new Error("Failed to get authorization URL from server");
      }

      // Redirect user to Google OAuth consent screen
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error("Error connecting to Google Calendar:", error);

      // More specific error message based on the error
      let errorMessage = "Failed to connect to Google Calendar";

      if (error.response) {
        // Server responded with an error
        if (error.response.status === 400) {
          errorMessage =
            "Google Calendar API credentials are not configured correctly. Please contact the administrator.";
        } else if (error.response.status === 500) {
          errorMessage =
            "Server error when connecting to Google Calendar. Please try again later.";
        }
      } else if (error.request) {
        // No response received
        errorMessage =
          "No response from server. Please check your internet connection.";
      }

      error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    try {
      setLoading(true);
      await API.post("/calendar/disconnect");
      setIsConnected(false);
      success("Google Calendar disconnected successfully");
    } catch (err) {
      console.error("Error disconnecting Google Calendar:", err);
      error("Failed to disconnect Google Calendar");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAllTasks = async () => {
    try {
      setLoading(true);
      const response = await API.post("/calendar/sync/all");
      success(
        `Successfully synced ${response.data.syncResults.length} tasks to Google Calendar`
      );
    } catch (err) {
      console.error("Error syncing tasks to Google Calendar:", err);
      error("Failed to sync tasks to Google Calendar");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    const updatedSettings = {
      ...syncSettings,
      [name]: newValue,
    };

    setSyncSettings(updatedSettings);

    try {
      await API.put("/calendar/settings", updatedSettings);
    } catch (err) {
      console.error("Error updating calendar settings:", err);
      error("Failed to update settings");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Google Calendar Integration</h1>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              Google Calendar Connection
            </h2>
            <p className="text-gray-600 text-sm">
              {isConnected
                ? "Your account is connected to Google Calendar"
                : "Connect your account to sync tasks with Google Calendar"}
            </p>
          </div>

          {isConnected ? (
            <button
              onClick={handleDisconnectCalendar}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnectCalendar}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Connect Google Calendar
            </button>
          )}
        </div>

        {isConnected && (
          <>
            <hr className="my-4" />

            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Sync Settings</h3>

              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="syncTasksToCalendar"
                  name="syncTasksToCalendar"
                  checked={syncSettings.syncTasksToCalendar}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="syncTasksToCalendar"
                  className="ml-2 text-gray-700"
                >
                  Automatically sync tasks to Google Calendar
                </label>
              </div>

              <div className="mb-3">
                <label
                  htmlFor="calendarSyncFrequency"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sync Frequency
                </label>
                <select
                  id="calendarSyncFrequency"
                  name="calendarSyncFrequency"
                  value={syncSettings.calendarSyncFrequency}
                  onChange={handleSettingsChange}
                  disabled={!syncSettings.syncTasksToCalendar}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                  <option value="manual">Manual sync only</option>
                  <option value="onChange">Sync when tasks change</option>
                  <option value="daily">Sync daily</option>
                </select>
              </div>

              <button
                onClick={handleSyncAllTasks}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Sync All Tasks Now
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>
                <strong>Note:</strong> Tasks with due dates will be synced as
                calendar events on that date. Tasks without due dates will be
                synced as all-day events on today's date.
              </p>
            </div>

            {/* Troubleshooting Section */}
            <div className="mt-8 pt-4 border-t">
              <h3 className="text-md font-medium mb-4">Troubleshooting</h3>

              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Common Issues
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          If you see "OAuth client not found" error, the server
                          needs proper Google API credentials
                        </li>
                        <li>
                          Check{" "}
                          <a
                            href="https://calendar.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Google Calendar
                          </a>{" "}
                          directly to see if events are appearing
                        </li>
                        <li>
                          Try disconnecting and reconnecting your account if
                          sync isn't working
                        </li>
                        <li>
                          Make sure you have accepted all required permissions
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Notification Settings */}
      <NotificationSettings />
    </div>
  );
};

export default CalendarSettings;
