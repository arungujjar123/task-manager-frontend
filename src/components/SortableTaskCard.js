import React, { useState, useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import API from "../api/API";

const SortableTaskCard = ({ id, task, onDelete, onEdit }) => {
  const [expandSubtasks, setExpandSubtasks] = useState(false);
  const [localSubtasks, setLocalSubtasks] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  // Close the menu when clicking outside
  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    // Only add the event listener when the menu is open
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (task.subtasks && Array.isArray(task.subtasks)) {
      setLocalSubtasks(task.subtasks);
    } else {
      setLocalSubtasks([]);
    }
  }, [task.subtasks]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-50";
      case "Medium":
        return "bg-yellow-50";
      case "Low":
        return "bg-green-50";
      default:
        return "bg-gray-50";
    }
  };

  const getCategoryClass = (category) => {
    switch (category) {
      case "Work":
        return "bg-blue-100 text-blue-800";
      case "Personal":
        return "bg-purple-100 text-purple-800";
      case "Shopping":
        return "bg-green-100 text-green-800";
      case "Study":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      console.log("Toggling subtask:", subtaskId);
      console.log("Current subtasks:", localSubtasks);

      // Toggle locally first for better UX
      const updatedSubtasks = localSubtasks.map((subtask) =>
        subtask._id === subtaskId
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      );
      setLocalSubtasks(updatedSubtasks);

      // Update on server
      await API.toggleSubtaskCompletion(task._id, subtaskId);
    } catch (error) {
      console.error("Failed to toggle subtask completion:", error);
      // Revert on error
      setLocalSubtasks(task.subtasks || []);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`p-4 rounded-lg shadow-md relative ${getPriorityClass(
        task.priority
      )} ${task.isRecurring ? "border-l-4 border-purple-500" : ""}`}
    >
      {/* Drag handle area */}
      <div
        {...listeners}
        className="absolute top-0 left-0 right-0 h-8 cursor-grab z-0"
        title="Drag to move task"
      />

      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getCategoryClass(
              task.category
            )}`}
          >
            {task.category}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {task.description}
        </p>
        {task.dueDate && (
          <div className="text-xs text-gray-500 mb-2">
            Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
          </div>
        )}

        {/* Subtasks section */}
        {localSubtasks && localSubtasks.length > 0 && (
          <div className="mt-2 mb-3">
            <div
              className="flex items-center text-xs text-gray-600 mb-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setExpandSubtasks(!expandSubtasks);
              }}
            >
              <span className="flex items-center">
                <span className="mr-2">Subtasks:</span>
                <span className="font-medium text-indigo-600">
                  {Math.round(
                    (localSubtasks.filter((st) => st.completed).length /
                      localSubtasks.length) *
                      100
                  )}
                  %
                </span>
                <span className="mx-1">
                  ({localSubtasks.filter((st) => st.completed).length}/
                  {localSubtasks.length})
                </span>
                {expandSubtasks ? " ▼" : " ►"}
              </span>
              <div className="ml-2 flex-grow h-1.5 bg-gray-200 rounded-full">
                <div
                  className="h-1.5 bg-indigo-500 rounded-full"
                  style={{
                    width: `${
                      (localSubtasks.filter((st) => st.completed).length /
                        localSubtasks.length) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Expanded subtasks list */}
            {expandSubtasks && (
              <div className="pl-2 mt-2 space-y-1 border-l-2 border-indigo-200">
                {localSubtasks.map((subtask) => (
                  <div
                    key={subtask._id}
                    className="flex items-center text-xs"
                    onClick={(e) => e.stopPropagation()} // Prevent card drag when clicking subtasks
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(subtask._id)}
                      className="h-3 w-3 mr-2 text-indigo-600 rounded"
                    />
                    <span
                      className={
                        subtask.completed
                          ? "line-through text-gray-500"
                          : "text-gray-700"
                      }
                    >
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mt-2">
          <span
            className={`text-xs px-2 py-1 rounded ${getPriorityBadgeClass(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
          <div
            className="flex space-x-2 relative z-10"
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => e.preventDefault()}
            style={{ pointerEvents: "auto" }}
          >
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 text-gray-500 hover:text-gray-700"
                title="Options"
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

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Close Menu
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(task._id);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className="p-1 text-red-500 hover:text-red-700 bg-white rounded border border-red-300 hover:bg-red-50 transition-colors z-10 relative"
              title="Delete Task"
              style={{ pointerEvents: "auto" }}
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
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Edit button clicked for task:", task._id);
                console.log("onEdit function:", onEdit);
                if (onEdit) {
                  console.log("Calling onEdit with task ID:", task._id);
                  onEdit(task._id);
                } else {
                  console.log("No onEdit prop, using window.location");
                  window.location.href = `/edit-task/${task._id}`;
                }
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className="p-1 text-blue-500 hover:text-blue-700 bg-white rounded border border-blue-300 hover:bg-blue-50 transition-colors z-10 relative"
              title="Edit Task"
              style={{ pointerEvents: "auto" }}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortableTaskCard;
