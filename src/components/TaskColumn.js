import React from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import SortableTaskCard from "./SortableTaskCard";

const TaskColumn = ({ id, title, tasks, onTaskDelete, onTaskEdit }) => {
  const taskIds = tasks.map((task) => task._id);
  const { setNodeRef } = useDroppable({
    id: id,
  });

  const columnColors = {
    pending: "bg-gray-100",
    "in-progress": "bg-blue-100",
    completed: "bg-green-100",
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 ${columnColors[id]} rounded-lg shadow p-4 h-full flex flex-col`}
    >
      <h3 className="font-bold text-lg mb-4 text-center">{title}</h3>
      <div className="flex-grow overflow-y-auto">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task._id}
                id={task._id}
                task={task}
                onDelete={onTaskDelete}
                onEdit={onTaskEdit}
              />
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500 italic">
                No tasks in this column
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default TaskColumn;
