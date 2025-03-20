import React from 'react';
import { UserOutlined } from '@ant-design/icons';

const ProfileImage = ({ imageData, name, size = 40 }) => {
  return (
    <div style={{ 
      width: size, 
      height: size, 
      borderRadius: '50%',
      overflow: 'hidden',
      background: '#f0f2f5',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {imageData ? (
        <img 
          src={imageData}
          alt={name || "Profile"}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `<span class="anticon anticon-user" style="font-size: ${size/2}px; color: #1890ff;"></span>`;
          }}
        />
      ) : (
        <UserOutlined style={{ fontSize: size/2, color: '#1890ff' }} />
      )}
    </div>
  );
};

export default ProfileImage; 