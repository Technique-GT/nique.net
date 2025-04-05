import React, { useState, useEffect } from 'react';
// import { Permission } from '../models/permission.model';

interface PermissionTable {
  [role: string]: {
    [permission: string]: boolean;
  };
}

const UserRoleEditor: React.FC = () => {
  const [permissions, setPermissions] = useState<PermissionTable>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Filtered permissions structure without admin role and specific permissions
  const filteredPermissions = {
    manager: {
      createArticle: true,
      editOwnArticle: true,
      editAnyArticle: true,
      deleteOwnArticle: true,
      deleteAnyArticle: true,
      publishArticle: true,
      manageCategories: true,
      manageTags: true,
      manageMedia: true,
      manageComments: true,
      accessDashboard: true
    },
    editor: {
      createArticle: true,
      editOwnArticle: true,
      editAnyArticle: false,
      deleteOwnArticle: true,
      deleteAnyArticle: false,
      publishArticle: false,
      manageCategories: false,
      manageTags: false,
      manageMedia: true,
      manageComments: false,
      accessDashboard: true
    },
    subscriber: {
      createArticle: false,
      editOwnArticle: false,
      editAnyArticle: false,
      deleteOwnArticle: false,
      deleteAnyArticle: false,
      publishArticle: false,
      manageCategories: false,
      manageTags: false,
      manageMedia: false,
      manageComments: false,
      accessDashboard: false
    },
    viewer: {
      createArticle: false,
      editOwnArticle: false,
      editAnyArticle: false,
      deleteOwnArticle: false,
      deleteAnyArticle: false,
      publishArticle: false,
      manageCategories: false,
      manageTags: false,
      manageMedia: false,
      manageComments: false,
      accessDashboard: false
    }
  };

  // Load permissions on component mount
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setPermissions(filteredPermissions);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const handlePermissionChange = (role: string, permission: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: value
      }
    }));
    setHasChanges(true);
  };

  const savePermissions = async () => {
    try {
      setIsLoading(true);
      console.log('Permissions saved:', permissions);
      setHasChanges(false);
      alert('Permissions saved successfully!');
    } catch (error) {
      console.error('Failed to save permissions:', error);
      alert('Failed to save permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading permissions...</div>;
  }

  // Get all permission keys from the first role (excluding removed permissions)
  const permissionKeys = Object.keys(filteredPermissions.manager);

  return (
    <div className="permissions-container">
      <h1>Role Permissions Management</h1>
      
      <div className="table-responsive">
        <table className="permissions-table">
          <thead>
            <tr>
              <th className="permission-header">Permission</th>
              {Object.keys(permissions).map(role => (
                <th key={role} className="role-header">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionKeys.map(permission => (
              <tr key={permission}>
                <td className="permission-name">
                  {permission.split(/(?=[A-Z])/).join(' ')}
                </td>
                {Object.keys(permissions).map(role => (
                  <td 
                    key={`${role}-${permission}`}
                    className={`permission-value ${permissions[role][permission] ? 'allowed' : 'denied'}`}
                  >
                    <select
                      value={permissions[role][permission] ? 'true' : 'false'}
                      onChange={(e) => handlePermissionChange(role, permission, e.target.value === 'true')}
                      className="permission-select"
                    >
                      <option value="true">Allow</option>
                      <option value="false">Deny</option>
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="actions">
        <button 
          onClick={savePermissions} 
          disabled={!hasChanges || isLoading}
          className="save-btn"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <style>{`
        .permissions-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          margin-bottom: 20px;
          color: #333;
        }
        .table-responsive {
          overflow-x: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .permissions-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .permissions-table th, .permissions-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }
        .permission-header {
          font-weight: 600;
          background-color: #f5f5f5;
          border-right: 1px solid #e0e0e0;
        }
        .role-header {
          font-weight: 600;
          background-color: #f5f5f5;
          border-right: 1px solid #e0e0e0;
          text-align: center;
        }
        .role-header:last-child {
          border-right: none;
        }
        .permission-name {
          font-weight: 500;
          border-right: 1px solid #e0e0e0;
        }
        .permission-value {
          text-align: center;
          border-right: 1px solid #e0e0e0;
        }
        .permission-value:last-child {
          border-right: none;
        }
        .allowed {
          background-color: rgba(76, 175, 80, 0.1);
        }
        .denied {
          background-color: rgba(244, 67, 54, 0.1);
        }
        .permissions-table tr:hover {
          background-color: #f9f9f9;
        }
        .permission-select {
          padding: 5px 8px;
          border-radius: 4px;
          border: 1px solid #ccc;
          background-color: white;
          cursor: pointer;
          min-width: 80px;
        }
        .allowed .permission-select {
          border-color: #4CAF50;
        }
        .denied .permission-select {
          border-color: #f44336;
        }
        .actions {
          text-align: right;
          margin-top: 20px;
        }
        .save-btn {
          padding: 10px 20px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.3s;
        }
        .save-btn:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        .save-btn:hover:not(:disabled) {
          background-color: #45a049;
        }
      `}</style>
    </div>
  );
};

export default UserRoleEditor;

// export default function UserRoleEditor() {
// 	return <h4 className="px-15 py-8 text-4xl tracking-wider border-b-2 mb-5 border-b-gray-300">
//     User Role Editor
//   </h4>
//   }