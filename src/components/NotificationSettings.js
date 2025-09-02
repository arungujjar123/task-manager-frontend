import React from 'react';
import { useNotification } from '../context/NotificationContext';

const NotificationSettings = () => {
  const { success, info, warning, error } = useNotification();

  const testSuccessNotification = () => {
    success('This is a success notification!');
  };

  const testInfoNotification = () => {
    info('This is an info notification!');
  };

  const testWarningNotification = () => {
    warning('This is a warning notification!');
  };

  const testErrorNotification = () => {
    error('This is an error notification!');
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Notifications are enabled and will appear as pop-up messages in the top-right corner.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
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
