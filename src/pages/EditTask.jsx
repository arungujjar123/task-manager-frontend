import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/API";
import { useNotification } from "../context/NotificationContext";

export default function EditTask() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useNotification();

  // form state (controlled inputs)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(""); // yyyy-mm-dd for input[type=date]
  const [reminder, setReminder] = useState(""); // datetime-local
  const [status, setStatus] = useState("pending");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Other");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState("none");
  const [recurringDay, setRecurringDay] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [error, setError] = useState("");

  // 3) fetch task when component mounts (or id/token changes)
  useEffect(() => {
    // redirect if not logged in
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchTask = async () => {
      try {
        setLoading(true);
        // If your API instance already attaches token via interceptor,
        // you can simply call API.get(`/tasks/${id}`)
        const res = await API.get(`/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` }, // safe explicit header
        });

        const task = res.data;
        // populate form fields
        setTitle(task.title || "");
        setDescription(task.description || "");
        // convert ISO to yyyy-mm-dd for input[type=date]
        setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
        setReminder(task.reminder ? task.reminder.replace("Z", "") : "");
        setStatus(task.status || "pending");
        setPriority(task.priority || "Medium");
        setCategory(task.category || "Other");
        setIsRecurring(task.isRecurring || false);
        setRecurringType(task.recurringType || "none");
        setRecurringDay(
          task.recurringDay !== null && task.recurringDay !== undefined
            ? task.recurringDay.toString()
            : "0"
        );

        // Set subtasks if available
        setSubtasks(task.subtasks || []);
      } catch (err) {
        // handle errors: 401 -> redirect, 404 -> show message
        const msg = err?.response?.data?.message || err.message;
        setError(msg);
        if (err?.response?.status === 401) {
          // token problem -> force login
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id, token, navigate]);

  // 4) submit handler — send updated fields to backend
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");

    // basic validation
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }

    try {
      console.log("Updating task with subtasks:", subtasks);
      const payload = {
        title,
        description,
        status,
        dueDate: dueDate || null,
        reminder: reminder || null,
        priority,
        category,
        isRecurring,
        recurringType: isRecurring ? recurringType : "none",
        recurringDay:
          isRecurring && recurringType === "weekly" ? recurringDay : null,
        subtasks,
      };

      await API.put(`/tasks/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Success notification
      success("Task updated successfully!");
      
      // Navigate back to dashboard
      navigate("/dashboard");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update task";
      setError(msg);
      showError(msg); // Show notification error
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  // Subtask management functions
  const addSubtask = () => {
    if (newSubtask.trim() !== "") {
      setSubtasks([
        ...subtasks,
        { title: newSubtask.trim(), completed: false },
      ]);
      setNewSubtask("");
    }
  };

  const removeSubtask = (index) => {
    const updatedSubtasks = [...subtasks];
    updatedSubtasks.splice(index, 1);
    setSubtasks(updatedSubtasks);
  };

  const toggleSubtask = (index) => {
    const updatedSubtasks = [...subtasks];
    updatedSubtasks[index].completed = !updatedSubtasks[index].completed;
    setSubtasks(updatedSubtasks);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Task</h2>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to tasks
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-500 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-red-700 font-medium text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Task Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="Enter task title"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                placeholder="Enter task description"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition-colors min-h-[120px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="reminder"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reminder Date
              </label>
              <input
                id="reminder"
                type="datetime-local"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Set a reminder for this task (optional)
              </p>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Priority
              </label>
              <select
                id="priority"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="category"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Shopping">Shopping</option>
                <option value="Study">Study</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Subtasks Section */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtasks
              </label>

              <div className="space-y-2 mb-4">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => toggleSubtask(index)}
                      className="h-4 w-4 mr-2 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span
                      className={`flex-grow px-3 py-2 bg-gray-50 rounded-l-md border border-r-0 border-gray-300 ${
                        subtask.completed ? "line-through text-gray-500" : ""
                      }`}
                    >
                      {subtask.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(index)}
                      className="px-3 py-2 bg-red-50 text-red-700 rounded-r-md border border-gray-300 hover:bg-red-100"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex">
                <input
                  type="text"
                  placeholder="Add a subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  className="flex-grow px-4 py-2 rounded-l-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubtask();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addSubtask}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Recurring Task Options */}
            <div className="mt-4">
              <div className="flex items-center mb-2">
                <input
                  id="isRecurring"
                  name="isRecurring"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <label
                  htmlFor="isRecurring"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Make this a recurring task
                </label>
              </div>

              {isRecurring && (
                <div className="ml-6 space-y-4 mt-2 p-3 bg-gray-50 rounded-md">
                  <div>
                    <label
                      htmlFor="recurringType"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Repeat
                    </label>
                    <select
                      id="recurringType"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={recurringType}
                      onChange={(e) => setRecurringType(e.target.value)}
                    >
                      <option value="none">Select frequency</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {recurringType === "weekly" && (
                    <div>
                      <label
                        htmlFor="recurringDay"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Day of Week
                      </label>
                      <select
                        id="recurringDay"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={recurringDay}
                        onChange={(e) => setRecurringDay(e.target.value)}
                      >
                        <option value="0">Sunday</option>
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                      </select>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 italic">
                    {recurringType === "daily" &&
                      "This task will repeat every day"}
                    {recurringType === "weekly" &&
                      "This task will repeat on the same day every week"}
                    {recurringType === "monthly" &&
                      "This task will repeat on the same date every month"}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Update Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
