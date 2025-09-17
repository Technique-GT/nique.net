import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'editor' | 'manager' | 'admin';
  profileImage?: string;
  lastLogin?: string;
  isActive: boolean;
  bio?: string;
}

// Create an axios instance with the correct base URL
const api = axios.create({
  baseURL: 'http://localhost:5050/api',
  withCredentials: true
});

const StaffPage: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching staff data...');
      // Use /staff instead of /api/staff since the base URL already includes /api
      const response = await api.get('/staff');
      
      console.log('API Response:', response);
      
      // Check if response has the expected structure
      if (response.data && response.data.staff && Array.isArray(response.data.staff)) {
        setStaff(response.data.staff);
        setDebugInfo(null);
      } else {
        // Save the response for debugging
        setDebugInfo(response.data);
        setError('Invalid response format from API');
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error fetching staff:', err);
      setError(`Failed to load staff members: ${err.message || 'Unknown error'}`);
      setDebugInfo(err);
      setIsLoading(false);
    }
  };

  const updateStaffRole = async (id: string, newRole: 'editor' | 'manager' | 'admin') => {
    try {
      // Use /staff/:id instead of /api/staff/:id
      const response = await api.put(`/staff/${id}`, { role: newRole });
      console.log('Update response:', response);
      
      // Update local state
      setStaff(prev => 
        prev.map(member => 
          member._id === id ? { ...member, role: newRole } : member
        )
      );
    } catch (err: any) {
      console.error('Error updating staff role:', err);
      setError(`Failed to update staff role: ${err.message || 'Unknown error'}`);
    }
  };

  const filteredStaff = staff.filter(member => 
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'admin': return '#f44336'; // Red
      case 'manager': return '#2196F3'; // Blue
      case 'editor': return '#4CAF50'; // Green
      default: return '#9E9E9E'; // Gray
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Never logged in';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString();
  };

  const renderDebugInfo = () => {
    if (!debugInfo) return null;
    
    return (
      <div className="debug-info">
        <h3>Debug Information:</h3>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    );
  };

  if (isLoading) {
    return <div className="loading">Loading staff...</div>;
  }

  return (
    <div className="staff-container">
      <h1>Staff Management</h1>
      
      {error && (
        <div className="error-message">
          {error}
          <button 
            onClick={fetchStaff} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
      )}
      
      {debugInfo && renderDebugInfo()}
      
      <div className="controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        <div className="staff-count">
          {filteredStaff.length} {filteredStaff.length === 1 ? 'staff member' : 'staff members'}
        </div>
      </div>

      {filteredStaff.length === 0 && !error ? (
        <div className="no-results">No staff members found</div>
      ) : (
        <div className="table-responsive">
          <table className="staff-table">
            <thead>
              <tr>
                <th className="profile-pic-header"></th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Last Login</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(member => (
                <tr key={member._id}>
                  <td className="profile-pic">
                    {member.profileImage ? (
                      <img 
                        src={member.profileImage} 
                        alt={`${member.firstName} ${member.lastName}`} 
                        className="avatar"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {member.firstName.charAt(0)}
                        {member.lastName.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td className="name">{member.firstName} {member.lastName}</td>
                  <td className="email">{member.email}</td>
                  <td className="role">
                    <select
                      value={member.role}
                      onChange={(e) => updateStaffRole(member._id, e.target.value as 'editor' | 'manager' | 'admin')}
                      className="role-select"
                      style={{ 
                        backgroundColor: `${getRoleColor(member.role)}20`,
                        borderColor: getRoleColor(member.role),
                        color: getRoleColor(member.role)
                      }}
                    >
                      <option value="editor">Editor</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="last-active">
                    {formatDate(member.lastLogin)}
                  </td>
                  <td className="status">
                    <span className={`status-indicator ${member.isActive ? 'active' : 'inactive'}`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .staff-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          margin-bottom: 20px;
          color: #333;
        }
        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .search-box {
          position: relative;
          width: 300px;
        }
        .search-box input {
          width: 100%;
          padding: 8px 15px 8px 35px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #777;
        }
        .staff-count {
          font-size: 14px;
          color: #666;
        }
        .table-responsive {
          overflow-x: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .staff-table {
          width: 100%;
          border-collapse: collapse;
        }
        .staff-table th, .staff-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }
        .staff-table th {
          background-color: #f5f5f5;
          font-weight: 600;
          border-right: 1px solid #e0e0e0;
        }
        .staff-table th:last-child {
          border-right: none;
        }
        .profile-pic-header {
          width: 50px;
        }
        .profile-pic {
          width: 50px;
        }
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }
        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #666;
          font-size: 14px;
        }
        .name {
          font-weight: 500;
        }
        .email {
          color: #666;
          font-size: 14px;
        }
        .role {
          text-align: center;
        }
        .role-select {
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.3s;
          font-weight: 500;
        }
        .last-active {
          font-size: 13px;
          color: #666;
        }
        .status-indicator {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-indicator.active {
          background-color: #e8f5e9;
          color: #4CAF50;
        }
        .status-indicator.inactive {
          background-color: #f5f5f5;
          color: #9E9E9E;
        }
        .staff-table tr:hover {
          background-color: #f9f9f9;
        }
        .loading {
          padding: 20px;
          text-align: center;
          color: #666;
        }
        .error-message {
          padding: 15px;
          background-color: #ffebee;
          color: #f44336;
          border-radius: 4px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .retry-button {
          background-color: #f44336;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        .retry-button:hover {
          background-color: #d32f2f;
        }
        .no-results {
          padding: 30px;
          text-align: center;
          background-color: #f5f5f5;
          border-radius: 8px;
          color: #666;
        }
        .debug-info {
          background-color: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          margin-bottom: 20px;
          overflow: auto;
        }
        .debug-info pre {
          margin: 0;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default StaffPage;