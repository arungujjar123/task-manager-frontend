import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/API";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import { format, differenceInDays } from "date-fns";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("week"); // "week", "month", "year"

  // Analytics data states
  const [taskStatusData, setTaskStatusData] = useState({
    labels: ["Pending", "In Progress", "Completed"],
    datasets: [
      {
        label: "Tasks by Status",
        data: [0, 0, 0],
        backgroundColor: ["#FACA15", "#3B82F6", "#10B981"],
      },
    ],
  });

  const [taskPriorityData, setTaskPriorityData] = useState({
    labels: ["Low", "Medium", "High"],
    datasets: [
      {
        label: "Tasks by Priority",
        data: [0, 0, 0],
        backgroundColor: ["#10B981", "#FACA15", "#EF4444"],
      },
    ],
  });

  const [taskCategoryData, setTaskCategoryData] = useState({
    labels: [],
    datasets: [
      {
        label: "Tasks by Category",
        data: [],
        backgroundColor: [
          "#3B82F6", // Blue
          "#8B5CF6", // Purple
          "#EC4899", // Pink
          "#F59E0B", // Amber
          "#6B7280", // Gray
        ],
      },
    ],
  });

  const [taskCompletionTrendData, setTaskCompletionTrendData] = useState({
    labels: [],
    datasets: [
      {
        label: "Tasks Completed",
        data: [],
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        tension: 0.2,
      },
      {
        label: "Tasks Created",
        data: [],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.2,
      },
    ],
  });

  const [avgCompletionTimeData, setAvgCompletionTimeData] = useState({
    labels: ["Low", "Medium", "High"],
    datasets: [
      {
        label: "Average Days to Complete",
        data: [0, 0, 0],
        backgroundColor: ["#10B981", "#FACA15", "#EF4444"],
      },
    ],
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
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
        setTasks(res.data);
        processAnalyticsData(res.data, timeRange);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch task data");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, timeRange]);

  const processAnalyticsData = (tasks, timeRange) => {
    // Filter tasks based on time range
    const now = new Date();
    let filteredTasks = [...tasks];

    if (timeRange === "week") {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filteredTasks = tasks.filter(
        (task) =>
          new Date(task.createdAt) >= oneWeekAgo ||
          (task.status === "completed" &&
            new Date(task.updatedAt) >= oneWeekAgo)
      );
    } else if (timeRange === "month") {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      filteredTasks = tasks.filter(
        (task) =>
          new Date(task.createdAt) >= oneMonthAgo ||
          (task.status === "completed" &&
            new Date(task.updatedAt) >= oneMonthAgo)
      );
    } else if (timeRange === "year") {
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      filteredTasks = tasks.filter(
        (task) =>
          new Date(task.createdAt) >= oneYearAgo ||
          (task.status === "completed" &&
            new Date(task.updatedAt) >= oneYearAgo)
      );
    }

    // Process task status data
    const pendingCount = filteredTasks.filter(
      (task) => task.status === "pending"
    ).length;
    const inProgressCount = filteredTasks.filter(
      (task) => task.status === "in-progress"
    ).length;
    const completedCount = filteredTasks.filter(
      (task) => task.status === "completed"
    ).length;

    setTaskStatusData({
      ...taskStatusData,
      datasets: [
        {
          ...taskStatusData.datasets[0],
          data: [pendingCount, inProgressCount, completedCount],
        },
      ],
    });

    // Process task priority data
    const lowPriorityCount = filteredTasks.filter(
      (task) => task.priority === "Low"
    ).length;
    const mediumPriorityCount = filteredTasks.filter(
      (task) => task.priority === "Medium"
    ).length;
    const highPriorityCount = filteredTasks.filter(
      (task) => task.priority === "High"
    ).length;

    setTaskPriorityData({
      ...taskPriorityData,
      datasets: [
        {
          ...taskPriorityData.datasets[0],
          data: [lowPriorityCount, mediumPriorityCount, highPriorityCount],
        },
      ],
    });

    // Process task category data
    const categoryCounts = {};
    filteredTasks.forEach((task) => {
      const category = task.category || "Other";
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const categoryLabels = Object.keys(categoryCounts);
    const categoryData = categoryLabels.map((label) => categoryCounts[label]);

    setTaskCategoryData({
      labels: categoryLabels,
      datasets: [
        {
          ...taskCategoryData.datasets[0],
          data: categoryData,
        },
      ],
    });

    // Process task completion trend data
    // Get date range based on timeRange
    let dateLabels = [];
    let completedData = [];
    let createdData = [];

    if (timeRange === "week") {
      // Daily data for the past week
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dateLabels.push(format(date, "MMM d"));

        const dateStr = format(date, "yyyy-MM-dd");
        const tasksCompletedOnDate = filteredTasks.filter(
          (task) =>
            task.status === "completed" &&
            format(new Date(task.updatedAt), "yyyy-MM-dd") === dateStr
        ).length;

        const tasksCreatedOnDate = filteredTasks.filter(
          (task) => format(new Date(task.createdAt), "yyyy-MM-dd") === dateStr
        ).length;

        completedData.push(tasksCompletedOnDate);
        createdData.push(tasksCreatedOnDate);
      }
    } else if (timeRange === "month") {
      // Weekly data for the past month
      for (let i = 3; i >= 0; i--) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - i * 7);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);

        const weekLabel = `${format(startDate, "MMM d")} - ${format(
          endDate,
          "MMM d"
        )}`;
        dateLabels.push(weekLabel);

        const tasksCompletedInWeek = filteredTasks.filter((task) => {
          const completedDate = new Date(task.updatedAt);
          return (
            task.status === "completed" &&
            completedDate >= startDate &&
            completedDate <= endDate
          );
        }).length;

        const tasksCreatedInWeek = filteredTasks.filter((task) => {
          const createdDate = new Date(task.createdAt);
          return createdDate >= startDate && createdDate <= endDate;
        }).length;

        completedData.push(tasksCompletedInWeek);
        createdData.push(tasksCreatedInWeek);
      }
    } else if (timeRange === "year") {
      // Monthly data for the past year
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        dateLabels.push(format(date, "MMM yyyy"));

        const monthStr = format(date, "yyyy-MM");
        const tasksCompletedInMonth = filteredTasks.filter(
          (task) =>
            task.status === "completed" &&
            format(new Date(task.updatedAt), "yyyy-MM") === monthStr
        ).length;

        const tasksCreatedInMonth = filteredTasks.filter(
          (task) => format(new Date(task.createdAt), "yyyy-MM") === monthStr
        ).length;

        completedData.push(tasksCompletedInMonth);
        createdData.push(tasksCreatedInMonth);
      }
    }

    setTaskCompletionTrendData({
      labels: dateLabels,
      datasets: [
        {
          ...taskCompletionTrendData.datasets[0],
          data: completedData,
        },
        {
          ...taskCompletionTrendData.datasets[1],
          data: createdData,
        },
      ],
    });

    // Calculate average completion time by priority
    const completedTasks = filteredTasks.filter(
      (task) => task.status === "completed"
    );

    const lowPriorityTasks = completedTasks.filter(
      (task) => task.priority === "Low"
    );
    const mediumPriorityTasks = completedTasks.filter(
      (task) => task.priority === "Medium"
    );
    const highPriorityTasks = completedTasks.filter(
      (task) => task.priority === "High"
    );

    const calculateAvgCompletionDays = (tasks) => {
      if (tasks.length === 0) return 0;

      const totalDays = tasks.reduce((sum, task) => {
        const created = new Date(task.createdAt);
        const completed = new Date(task.updatedAt);
        return sum + differenceInDays(completed, created);
      }, 0);

      return Math.round((totalDays / tasks.length) * 10) / 10; // Round to 1 decimal place
    };

    const lowPriorityAvg = calculateAvgCompletionDays(lowPriorityTasks);
    const mediumPriorityAvg = calculateAvgCompletionDays(mediumPriorityTasks);
    const highPriorityAvg = calculateAvgCompletionDays(highPriorityTasks);

    setAvgCompletionTimeData({
      ...avgCompletionTimeData,
      datasets: [
        {
          ...avgCompletionTimeData.datasets[0],
          data: [lowPriorityAvg, mediumPriorityAvg, highPriorityAvg],
        },
      ],
    });
  };

  // Chart options
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: true,
        font: {
          size: 16,
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        font: {
          size: 16,
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Task Completion Trend",
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange("week")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeRange === "week"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Last Week
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeRange === "month"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setTimeRange("year")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeRange === "year"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Last Year
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Task Status Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Task Status
              </h2>
              <div className="h-64">
                <Pie
                  data={taskStatusData}
                  options={{
                    ...pieOptions,
                    plugins: {
                      ...pieOptions.plugins,
                      title: {
                        ...pieOptions.plugins.title,
                        text: "Tasks by Status",
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Task Priority Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Task Priority
              </h2>
              <div className="h-64">
                <Pie
                  data={taskPriorityData}
                  options={{
                    ...pieOptions,
                    plugins: {
                      ...pieOptions.plugins,
                      title: {
                        ...pieOptions.plugins.title,
                        text: "Tasks by Priority",
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Task Category Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Task Categories
              </h2>
              <div className="h-64">
                <Pie
                  data={taskCategoryData}
                  options={{
                    ...pieOptions,
                    plugins: {
                      ...pieOptions.plugins,
                      title: {
                        ...pieOptions.plugins.title,
                        text: "Tasks by Category",
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Task Completion Trend */}
            <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Task Completion Trend
              </h2>
              <div className="h-80">
                <Line data={taskCompletionTrendData} options={lineOptions} />
              </div>
            </div>

            {/* Average Completion Time */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Avg. Completion Time (Days)
              </h2>
              <div className="h-80">
                <Bar
                  data={avgCompletionTimeData}
                  options={{
                    ...barOptions,
                    plugins: {
                      ...barOptions.plugins,
                      title: {
                        ...barOptions.plugins.title,
                        text: "Average Days to Complete by Priority",
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Task Statistics Summary */}
            <div className="bg-white p-6 rounded-lg shadow-md md:col-span-3">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Task Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800">
                    Total Tasks
                  </h3>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {tasks.length}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Pending Tasks
                  </h3>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {tasks.filter((task) => task.status === "pending").length}
                  </p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-indigo-800">
                    In Progress
                  </h3>
                  <p className="text-3xl font-bold text-indigo-600 mt-2">
                    {
                      tasks.filter((task) => task.status === "in-progress")
                        .length
                    }
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800">
                    Completed Tasks
                  </h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {tasks.filter((task) => task.status === "completed").length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
