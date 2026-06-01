import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { adminAPI } from '../api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [marketProducts, setMarketProducts] = useState([]);
  const [messageModal, setMessageModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageSearch, setMessageSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const messageLimit = 30;


  const adminFetch = useCallback(async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('adminToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/admin/login');
      throw new Error(data?.message || 'Unauthorized. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(data?.message || 'Request failed: ' + response.status);
    }

    return data;
  }, [navigate]);

  const loadMarketProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/api/marketplace');
      setMarketProducts(Array.isArray(data) ? data : data?.products || []);
    } catch (error) {
      console.error('Marketplace load failed', error);
      setErrorMessage(error.message || 'Marketplace failed to load');
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    if (activeTab === 'marketplace') {
      loadMarketProducts();
    }
  }, [activeTab, loadMarketProducts]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [statsData, usersData, paymentsData, logsData, messagesData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getPayments(),
        adminAPI.getActivityLogs(),
        adminAPI.getMessages({ page: 1, limit: 30 }),
      ]);

      setStats(statsData || {});
      setUsers(usersData?.users || []);
      setPayments(paymentsData?.payments || []);
      setActivityLogs(logsData?.logs || []);
      setMessages(messagesData?.messages || []);
    } catch (error) {
      console.error('Dashboard load failed', error);
      setErrorMessage(error.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const rawUser = localStorage.getItem('adminUser');

    if (!token || !rawUser) {
      navigate('/admin/login');
      return;
    }

    let parsedUser;
    try {
      parsedUser = JSON.parse(rawUser);
    } catch {
      navigate('/admin/login');
      return;
    }

    if (!parsedUser) {
      navigate('/admin/login');
      return;
    }

    setAdminUser(parsedUser);
    loadDashboardData();
  }, [navigate, loadDashboardData]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getMessages({
        page: 1,
        limit: messageLimit,
        search: messageSearch,
        includeDeleted,
      });
      setMessages(data?.messages || []);
    } catch (error) {
      console.error('Message load failed', error);
    } finally {
      setLoading(false);
    }
  }, [messageLimit, messageSearch, includeDeleted]);

  useEffect(() => {
    if (activeTab === 'messages') {
      loadMessages();
    }
  }, [activeTab, loadMessages]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (error) {
      console.error('Delete user failed', error);
      setErrorMessage(error.message || 'Failed to delete user.');
    }
  };

  const handleVerifyUser = async (userId) => {
    try {
      const data = await adminAPI.verifyUser(userId);
      setUsers((prev) => prev.map((user) => (user._id === userId ? data?.user || user : user)));
    } catch (error) {
      console.error('Verify user failed', error);
      setErrorMessage(error.message || 'Failed to verify user.');
    }
  };

  const handleResetUserPassword = async (userId) => {
    if (!userId) {
      setErrorMessage('No user selected for password reset.');
      return;
    }

    if (!window.confirm('Reset this user password?')) return;

    try {
      setErrorMessage('');
      const data = await adminAPI.resetUserPassword(userId);
      if (data?.tempPassword) {
        alert('Temporary password: ' + data.tempPassword);
      } else {
        alert(data?.message || 'Password reset completed.');
      }
    } catch (error) {
      console.error('Password reset failed', error);
      const message = error.message || 'Password reset failed.';
      setErrorMessage(message);
      alert(`Password reset failed: ${message}`);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await adminAPI.deleteMessage(messageId);
      loadMessages();
    } catch (error) {
      console.error('Delete message failed', error);
    }
  };

  const handleMarkRead = async (messageId) => {
    try {
      await adminAPI.markMessageRead(messageId);
      loadMessages();
    } catch (error) {
      console.error('Mark read failed', error);
    }
  };

  const handleRestoreMessage = async (messageId) => {
    if (!window.confirm('Restore this message?')) return;
    try {
      await adminAPI.restoreMessage(messageId);
      loadMessages();
    } catch (error) {
      console.error('Restore message failed', error);
    }
  };

  const toggleFeatured = async (productId, featured) => {
    try {
      await adminFetch('/api/marketplace/' + productId + '/feature', 'PUT', { featured });
      loadMarketProducts();
    } catch (error) {
      console.error('Toggle featured failed', error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = userSearch.trim().toLowerCase();
    return (
      !query ||
      user?.name?.toLowerCase().includes(query) ||
      user?.email?.toLowerCase().includes(query)
    );
  });

  const getNavClass = (tab) => 'admin-nav-btn' + (activeTab === tab ? ' active' : '');

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h1>📊 Admin Dashboard</h1>
          <p>Welcome, {adminUser?.username}</p>
        </div>
        <button className="admin-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
      {errorMessage && (
        <div className="admin-error-banner">⚠️ {errorMessage}</div>
      )}

      <div className="admin-nav">
        <button className={getNavClass('dashboard')} onClick={() => setActiveTab('dashboard')}>
          📈 Dashboard
        </button>
        <button className={getNavClass('users')} onClick={() => setActiveTab('users')}>
          👥 Users
        </button>
        <button className={getNavClass('messages')} onClick={() => setActiveTab('messages')}>
          💬 Messages
        </button>
        <button className={getNavClass('marketplace')} onClick={() => setActiveTab('marketplace')}>
          🛍️ Marketplace
        </button>
        <button className={getNavClass('payments')} onClick={() => setActiveTab('payments')}>
          💳 Payments
        </button>
        <button className={getNavClass('activity')} onClick={() => setActiveTab('activity')}>
          📋 Activity Log
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="admin-stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <h3>Total Users</h3>
              <p className="stat-value">{stats?.totalUsers ?? 0}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <h3>Premium Users</h3>
              <p className="stat-value">{stats?.premiumUsers ?? 0}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💬</div>
              <h3>Total Messages</h3>
              <p className="stat-value">{stats?.totalMessages ?? 0}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💕</div>
              <h3>Total Matches</h3>
              <p className="stat-value">{stats?.totalMatches ?? 0}</p>
            </div>
            <div className="stat-card full-width">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {activityLogs.slice(0, 8).map((log) => (
                  <div key={log._id} className="activity-item">
                    <span>{log?.userId?.name || 'System'}</span>
                    <span>{log.action}</span>
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-section">
            <h2>User Management</h2>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name or email"
              className="admin-search"
            />
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Premium</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.isPremium ? '✅' : '❌'}</td>
                      <td>{user.verified ? 'Verified' : 'Pending'}</td>
                      <td>
                        <button className="admin-action-btn view" onClick={() => setSelectedUser(user)}>
                          View
                        </button>
                        {!user.verified && (
                          <button className="admin-action-btn verify" onClick={() => handleVerifyUser(user._id)}>
                            Verify
                          </button>
                        )}
                        <button className="admin-action-btn delete" onClick={() => handleBanUser(user._id)}>
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

        {activeTab === 'messages' && (
          <div className="admin-section">
            <h2>Message Monitoring</h2>
            <div className="admin-section-controls">
              <input
                type="text"
                value={messageSearch}
                onChange={(e) => setMessageSearch(e.target.value)}
                placeholder="Search messages"
                className="admin-search"
              />
              <label>
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(e) => setIncludeDeleted(e.target.checked)}
                />
                Include deleted
              </label>
            </div>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Text</th>
                    <th>Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg._id} className={msg.deleted ? 'deleted-row' : ''}>
                      <td>{msg.from?.name || 'Unknown'}</td>
                      <td>{msg.to?.name || 'Unknown'}</td>
                      <td>
                        <button className="link-like" onClick={() => setMessageModal(msg)}>
                          {msg.text && msg.text.length > 80 ? msg.text.substring(0, 80) + '...' : msg.text}
                        </button>
                      </td>
                      <td>{new Date(msg.createdAt).toLocaleString()}</td>
                      <td>
                        {!msg.read && (
                          <button className="admin-action-btn" onClick={() => handleMarkRead(msg._id)}>
                            Mark Read
                          </button>
                        )}
                        {!msg.deleted ? (
                          <button className="admin-action-btn delete" onClick={() => handleDeleteMessage(msg._id)}>
                            Delete
                          </button>
                        ) : (
                          <button className="admin-action-btn verify" onClick={() => handleRestoreMessage(msg._id)}>
                            Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="admin-section">
            <h2>Marketplace Management</h2>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Featured</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {marketProducts.map((product) => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{product.price}</td>
                      <td>{product.featured ? '✅' : '—'}</td>
                      <td>
                        <button className="admin-action-btn" onClick={() => toggleFeatured(product._id, !product.featured)}>
                          {product.featured ? 'Unfeature' : 'Feature'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="admin-section">
            <h2>Payment Records</h2>
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Method</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td>{payment.userId?.name || 'Unknown'}</td>
                      <td>{payment.details?.method || '-'}</td>
                      <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="admin-section">
            <h2>Activity Log</h2>
            <div className="activity-log-list">
              {activityLogs.map((log) => (
                <div key={log._id} className="log-entry">
                  <div className="log-header">
                    <span>{log.userId?.name || 'System'}</span>
                    <span>{log.action}</span>
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  {log.details && <div className="log-details">{JSON.stringify(log.details).slice(0, 120)}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {messageModal && (
        <div className="admin-modal" onClick={() => setMessageModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Message Details</h3>
            <p>
              <strong>From:</strong> {messageModal.from?.name || 'Unknown'}
            </p>
            <p>
              <strong>To:</strong> {messageModal.to?.name || 'Unknown'}
            </p>
            <p>{messageModal.text}</p>
            <div className="modal-actions">
              {!messageModal.read && (
                <button
                  className="admin-action-btn"
                  onClick={() => {
                    handleMarkRead(messageModal._id);
                    setMessageModal(null);
                  }}
                >
                  Mark Read
                </button>
              )}
              {messageModal.deleted ? (
                <button
                  className="admin-action-btn verify"
                  onClick={() => {
                    handleRestoreMessage(messageModal._id);
                    setMessageModal(null);
                  }}
                >
                  Restore
                </button>
              ) : (
                <button
                  className="admin-action-btn delete"
                  onClick={() => {
                    handleDeleteMessage(messageModal._id);
                    setMessageModal(null);
                  }}
                >
                  Delete
                </button>
              )}
              <button className="close-modal-btn" onClick={() => setMessageModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="admin-modal" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>User Details</h3>
            <p>
              <strong>Email:</strong> {selectedUser.email}
            </p>
            <p>
              <strong>Verified:</strong> {selectedUser.verified ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Premium:</strong> {selectedUser.isPremium ? 'Yes' : 'No'}
            </p>
            <div className="modal-actions">
              <button className="admin-action-btn verify" onClick={() => handleResetUserPassword(selectedUser._id)}>
                Reset Password
              </button>
              <button className="close-modal-btn" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
