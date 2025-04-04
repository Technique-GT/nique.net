import React, { useState, useEffect } from 'react';

interface StaffMember {
  id: string;
  profilePicture: string;
  name: string;
  email: string;
  role: 'editor' | 'manager' | 'admin';
  joinDate: string;
  lastActive: string;
}

const Staff: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate API fetch
    const fetchStaff = async () => {
      try {
        // Mock data
        const mockStaff: StaffMember[] = [
          {
            id: '1',
            profilePicture: 'https://randomuser.me/api/portraits/women/44.jpg',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            role: 'admin',
            joinDate: '2022-01-15',
            lastActive: '2023-06-20'
          },
          {
            id: '2',
            profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg',
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'manager',
            joinDate: '2022-02-10',
            lastActive: '2023-06-18'
          },
          {
            id: '3',
            profilePicture: 'https://randomuser.me/api/portraits/women/68.jpg',
            name: 'Alice Johnson',
            email: 'alice.j@example.com',
            role: 'editor',
            joinDate: '2022-03-05',
            lastActive: '2023-06-19'
          },
          {
            id: '4',
            profilePicture: 'https://randomuser.me/api/portraits/men/75.jpg',
            name: 'Bob Williams',
            email: 'bob.w@example.com',
            role: 'editor',
            joinDate: '2022-04-22',
            lastActive: '2023-06-15'
          },
        ];
        
        setStaff(mockStaff);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch staff:', error);
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const updateStaffRole = (id: string, newRole: 'editor' | 'manager' | 'admin') => {
    setStaff(prev => 
      prev.map(member => 
        member.id === id ? { ...member, role: newRole } : member
      )
    );
  };

  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  if (isLoading) {
    return <div className="loading">Loading staff...</div>;
  }

  return (
    <div className="staff-container">
      <h1>Staff Management</h1>
      
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

      <div className="table-responsive">
        <table className="staff-table">
          <thead>
            <tr>
              <th className="profile-pic-header"></th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map(member => (
              <tr key={member.id}>
                <td className="profile-pic">
                  <img 
                    src={member.profilePicture} 
                    alt={member.name} 
                    className="avatar"
                  />
                </td>
                <td className="name">{member.name}</td>
                <td className="email">{member.email}</td>
                <td className="role">
                  <select
                    value={member.role}
                    onChange={(e) => updateStaffRole(member.id, e.target.value as 'editor' | 'manager' | 'admin')}
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
                <td className="join-date">
                  {new Date(member.joinDate).toLocaleDateString()}
                </td>
                <td className="last-active">
                  {new Date(member.lastActive).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
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
        .join-date, .last-active {
          font-size: 13px;
          color: #666;
        }
        .staff-table tr:hover {
          background-color: #f9f9f9;
        }
        .loading {
          padding: 20px;
          text-align: center;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default Staff;