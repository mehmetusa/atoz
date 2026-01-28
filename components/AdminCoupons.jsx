import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../styles/AdminCoupons.module.css';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);

  const fetchCoupons = async () => {
    try {
      const res = await axios.get('/api/coupons');
      setCoupons(res.data);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await axios.put('/api/coupons', { id, status });
      setCoupons((prev) => prev.map((c) => (c._id === id ? { ...c, status: res.data.status } : c)));
    } catch (err) {
      console.error('Failed to update coupon:', err);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const getStatusClass = (coupon) => {
    const status = coupon.status || (coupon.active ? 'Ready' : 'Used');
    if (status === 'Given') return styles['status-given'];
    if (status === 'Used') return styles['status-used'];
    return styles['status-ready'];
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Admin Coupon Panel</h2>

      {coupons.map((coupon) => {
        const status = coupon.status || (coupon.active ? 'Ready' : 'Used');

        return (
          <div key={coupon._id} className={styles.userInfo}>
            <h2>{coupon.code}</h2>

            <div className={styles.field}>
              <label>Discount:</label>
              <input
                type="text"
                value={`${coupon.value}${coupon.discountType === 'percentage' ? '%' : '$'}`}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label>Type:</label>
              <input type="text" value={coupon.discountType} readOnly />
            </div>

            <div className={styles.field}>
              <label>Status:</label>
              <span className={getStatusClass(coupon)}>{status}</span>
            </div>

            <div className={styles.field}>
              <label>Used By:</label>
              <input
                type="text"
                value={coupon.usedBy?.length ? coupon.usedBy.join(', ') : '-'}
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label>Update Status:</label>
              <select value={status} onChange={(e) => updateStatus(coupon._id, e.target.value)}>
                <option value="Ready">Ready</option>
                <option value="Given">Given</option>
                <option value="Used">Used</option>
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminCoupons;
