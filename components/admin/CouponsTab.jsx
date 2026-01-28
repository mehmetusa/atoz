import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../../styles/CouponsTab.module.css';
import Pagination from '../../components/Pagination';

export default function CouponsTab({ initialData }) {
  const [coupons, setCoupons] = useState(initialData?.coupons || []);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountType: 'fixed',
    value: 0,
    maxUses: 1,
    minOrderValue: 0,
    expiryDate: '',
  });

  const [page, setPage] = useState(initialData?.page || 1);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 1);

  // Fetch coupons with pagination
  const fetchCoupons = async (p = 1) => {
    try {
      const res = await axios.get(`/api/coupons?page=${p}&limit=12`);
      setCoupons(res.data.coupons || []);
      setPage(res.data.page || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    }
  };

  useEffect(() => {
    fetchCoupons(page);
  }, [page]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        maxUses: Number(form.maxUses),
        minOrderValue: Number(form.minOrderValue),
      };
      const res = await axios.post('/api/coupons', payload);
      setCoupons([res.data, ...coupons]);
      setForm({
        code: '',
        discountType: 'fixed',
        value: 0,
        maxUses: 1,
        minOrderValue: 0,
        expiryDate: '',
      });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating coupon:', err.response?.data || err);
      alert(err.response?.data?.error || 'Failed to create coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`/api/coupons/${id}`, { status });
      fetchCoupons(page);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await axios.delete(`/api/coupons/${id}`);
      fetchCoupons(page);
    } catch (err) {
      console.error('Error deleting coupon:', err);
      alert('Failed to delete coupon');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Create New Coupons</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Back to List' : '+ New Coupon'}
        </button>
      </div>

      {showForm ? (
        <div className={styles.form}>
          {['code', 'value', 'maxUses', 'minOrderValue'].map((field) => (
            <div className={styles.field} key={field}>
              <label htmlFor={field}>{field === 'value' ? 'Discount Value' : field}</label>
              <input
                id={field}
                name={field}
                type={
                  field === 'value' || field === 'maxUses' || field === 'minOrderValue'
                    ? 'number'
                    : 'text'
                }
                placeholder={field === 'code' ? 'Enter a unique coupon code' : ''}
                value={form[field]}
                onChange={handleChange}
              />
            </div>
          ))}

          <div className={styles.field}>
            <label htmlFor="discountType">Discount Type</label>
            <select
              id="discountType"
              name="discountType"
              value={form.discountType}
              onChange={handleChange}
            >
              <option value="fixed">Fixed ($)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="expiryDate">Expiry Date</label>
            <input
              id="expiryDate"
              name="expiryDate"
              type="date"
              value={form.expiryDate}
              onChange={handleChange}
            />
          </div>

          <button onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create Coupon'}
          </button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Uses</th>
                <th>Min Order</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length > 0 ? (
                coupons.map((c) => (
                  <tr key={c._id}>
                    <td>{c.code}</td>
                    <td>{c.discountType}</td>
                    <td>{c.discountType === 'percentage' ? `${c.value}%` : `$${c.value}`}</td>
                    <td>
                      {c.usedCount}/{c.maxUses}
                    </td>
                    <td>${c.minOrderValue}</td>
                    <td>{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c._id, e.target.value)}
                      >
                        <option value="ready">Ready</option>
                        <option value="given">Given</option>
                        <option value="used">Used</option>
                      </select>
                    </td>
                    <td>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(c._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center' }}>
                    No coupons found
                  </td>
                </tr>
              )}
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
        </div>
      )}
    </div>
  );
}
