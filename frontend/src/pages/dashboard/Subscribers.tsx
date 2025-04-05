import React, { useState, useEffect } from 'react';

interface Subscriber {
  id: string;
  profilePicture: string;
  name: string;
  email: string;
  canComment: boolean;
  joinDate: string;
  lastActive: string;
}

const Subscribers: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate API fetch
    const fetchSubscribers = async () => {
      try {
        // In a real app, you would fetch from your API
        // const response = await fetch('/api/subscribers');
        // const data = await response.json();
        
        // Mock data
        const mockSubscribers: Subscriber[] = [
          {
            id: '1',
            profilePicture: 'https://randomuser.me/api/portraits/women/44.jpg',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            canComment: true,
            joinDate: '2023-01-15',
            lastActive: '2023-06-20'
          },
          {
            id: '2',
            profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg',
            name: 'John Doe',
            email: 'john.doe@example.com',
            canComment: false,
            joinDate: '2023-02-10',
            lastActive: '2023-06-18'
          },
          {
            id: '3',
            profilePicture: 'https://randomuser.me/api/portraits/women/68.jpg',
            name: 'Alice Johnson',
            email: 'alice.j@example.com',
            canComment: true,
            joinDate: '2023-03-05',
            lastActive: '2023-06-19'
          },
          {
            id: '4',
            profilePicture: 'https://randomuser.me/api/portraits/men/75.jpg',
            name: 'Bob Williams',
            email: 'bob.w@example.com',
            canComment: true,
            joinDate: '2023-04-22',
            lastActive: '2023-06-15'
          },
        ];
        
        setSubscribers(mockSubscribers);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch subscribers:', error);
        setIsLoading(false);
      }
    };

    fetchSubscribers();
  }, []);

  const toggleCommentPermission = (id: string) => {
    setSubscribers(prev => 
      prev.map(sub => 
        sub.id === id ? { ...sub, canComment: !sub.canComment } : sub
      )
    );
  };

  const filteredSubscribers = subscribers.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="loading">Loading subscribers...</div>;
  }

  return (
    <div className="subscribers-container">
      <h1>Subscribers</h1>
      
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
        <div className="subscriber-count">
          {filteredSubscribers.length} {filteredSubscribers.length === 1 ? 'subscriber' : 'subscribers'}
        </div>
      </div>

      <div className="table-responsive">
        <table className="subscribers-table">
          <thead>
            <tr>
              <th className="profile-pic-header"></th>
              <th>Name</th>
              <th>Email</th>
              <th>Comment Permissions</th>
              <th>Joined</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.map(subscriber => (
              <tr key={subscriber.id}>
                <td className="profile-pic">
                  <img 
                    src={subscriber.profilePicture} 
                    alt={subscriber.name} 
                    className="avatar"
                  />
                </td>
                <td className="name">{subscriber.name}</td>
                <td className="email">{subscriber.email}</td>
                <td className="comment-permission">
                  <button
                    onClick={() => toggleCommentPermission(subscriber.id)}
                    className={`toggle-btn ${subscriber.canComment ? 'allowed' : 'denied'}`}
                  >
                    {subscriber.canComment ? 'Allowed' : 'Denied'}
                  </button>
                </td>
                <td className="join-date">
                  {new Date(subscriber.joinDate).toLocaleDateString()}
                </td>
                <td className="last-active">
                  {new Date(subscriber.lastActive).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .subscribers-container {
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
        .subscriber-count {
          font-size: 14px;
          color: #666;
        }
        .table-responsive {
          overflow-x: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .subscribers-table {
          width: 100%;
          border-collapse: collapse;
        }
        .subscribers-table th, .subscribers-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }
        .subscribers-table th {
          background-color: #f5f5f5;
          font-weight: 600;
          border-right: 1px solid #e0e0e0;
        }
        .subscribers-table th:last-child {
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
        .comment-permission {
          text-align: center;
        }
        .toggle-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.3s;
        }
        .toggle-btn.allowed {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        .toggle-btn.denied {
          background-color: #ffebee;
          color: #c62828;
        }
        .toggle-btn:hover {
          opacity: 0.8;
        }
        .join-date, .last-active {
          font-size: 13px;
          color: #666;
        }
        .subscribers-table tr:hover {
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

export default Subscribers;