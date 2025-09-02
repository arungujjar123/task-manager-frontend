import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import API from "../api/API";
import TaskColumn from "./TaskColumn";
import { format } from "date-fns";

const KanbanBoard = ({ tasks, onStatusChange, onDelete, onEdit }) => {
  const [columns, setColumns] = useState({
    pending: [],
    "in-progress": [],
    completed: [],
  });
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event) => {
        return {
          x: 0,
          y: event.index * 10,
        };
      },
    })
  );

  useEffect(() => {
    // Group tasks by status
    const groupedTasks = {
      pending: [],
      "in-progress": [],
      completed: [],
    };

    tasks.forEach((task) => {
      if (groupedTasks[task.status]) {
        groupedTasks[task.status].push(task);
      }
    });

    setColumns(groupedTasks);
  }, [tasks]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    console.log("Drag end - Active ID:", active.id, "Over ID:", over.id);

    if (active.id !== over.id) {
      // Find the containers
      const activeContainer = findContainer(active.id);
      const overContainer = findContainer(over.id);

      console.log("Active container:", activeContainer, "Over container:", overContainer);

      if (activeContainer && overContainer) {
        // Same container - just reorder
        if (activeContainer === overContainer) {
          const items = [...columns[activeContainer]];
          const oldIndex = items.findIndex((item) => item._id === active.id);
          const newIndex = items.findIndex((item) => item._id === over.id);

          if (oldIndex !== -1 && newIndex !== -1) {
            const newItems = arrayMove(items, oldIndex, newIndex);

            // Update positions based on new order
            const updatedItems = newItems.map((item, index) => ({
              ...item,
              position: index,
            }));

            setColumns({
              ...columns,
              [activeContainer]: updatedItems,
            });

            // Update backend
            const tasksToUpdate = updatedItems.map((item, index) => ({
              id: item._id,
              status: item.status,
              position: index,
            }));

            await API.post("/tasks/update-positions", { tasks: tasksToUpdate });
          }
        } else {
          // Moving between containers
          const sourceItems = [...columns[activeContainer]];
          const destinationItems = [...columns[overContainer]];

          const sourceIndex = sourceItems.findIndex(
            (item) => item._id === active.id
          );
          
          // Check if we're dropping on a specific task or just into the column
          const destinationIndex = destinationItems.findIndex(
            (item) => item._id === over.id
          );

          if (sourceIndex !== -1) {
            // Remove from source
            const [movedItem] = sourceItems.splice(sourceIndex, 1);

            console.log("Moving task:", movedItem.title, "from", activeContainer, "to", overContainer);

            // Change status to match the target container
            movedItem.status = overContainer;

            console.log("Updated task status to:", movedItem.status);

            // Add to destination
            if (destinationIndex >= 0) {
              // Dropping on a specific task - insert at that position
              destinationItems.splice(destinationIndex, 0, movedItem);
            } else {
              // Dropping into the column generally - add to end
              destinationItems.push(movedItem);
            }

            // Update positions
            const updatedSourceItems = sourceItems.map((item, index) => ({
              ...item,
              position: index,
            }));

            const updatedDestItems = destinationItems.map((item, index) => ({
              ...item,
              position: index,
            }));

            // Update backend first
            const tasksToUpdate = [
              ...updatedSourceItems.map((item) => ({
                id: item._id,
                status: item.status,
                position: item.position,
              })),
              ...updatedDestItems.map((item) => ({
                id: item._id,
                status: item.status,
                position: item.position,
              })),
            ];

            console.log("Updating backend with tasks:", tasksToUpdate);
            await API.post("/tasks/update-positions", { tasks: tasksToUpdate });

            // Update frontend state after successful backend update
            setColumns({
              ...columns,
              [activeContainer]: updatedSourceItems,
              [overContainer]: updatedDestItems,
            });

            console.log("Frontend state updated successfully");

            // Note: Removed onStatusChange callback as it was causing tasks to always go to completed
            // The status is already properly updated above with the correct target container status
          }
        }
      }
    }
  };

  const findContainer = (id) => {
    // Check if id is a column id first
    if (columns.hasOwnProperty(id)) {
      return id;
    }
    
    // Then check if id is a task id
    for (const [key, items] of Object.entries(columns)) {
      if (items.some((item) => item._id === id)) {
        return key;
      }
    }
    return null;
  };

  const getTaskById = (id) => {
    for (const items of Object.values(columns)) {
      const task = items.find((item) => item._id === id);
      if (task) return task;
    }
    return null;
  };

  const renderTaskCardContent = (task) => {
    return (
      <div
        className={`p-4 rounded-lg shadow-md ${getPriorityClass(
          task.priority
        )} ${task.isRecurring ? "border-l-4 border-purple-500" : ""}`}
      >
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
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-2 mb-3">
            <div className="flex items-center text-xs text-gray-600 mb-1">
              <span className="flex items-center">
                <span className="mr-2">Subtasks:</span>
                <span className="font-medium text-indigo-600">
                  {Math.round(
                    (task.subtasks.filter((st) => st.completed).length /
                      task.subtasks.length) *
                      100
                  )}
                  %
                </span>
                <span className="mx-1">
                  ({task.subtasks.filter((st) => st.completed).length}/
                  {task.subtasks.length})
                </span>
              </span>
              <div className="ml-2 flex-grow h-1.5 bg-gray-200 rounded-full">
                <div
                  className="h-1.5 bg-indigo-500 rounded-full"
                  style={{
                    width: `${
                      (task.subtasks.filter((st) => st.completed).length /
                        task.subtasks.length) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
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
          <div className="flex space-x-2">
            <button
              onClick={() => onDelete(task._id)}
              className="p-1 text-red-500 hover:text-red-700"
              title="Delete"
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
              onClick={() => onEdit(task._id)}
              className="p-1 text-blue-500 hover:text-blue-700"
              title="Edit"
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
    );
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

  const columnTitles = {
    pending: "To Do",
    "in-progress": "In Progress",
    completed: "Completed",
  };

  return (
    <div className="h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
          {Object.keys(columns).map((columnId) => (
            <TaskColumn
              key={columnId}
              id={columnId}
              title={columnTitles[columnId]}
              tasks={columns[columnId]}
              onTaskDelete={onDelete}
              onTaskEdit={onEdit}
            />
          ))}
        </div>
        <DragOverlay>
          {activeId ? renderTaskCardContent(getTaskById(activeId)) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
