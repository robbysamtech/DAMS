import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminSection from '../components/admin/AdminSection';
import './AdminDashboard.css';

// Approved Users List Component
const ApprovedUsersList = ({ token, onUserUpdate, setSuccessMessage, sortConfig, onSort }) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchActiveUsers = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/users?status=active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActiveUsers(data.users || []);
      } else {
        const errorText = await response.text();
        setError('Failed to fetch approved users');
      }
    } catch (err) {
      setError('Error fetching approved users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setActiveUsers(prev => prev.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        ));
        onUserUpdate(); // Refresh statistics
        setSuccessMessage('User role updated successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError('Failed to update user role');
      }
    } catch (err) {
      setError('Error updating user role');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      
      if (response.ok) {
        const result = await response.json();
        setActiveUsers(prev => prev.filter(user => user._id !== userId));
        onUserUpdate(); // Refresh statistics
        setSuccessMessage('User deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const errorText = await response.text();
        setError(`Failed to delete user: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      setError(`Error deleting user: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchActiveUsers();
  }, [fetchActiveUsers]);

  // Sort users based on sortConfig
  const sortedUsers = [...activeUsers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue, bValue;
    
    if (sortConfig.key === 'firstName') {
      // For name sorting, combine firstName and lastName, case-insensitive
      aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
      bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
    } else {
      // For other fields, use the original value
      aValue = a[sortConfig.key];
      bValue = b[sortConfig.key];
    }
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  if (loading) {
    return <div className="loading">Loading approved users...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (activeUsers.length === 0) {
    return <div className="no-active-users"><p>No approved users found.</p></div>;
  }

  return (
    <div className="users-table-container">
      <table className="users-table">
        <thead>
          <tr>
            <th className="serial-number-header">#</th>
            <th onClick={() => onSort('firstName')}>
              Name {sortConfig.key === 'firstName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => onSort('userId')}>
              User ID {sortConfig.key === 'userId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => onSort('role')}>
              Role {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user, index) => (
            <tr key={user._id} className="user-row">
              <td className="serial-number-cell">
                <span className="serial-number">{index + 1}</span>
              </td>
              <td className="user-name-cell">
                <span className="user-name">{user.firstName} {user.lastName}</span>
              </td>
              <td className="user-id-cell">
                <span className="user-id">{user.userId}</span>
              </td>
              <td className="user-role-cell">
                <span className={`role-badge role-${user.role}`}>
                  {user.role === 'superadmin' ? 'Super Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </td>
              <td className="user-actions-cell">
                <div className="table-actions">
                  <select 
                    value={user.role}
                    onChange={(e) => updateUserRole(user._id, e.target.value)}
                    className="role-select"
                    disabled={user.role === 'superadmin'}
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    {user.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
                  </select>
                  <button 
                    onClick={() => deleteUser(user._id)}
                    className={`btn-delete ${user.role === 'superadmin' ? 'disabled' : ''}`}
                    disabled={user.role === 'superadmin'}
                    title={user.role === 'superadmin' ? 'Cannot delete super admin' : 'Delete this user'}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    activeUsers: 0,
    editors: 0,
    admins: 0,
    people: 0,
    events: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [pendingSortConfig, setPendingSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handlePendingSort = (key) => {
    let direction = 'asc';
    if (pendingSortConfig.key === key && pendingSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setPendingSortConfig({ key, direction });
  };

  const fetchPendingUsers = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/pending-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data.pendingUsers || []);
      } else {
        const errorText = await response.text();
        setError('Failed to fetch pending users');
      }
    } catch (err) {
      setError('Error fetching pending users');
    }
  }, [token]);

  const fetchEditorCount = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/users?role=editor&status=active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          editors: data.users?.length || 0
        }));
      }
    } catch (err) {
    }
  }, [token]);

  const fetchAdminCount = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/users?role=admin&status=active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          admins: data.users?.length || 0
        }));
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/admin/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match what the frontend expects
        const transformedStats = {
          totalUsers: data.userStats?.total || 0,
          pendingUsers: data.userStats?.pending || 0,
          activeUsers: data.userStats?.active || 0,
          editors: 0, // We'll count this separately
          admins: 0, // We'll count this separately

          people: data.contentStats?.people || 0,
          events: data.contentStats?.events || 0
        };
        setStats(transformedStats);
        
        // Fetch editor and admin counts separately
        fetchEditorCount();
        fetchAdminCount();
      } else {
        const errorText = await response.text();
        setError('Failed to fetch statistics');
        setLoading(false);
      }
    } catch (err) {
      setError('Error fetching statistics');
      setLoading(false);
    }
  }, [token, fetchEditorCount, fetchAdminCount]);

  // Fetch pending users and statistics
  useEffect(() => {
    if (token) {
      fetchPendingUsers();
      fetchStatistics();
    } else {
      setLoading(false);
    }
  }, [token, fetchPendingUsers, fetchStatistics]);

  const approveUser = async (userId, role) => {
    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });

      if (response.ok) {
        // Remove user from pending list and refresh
        setPendingUsers(prev => prev.filter(user => user._id !== userId));
        fetchStatistics(); // Refresh stats
        setSuccessMessage(`User approved successfully as ${role}!`);
        setTimeout(() => setSuccessMessage(''), 5000); // Auto-hide after 5 seconds
        setRefreshKey(prev => prev + 1); // Force ApprovedUsersList to refresh
      } else {
        setError('Failed to approve user');
      }
    } catch (err) {
      setError('Error approving user');
    }
  };

  const rejectUser = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this user? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Rejected by admin' })
      });

      if (response.ok) {
        // Remove user from pending list and refresh
        setPendingUsers(prev => prev.filter(user => user._id !== userId));
        fetchStatistics(); // Refresh stats
        setSuccessMessage('User rejected successfully!');
        setTimeout(() => setSuccessMessage(''), 5000); // Auto-hide after 5 seconds
      } else {
        setError('Failed to reject user');
      }
    } catch (err) {
      setError('Error rejecting user');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="loading">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user?.firstName}! Manage your platform here.</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} className="alert-close">&times;</button>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
            <button onClick={() => setSuccessMessage('')} className="alert-close">&times;</button>
          </div>
        )}

        {/* Statistics Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-number">{stats.pendingUsers || 0}</div>
            <div className="stat-label">Pending Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.activeUsers || 0}</div>
            <div className="stat-label">Approved Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.editors || 0}</div>
            <div className="stat-label">Editors</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.admins || 0}</div>
            <div className="stat-label">Admins</div>
          </div>
        </div>

        {/* Pending Users */}
        <AdminSection
          title="Pending Users"
          count={pendingUsers.length}
          description=""
          isEmpty={pendingUsers.length === 0}
          emptyMessage="No users waiting for approval."
        >
          <div className="users-table-container">
            <table className="users-table pending-users-table">
              <thead>
                <tr>
                  <th className="serial-number-header">#</th>
                  <th onClick={() => handlePendingSort('firstName')}>
                    Name {pendingSortConfig.key === 'firstName' && (pendingSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handlePendingSort('userId')}>
                    User ID {pendingSortConfig.key === 'userId' && (pendingSortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Assign Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...pendingUsers].sort((a, b) => {
                  if (!pendingSortConfig.key) return 0;
                  
                  let aValue, bValue;
                  
                  if (pendingSortConfig.key === 'firstName') {
                    // For name sorting, combine firstName and lastName, case-insensitive
                    aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
                    bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
                  } else {
                    // For other fields, use the original value
                    aValue = a[pendingSortConfig.key];
                    bValue = b[pendingSortConfig.key];
                  }
                  
                  if (aValue < bValue) {
                    return pendingSortConfig.direction === 'asc' ? -1 : 1;
                  }
                  if (aValue > bValue) {
                    return pendingSortConfig.direction === 'asc' ? 1 : -1;
                  }
                  return 0;
                }).map((user, index) => (
                  <tr key={user._id} className="user-row pending-user-row">
                    <td className="serial-number-cell">
                      <span className="serial-number">{index + 1}</span>
                    </td>
                    <td className="user-name-cell">
                      <span className="user-name">{user.firstName} {user.lastName}</span>
                    </td>
                    <td className="user-id-cell">
                      <span className="user-id">{user.userId}</span>
                    </td>
                    <td className="user-role-cell">
                      <select 
                        id={`role-${user._id}`} 
                        defaultValue="editor"
                        className="role-select"
                      >
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="user-actions-cell">
                      <div className="table-actions">
                        <button 
                          onClick={() => approveUser(user._id, document.getElementById(`role-${user._id}`).value)}
                          className="btn-edit"
                          title="Approve this user with the selected role"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => rejectUser(user._id)}
                          className="btn-delete"
                          title="Reject this user registration"
                        >
                          Deny
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminSection>

        {/* Approved Users Management */}
        <AdminSection
          title="Approved Users"
          count={stats.activeUsers || 0}
          description=""
          isEmpty={(stats.activeUsers || 0) === 0}
          emptyMessage="No approved users found."
        >
          <ApprovedUsersList 
            key={refreshKey}
            token={token} 
            onUserUpdate={fetchStatistics} 
            setSuccessMessage={setSuccessMessage}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </AdminSection>

      </div>
    </div>
  );
};

export default AdminDashboard;
