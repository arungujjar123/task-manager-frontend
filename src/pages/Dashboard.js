import React, { useState, useEffect, useMemo, useRef } from "react";
import API from "../api/API";
import { useNavigate } from "react-router-dom";
import KanbanBoard from "../components/KanbanBoard";
import { useNotification } from "../context/NotificationContext";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // "list" or "kanban"
  const [activeMenu, setActiveMenu] = useState(null);

  const menuRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { success, error: showError } = useNotification();

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await API.get("/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Tasks data:", res.data);
        setTasks(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [token, navigate]);

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const deleteTask = async (id) => {
    try {
      await API.delete(`/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => prev.filter((task) => task._id !== id));
      success("Task deleted successfully!");
    } catch (err) {
      console.error(err);
      showError("Failed to delete task. Please try again.");
    }
  };
  const completeTask = async (id) => {
    try {
      const response = await API.post(
        `/tasks/${id}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update the task list
      setTasks((prev) => {
        // Find and update the completed task
        const updatedTasks = prev.map((task) =>
          task._id === id ? { ...task, status: "completed" } : task
        );

        // If a new recurring task was created, add it to the list
        if (response.data.nextTask) {
          updatedTasks.unshift(response.data.nextTask);
        }

        return updatedTasks;
      });
      
      success("Task marked as complete!");
    } catch (err) {
      console.error(err);
      showError("Failed to mark task as complete. Please try again.");
    }
  };

  const getStatusColor = (dueDate) => {
    if (!dueDate) return "bg-gray-100";

    const today = new Date();
    const due = new Date(dueDate);

    // Set time to 00:00:00 for comparison
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    if (due < today) {
      return "bg-red-50 border-l-4 border-red-500";
    } else if (due.getTime() === today.getTime()) {
      return "bg-yellow-50 border-l-4 border-yellow-500";
    }
    return "bg-green-50 border-l-4 border-green-500";
  };

  // Filter tasks based on search query and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Text search filter
      const matchesSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      // Priority filter
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

      // Category filter
      const matchesCategory =
        categoryFilter === "all" || task.category === categoryFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
        if (taskDueDate) {
          taskDueDate.setHours(0, 0, 0, 0);

          if (dateFilter === "today") {
            matchesDate = taskDueDate.getTime() === today.getTime();
          } else if (dateFilter === "upcoming") {
            matchesDate = taskDueDate > today;
          } else if (dateFilter === "overdue") {
            matchesDate = taskDueDate < today;
          } else if (dateFilter === "week") {
            const weekLater = new Date(today);
            weekLater.setDate(weekLater.getDate() + 7);
            matchesDate = taskDueDate >= today && taskDueDate <= weekLater;
          }
        } else {
          // If task has no due date
          matchesDate = dateFilter === "no-date";
        }
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        matchesDate
      );
    });
  }, [
    tasks,
    searchQuery,
    statusFilter,
    priorityFilter,
    categoryFilter,
    dateFilter,
  ]);
  // 4️⃣ With useMemo example
  // const result = useMemo(() => {
  //   console.log("Calculating...");
  //   let sum = 0;
  //   for (let i = 0; i < 1000000000; i++) sum += i;
  //   return sum;
  // }, []); // [] ka matlab -> sirf pehli baar chalega

  // Ab button click karne pe calculation dobara nahi chalegi.

  // Sirf tab chalegi jab dependencies (array ke andar jo likha hai) change ho.

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          <button
            onClick={() => navigate("/add-task")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add New Task
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="mb-4">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search Tasks
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by title or description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status-filter"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label
                htmlFor="priority-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Priority
              </label>
              <select
                id="priority-filter"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label
                htmlFor="category-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="category-filter"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Shopping">Shopping</option>
                <option value="Study">Study</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label
                htmlFor="date-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Due Date
              </label>
              <select
                id="date-filter"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="today">Due Today</option>
                <option value="week">Due This Week</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
                <option value="no-date">No Due Date</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                View Mode:
              </span>
              <div className="flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`relative inline-flex items-center px-3 py-2 rounded-l-md border ${
                    viewMode === "list"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  } text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={`relative inline-flex items-center px-3 py-2 rounded-r-md border ${
                    viewMode === "kanban"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  } text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                    />
                  </svg>
                  Kanban
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setCategoryFilter("all");
                setDateFilter("all");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No tasks yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new task.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate("/add-task")}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add your first task
              </button>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No matching tasks
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filter criteria.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setCategoryFilter("all");
                  setDateFilter("all");
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Tasks count */}
            <div className="mb-4 text-sm text-gray-500">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>

            {viewMode === "list" ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`${getStatusColor(
                      task.dueDate
                    )} overflow-hidden rounded-lg shadow-sm transition transform hover:shadow-md hover:-translate-y-1`}
                  >
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {task.title}
                        </h3>
                        <div className="flex space-x-2">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              task.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : task.status === "in-progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {task.status === "in-progress"
                              ? "In Progress"
                              : task.status || "pending"}
                          </span>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              task.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : task.priority === "Medium"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      {/* Category Label */}
                      <div className="mt-1 flex items-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                            task.category === "Work"
                              ? "bg-blue-50 text-blue-700"
                              : task.category === "Personal"
                              ? "bg-purple-50 text-purple-700"
                              : task.category === "Shopping"
                              ? "bg-pink-50 text-pink-700"
                              : task.category === "Study"
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {task.category || "Other"}
                        </span>

                        {/* Recurring indicator */}
                        {task.isRecurring && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            {task.recurringType === "daily" && "Daily"}
                            {task.recurringType === "weekly" && "Weekly"}
                            {task.recurringType === "monthly" && "Monthly"}
                          </span>
                        )}
                      </div>

                      <div className="mt-2">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {task.description}
                        </p>
                      </div>

                      {/* Subtasks section */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <span className="flex items-center">
                              <span className="mr-1">Subtasks:</span>
                              <span className="font-medium text-indigo-600 mx-1">
                                {Math.round(
                                  (task.subtasks.filter((st) => st.completed)
                                    .length /
                                    task.subtasks.length) *
                                    100
                                )}
                                %
                              </span>
                              <span>
                                (
                                {
                                  task.subtasks.filter((st) => st.completed)
                                    .length
                                }
                                /{task.subtasks.length})
                              </span>
                            </span>
                            <div className="ml-2 flex-grow h-1.5 bg-gray-200 rounded-full">
                              <div
                                className="h-1.5 bg-indigo-500 rounded-full"
                                style={{
                                  width: `${
                                    (task.subtasks.filter((st) => st.completed)
                                      .length /
                                      task.subtasks.length) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500 flex flex-col gap-1">
                          {task.dueDate ? (
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span>
                                Due:{" "}
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              No due date
                            </span>
                          )}
                          {task.reminder && (
                            <div className="flex items-center text-indigo-600">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                />
                              </svg>
                              <span>
                                {new Date(task.reminder).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {task.status !== "completed" && (
                            <button
                              onClick={() => completeTask(task._id)}
                              className="inline-flex items-center p-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              title="Mark as completed"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/edit-task/${task._id}`)}
                            className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <div
                            className="relative"
                            ref={activeMenu === task._id ? menuRef : null}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(
                                  activeMenu === task._id ? null : task._id
                                );
                              }}
                              className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                                />
                              </svg>
                            </button>

                            {activeMenu === task._id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 overflow-hidden">
                                <div className="py-1">
                                  <button
                                    onClick={() => setActiveMenu(null)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Close Menu
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => deleteTask(task._id)}
                            className="inline-flex items-center p-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <KanbanBoard
                tasks={filteredTasks}
                onStatusChange={completeTask}
                onDelete={deleteTask}
                onEdit={(id) => navigate(`/edit-task/${id}`)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
