import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../../styles/admin/Users.module.css';
import Pagination from '../../components/Pagination';

const STATUS_LABELS = ['New', 'Preparing', 'On the way', 'Delivered'];

const UsersTab = () => {
  const [userList, setUserList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchUsers = async (pageNumber = 1) => {
    try {
      const res = await axios.get('/api/users', {
        params: { page: pageNumber, limit },
      });

      setUserList(res.data.users || []);
      setPage(res.data.page || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUserList([]);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleViewUserOrders = async (userId) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null);
      setUserOrders([]);
      return;
    }

    setSelectedUserId(userId);

    try {
      const res = await axios.get('/api/orders', {
        params: { userId },
      });
      setUserOrders(res.data.orders || res.data || []);
    } catch (err) {
      console.error('Failed to fetch user orders:', err);
      setUserOrders([]);
    }
  };

  return (
    <div>
      <h2 className={styles.title}>Users</h2>

      {userList.length === 0 ? (
        <p>No users found</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Addresses</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userList.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || '-'}</td>
                  <td>
                    {user.addresses?.length ? (
                      user.addresses.map((addr) => (
                        <div key={addr._id} className={styles.address}>
                          {addr.street}, {addr.city}, {addr.state} {addr.zip}, {addr.country}{' '}
                          {addr.isDefault && <strong>(Default)</strong>}
                        </div>
                      ))
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>
                    <button
                      className={styles.button}
                      onClick={() => handleViewUserOrders(user._id)}
                    >
                      {selectedUserId === user._id ? 'Hide Orders' : 'View Orders'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className={styles.pagination}>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={() => setPage((prev) => Math.max(prev - 1, 1))}
            />
          </div>
        </>
      )}

      {/* Expanded orders section */}
      {selectedUserId && userOrders.length > 0 && (
        <div className={styles.userOrdersContainer}>
          <h3>Orders for {userList.find((u) => u._id === selectedUserId)?.name}</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Delivery</th>
              </tr>
            </thead>
            <tbody>
              {userOrders.map((order) => (
                <tr key={order._id}>
                  <td>{order.displayId || order.sku}</td>
                  <td>
                    {order.items?.map((item) => (
                      <div key={item._id}>
                        {item.title} x{item.quantity} (${item.price})
                      </div>
                    ))}
                  </td>
                  <td>${order.total}</td>
                  <td>{order.paymentStatus}</td>
                  <td>{STATUS_LABELS[order.status]}</td>
                  <td>
                    {new Date(order.deliveryDate).toLocaleDateString()} <br />
                    {order.deliverySlot} <br />
                    {order.deliveryStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUserId && userOrders.length === 0 && <p>No orders found for this user.</p>}
    </div>
  );
};

export default UsersTab;
