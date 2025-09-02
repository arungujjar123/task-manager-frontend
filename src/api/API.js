import axios from "axios";

// Create axios instance with default config
const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  // Add timeout to prevent hanging requests
  timeout: 15000,
});

// Interceptor to add token header automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request errors
    console.error("API request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle response errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("API response error:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });

      // Handle OAuth specific errors
      if (
        error.response.status === 401 &&
        error.response.data.message &&
        error.response.data.message.includes("OAuth")
      ) {
        console.error(
          "OAuth authentication error. Please reconnect your Google account."
        );
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Request setup error:", error.message);
    }

    return Promise.reject(error);
  }
);

// Helper function to toggle subtask completion
API.toggleSubtaskCompletion = async (taskId, subtaskId) => {
  try {
    const response = await API.patch(
      `/tasks/${taskId}/subtasks/${subtaskId}/toggle`
    );
    return response.data;
  } catch (error) {
    console.error("Error toggling subtask completion:", error);
    throw error;
  }
};

// // Helper function to remove a task from Google Calendar
// API.removeTaskFromCalendar = async (taskId) => {
//   try {
//     // First check if Google Calendar is connected
//     const statusResponse = await API.get("/calendar/status");
//     if (!statusResponse.data.connected) {
//       throw new Error(
//         "Google Calendar is not connected. Please connect it in Calendar Settings."
//       );
//     }

//     // Add retry logic for OAuth issues
//     const MAX_RETRIES = 2;
//     let retries = 0;
//     let lastError = null;

//     while (retries <= MAX_RETRIES) {
//       try {
//         const response = await API.delete(`/calendar/sync/task/${taskId}`, {
//           // Increase timeout for Google API calls
//           timeout: 20000,
//         });
//         return response.data;
//       } catch (error) {
//         lastError = error;

//         // Only retry on OAuth token errors
//         if (
//           error.response &&
//           error.response.status === 401 &&
//           error.response.data.message &&
//           error.response.data.message.includes("token")
//         ) {
//           console.log(
//             `Retrying due to OAuth error (Attempt ${retries + 1}/${
//               MAX_RETRIES + 1
//             })`
//           );
//           retries++;
//           // Wait before retrying
//           await new Promise((resolve) => setTimeout(resolve, 1000));
//         } else {
//           // For other errors, don't retry
//           throw error;
//         }
//       }
//     }

//     // If we've exhausted retries
//     throw lastError;
//   } catch (error) {
//     console.error("Error removing task from Google Calendar:", error);
//     throw error;
//   }
// };

export default API;
