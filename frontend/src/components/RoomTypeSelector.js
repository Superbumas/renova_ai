import React from 'react';
import { useTranslation } from 'react-i18next';

const RoomTypeSelector = ({ selectedRoomType, onRoomTypeChange }) => {
  const { t } = useTranslation();
  
  const roomTypes = [
    {
      id: 'kitchen',
      icon: '🍳'
    },
    {
      id: 'livingRoom',
      icon: '🛋️'
    },
    {
      id: 'bedroom',
      icon: '🛏️'
    },
    {
      id: 'diningRoom',
      icon: '🍽️'
    },
    {
      id: 'office',
      icon: '💻'
    },
    {
      id: 'bathroom',
      icon: '🛁'
    }
  ];

  // Map IDs to what the app expects
  const idMapping = {
    'livingRoom': 'living-room',
    'diningRoom': 'dining-room'
  };

  const getComponentId = (id) => {
    return idMapping[id] || id;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        {roomTypes.map((roomType) => {
          const componentId = getComponentId(roomType.id);
          
          return (
            <button
              key={roomType.id}
              onClick={() => onRoomTypeChange(componentId)}
              className={`p-3 rounded-xl border-2 text-left transition-all duration-200 hover-lift
                       ${selectedRoomType === componentId
                         ? 'border-blue-500 bg-blue-50 text-gray-800 shadow-soft scale-[1.02]'
                         : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-gray-800'
                       }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-lg">{roomType.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium">{t(`roomTypes.${roomType.id}.name`)}</h4>
                  <p className="text-xs opacity-70 mt-1">{t(`roomTypes.${roomType.id}.description`)}</p>
                </div>
                {selectedRoomType === componentId && (
                  <div className="text-blue-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoomTypeSelector; 