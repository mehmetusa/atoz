import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../../styles/User.module.css';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/userSlice';
import Toast from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function UserProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useDispatch();

  const [editing, setEditing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    addresses: [{ street: '', city: '', state: '', zip: '', country: '' }],
  });

  const [toast, setToast] = useState({ show: false, message: '' });
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'user') {
      router.replace('/login');
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const res = await axios.get(`/api/user/${encodeURIComponent(session.user.email)}`);
        const fetchedUser = res.data; // fetched user from API

        // Ensure addresses array exists
        const addresses =
          Array.isArray(fetchedUser.addresses) && fetchedUser.addresses.length > 0
            ? fetchedUser.addresses
            : [{ street: '', city: '', state: '', zip: '', country: 'USA', isDefault: true }];

        // Set local state
        setUserInfo({ ...fetchedUser, addresses });

        // Dispatch to Redux
        dispatch(
          setUser({
            id: fetchedUser._id,
            name: fetchedUser.name,
            email: fetchedUser.email,
            phone: fetchedUser.phone,
            addresses, // keep as array
            role: fetchedUser.role || 'user',
            deliveryDate: fetchedUser.deliveryDate || '',
            deliverySlot: fetchedUser.deliverySlot || '',
            couponCode: fetchedUser.couponCode || '',
            couponDiscount: fetchedUser.couponDiscount || 0,
          }),
        );

        console.log('User loaded into Redux:', fetchedUser);
      } catch (err) {
        console.error('Failed to fetch user info:', err);
        setToast({ show: true, message: 'Failed to fetch user info' });
      }
    };

    fetchUserInfo();
  }, [status, session, router, dispatch]);
  const handleSave = async () => {
    try {
      const payload = {
        name: userInfo.name,
        phone: userInfo.phone,
        address: userInfo.addresses[0], // sending first address for backend
      };

      const res = await axios.put(`/api/user/${encodeURIComponent(userInfo.email)}`, payload);

      const updatedUser = res.data; // <- define it here inside try

      // Ensure addresses array exists
      const addresses =
        Array.isArray(updatedUser.addresses) && updatedUser.addresses.length > 0
          ? updatedUser.addresses
          : [{ street: '', city: '', state: '', zip: '', country: 'USA', isDefault: true }];

      // Update local state
      setUserInfo({ ...updatedUser, addresses });
      setEditing(false);

      // Update Redux
      dispatch(
        setUser({
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          addresses, // keep as array
          role: updatedUser.role || 'user',
          deliveryDate: updatedUser.deliveryDate || '',
          deliverySlot: updatedUser.deliverySlot || '',
          couponCode: updatedUser.couponCode || '',
          couponDiscount: updatedUser.couponDiscount || 0,
        }),
      );

      setToast({ show: true, message: 'Profile updated successfully!' });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to update profile' });
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (status === 'loading') return <LoadingSpinner message="Baking something fresh for you..." />;
  if (!session || session.user.role !== 'user') return null;

  const userFields = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'email', disabled: true },
    { key: 'phone', label: 'Phone', type: 'text' },
  ];

  const addressFields = [
    { key: 'street', label: 'Street' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zip', label: 'ZIP' },
    { key: 'country', label: 'Country' },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>User Panel</h1>
        <p>
          Welcome, <b>{userInfo.name}</b>
        </p>
        <button className={styles.logoutButton} onClick={() => signOut()}>
          Logout
        </button>
      </div>

      <div className={styles.contentWrapper}>
        {/* User Info Section */}
        <div className={styles.userInfoSection}>
          <h2>User Info</h2>
          <div className={styles.userInfoCard}>
            {userFields.map(({ key, label, type, disabled }) => (
              <div key={key} className={styles.userInfoRow}>
                <span className={styles.label}>{label}</span>
                {editing ? (
                  <input
                    type={type}
                    disabled={disabled}
                    value={userInfo[key] || ''}
                    onChange={(e) => setUserInfo({ ...userInfo, [key]: e.target.value })}
                    className={styles.inputField}
                  />
                ) : (
                  <span className={styles.value}>{userInfo[key] || '-'}</span>
                )}
              </div>
            ))}

            {/* Address Section */}
            <h3>Address</h3>
            {addressFields.map(({ key, label }) => (
              <div key={key} className={styles.userInfoRow}>
                <span className={styles.label}>{label}</span>
                {editing ? (
                  <input
                    type="text"
                    value={userInfo.addresses[0][key] || ''}
                    onChange={(e) => {
                      const updatedAddresses = userInfo.addresses.map((addr, idx) =>
                        idx === 0 ? { ...addr, [key]: e.target.value } : addr,
                      );
                      setUserInfo({ ...userInfo, addresses: updatedAddresses });
                    }}
                    className={styles.inputField}
                  />
                ) : (
                  <span className={styles.value}>{userInfo.addresses[0][key] || '-'}</span>
                )}
              </div>
            ))}

            {/* Save/Edit Button */}
            <div className={styles.buttonWrapper}>
              {editing ? (
                <button className={styles.saveButton} onClick={handleSave}>
                  Save
                </button>
              ) : (
                <button className={styles.editButton} onClick={() => setEditing(true)}>
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className={styles.ordersSection}>
          <h2>Your Orders</h2>
          {Array.isArray(orders) && orders.length > 0 ? (
            <div className={styles.ordersContainer}>
              {[...orders]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((order) => {
                  const statusLabels = ['Pending', 'Preparing', 'On the way', 'Delivered'];
                  const formattedAddress = Object.values(order.customer.address)
                    .filter((val) => val && val.trim())
                    .join(', ');

                  return (
                    <div key={order._id} className={styles.orderCard}>
                      {/* Order Header */}
                      <div className={styles.orderHeader}>
                        <h3>Order #{order.sku || order._id}</h3>
                        <p>
                          <b>Total:</b> ${order.total.toFixed(2)}
                        </p>
                        <p>
                          <b>Status:</b> {statusLabels[order.status] || 'Unknown'}
                        </p>
                        <button
                          className={styles.detailsButton}
                          onClick={() => toggleOrderDetails(order._id)}
                        >
                          {expandedOrder === order._id ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>

                      {/* Expandable Details */}
                      {expandedOrder === order._id && (
                        <div className={styles.orderDetails}>
                          <p>
                            <b>Payment:</b>{' '}
                            {order.method === 0 ? 'Cash on Delivery' : 'Online Payment'}
                          </p>
                          <p>
                            <b>Payment Status:</b> {order.paymentStatus}
                          </p>
                          <p>
                            <b>Delivery:</b> {new Date(order.deliveryDate).toLocaleDateString()} (
                            {order.deliverySlot})
                          </p>
                          <p>
                            <b>Delivery Status:</b> {order.deliveryStatus}
                          </p>
                          <p>
                            <b>Address:</b> {formattedAddress}
                          </p>

                          {/* Items */}
                          <div className={styles.itemsContainer}>
                            <h4>Items</h4>
                            {order.items.map((item) => (
                              <div key={item._id} className={styles.itemRow}>
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className={styles.itemImage}
                                />
                                <div className={styles.itemDetails}>
                                  <p>
                                    <b>{item.title}</b>
                                  </p>
                                  <p>Qty: {item.quantity}</p>
                                  <p>Price: ${item.price.toFixed(2)}</p>
                                  {item.notes && <p>Notes: {item.notes}</p>}
                                  {item.whom && <p>Ordered for: {item.whom}</p>}
                                  {item.extras?.length > 0 && (
                                    <div>
                                      <p>Extras:</p>
                                      <ul>
                                        {item.extras.map((ex, i) => (
                                          <li key={i}>
                                            {ex.text} {ex.price ? `(+$${ex.price})` : ''}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <p>No orders yet.</p>
          )}
        </div>
      </div>

      <Toast
        message={toast.message}
        show={toast.show}
        setShow={(show) => setToast({ ...toast, show })}
      />
    </div>
  );
}
