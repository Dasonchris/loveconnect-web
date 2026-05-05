// client/src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');

    if (!token || !user) {
      navigate('/admin/login');
      return;
    }

    setAdminUser(JSON.parse(user));
    loadDashboardData(token);
  }, [navigate]);

  const loadDashboardData = async (token) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, usersRes, messagesRes, paymentsRes, logsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/messages', { headers }),
        fetch('/api/admin/payments', { headers }),
        fetch('/api/admin/activity-logs', { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers((await usersRes.json()).users);
      if (messagesRes.ok) setMessages((await messagesRes.json()).messages);
      if (paymentsRes.ok) setPayments((await paymentsRes.json()).payments);
      if (logsRes.ok) setActivityLogs((await logsRes.json()).logs);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleBanUser = async (userId) => {
    const token = localStorage.getItem('adminToken');
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setUsers(users.filter((u) => u._id !== userId));
        alert('User deleted successfully');
      }
    } catch (err) {
      console.error('Failed to ban user:', err);
    }
  };

  const handleVerifyUser = async (userId) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(users.map((u) => (u._id === userId ? data.user : u)));
        alert('User verified successfully');
      }
    } catch (err) {
      console.error('Failed to verify user:', err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const token = localStorage.getItem('adminToken');
    if (!window.confirm('Delete this message?')) return;

    try {
      const res = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMessages(messages.filter((m) => m._id !== messageId));
        alert('Message deleted');
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="admin-loading">Loading dashboard...</div>;

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>📊 Admin Dashboard</h1>
          <p>Welcome, {adminUser?.username}</p>
        </div>
        <button onClick={handleLogout} className="admin-logout-btn">
          Logout
        </button>
      </div>

      {/* Navigation */}
      <div className="admin-nav">
        <button
          className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📈 Dashboard
        </button>
        <button
          className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={`admin-nav-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          💬 Messages
        </button>
        <button
          className={`admin-nav-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💳 Payments
        </button>
        <button
          className={`admin-nav-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📋 Activity Log
        </button>
      </div>

      {/* Content */}
      <div className="admin-content">
        {/* Dashboard Stats */}
        {activeTab === 'dashboard' && stats && (
          <div className="admin-stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <h3>Total Users</h3>
              <p className="stat-value">{stats.totalUsers}</p>
              <small>{stats.premiumUsers} Premium</small>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <h3>Premium Users</h3>
              <p className="stat-value">{stats.premiumUsers}</p>
              <small>{Math.round((stats.premiumUsers / stats.totalUsers) * 100)}% rate</small>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💬</div>
              <h3>Total Messages</h3>
              <p className="stat-value">{stats.totalMessages}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💕</div>
              <h3>Total Matches</h3>
              <p className="stat-value">{stats.totalMatches}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🛡️</div>
              <h3>Pending Verification</h3>
              <p className="stat-value">{stats.pendingVerifications}</p>
            </div>

            <div className="stat-card full-width">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {stats.recentActivity?.slice(0, 8).map((log) => (
                  <div key={log._id} className="activity-item">
                    <span className="activity-user">{log.userId?.name || 'Unknown'}</span>
                    <span className="activity-action">{log.action}</span>
                    <span className="activity-time">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="admin-section">
            <h2>User Management</h2>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search"
            />
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Age</th>
                    <th>Premium</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.age || '-'}</td>
                      <td>{user.isPremium ? '✅' : '❌'}</td>
                      <td>{user.verified ? '✅ Verified' : '⚠️ Pending'}</td>
                      <td>{user.isOnline ? '🟢 Online' : '🔴 Offline'}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="admin-action-btn view"
                        >
                          View
                        </button>
                        {!user.verified && (
                          <button
                            onClick={() => handleVerifyUser(user._id)}
                            className="admin-action-btn verify"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => handleBanUser(user._id)}
                          className="admin-action-btn delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="admin-section">
            <h2>Message Monitoring</h2>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Message</th>
                    <th>Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg._id}>
                      <td>{msg.from?.name || 'Unknown'}</td>
                      <td>{msg.to?.name || 'Unknown'}</td>
                      <td className="msg-text">{msg.text?.substring(0, 50)}...</td>
                      <td>{new Date(msg.createdAt).toLocaleTimeString()}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="admin-action-btn delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="admin-section">
            <h2>Payment Records</h2>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Method</th>
                    <th>Provider</th>
                    <th>Account</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td>{payment.userId?.name || 'Unknown'}</td>
                      <td>{payment.details?.method || '-'}</td>
                      <td>{payment.details?.provider || '-'}</td>
                      <td>{payment.details?.account || '-'}</td>
                      <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <div className="admin-section">
            <h2>Activity Log</h2>
            <div className="activity-log-list">
              {activityLogs.map((log) => (
                <div key={log._id} className="log-entry">
                  <div className="log-header">
                    <span className="log-user">{log.userId?.name || 'System'}</span>
                    <span className={`log-action action-${log.action}`}>{log.action}</span>
                    <span className="log-time">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {log.details && (
                    <div className="log-details">
                      {JSON.stringify(log.details).substring(0, 100)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="admin-modal" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedUser.name}</h2>
            <div className="user-details">
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>Age:</strong> {selectedUser.age || '-'}
              </p>
              <p>
                <strong>Occupation:</strong> {selectedUser.occupation || '-'}
              </p>
              <p>
                <strong>Date of Birth:</strong>{' '}
                {selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : '-'}
              </p>
              <p>
                <strong>Verified:</strong> {selectedUser.verified ? '✅ Verified' : '⚠️ Pending'}
              </p>
              <p>
                <strong>Bio:</strong> {selectedUser.bio || '-'}
              </p>
              <p>
                <strong>Premium:</strong> {selectedUser.isPremium ? '✅ Yes' : '❌ No'}
              </p>
              <p>
                <strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}
              </p>
              <p>
                <strong>Matches:</strong> {selectedUser.matches?.length || 0}
              </p>
            </div>
            <button onClick={() => setSelectedUser(null)} className="close-modal-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
