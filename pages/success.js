import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { reset } from '../redux/cartSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../styles/Success.module.css';

export default function SuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;
  const dispatch = useDispatch();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session_id) return;

    async function verifyAndSaveOrder() {
      try {
        const res = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session_id }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to verify Stripe session');
        }

        const orderData = await res.json();
        setOrder(orderData);

        // ✅ Clear cart
        dispatch(reset());
      } catch (err) {
        console.error(err);
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    verifyAndSaveOrder();
  }, [session_id, dispatch]);

  if (loading) return <LoadingSpinner message="Verifying payment and saving order..." />;
  if (error) return <h1 className={styles.error}>Error: {error}</h1>;

  const subtotal = order.subtotal ?? 0;
  const tax = order.tax ?? 0;
  const shipping = order.shippingFee ?? 0;
  const discount = order.discount ?? 0;
  const total = subtotal + tax + shipping - discount;

  const deliveryDate = order.deliveryDate
    ? new Date(order.deliveryDate).toLocaleDateString()
    : 'N/A';
  const deliverySlot = order.deliverySlot ?? 'N/A';

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Payment Successful!</h1>
      <img className={styles.logoContact} src="/img/Amazon.png" alt="Logo" />

      <p className={styles.greeting}>
        Thank you, {order.customer?.name || 'Guest'}. Your order has been saved.
      </p>

      <div className={styles.card}>
        <h2>Order Summary</h2>

        <div className={styles.summaryRow}>
          <span>Order ID:</span>
          <span>{order.displayId || order._id}</span>
        </div>

        <div className={styles.summaryRow}>
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        {order.discount && (
          <div className={styles.summaryRow}>
            <span>Coupon Discount ({order.usedCouponCode}):</span>
            <span>- ${discount.toFixed(2)}</span>
          </div>
        )}

        <div className={styles.summaryRow}>
          <span>Tax:</span>
          <span>${tax.toFixed(2)}</span>
        </div>

        <div className={styles.summaryRow}>
          <span>Shipping:</span>
          <span>${shipping.toFixed(2)}</span>
        </div>

        <div className={`${styles.summaryRow} ${styles.total}`}>
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <h3>Items:</h3>
        <ul className={styles.itemsList}>
          {order.items?.map((item, idx) => (
            <li key={item.productId || idx}>
              {item.title} - {item.quantity} × ${item.price?.toFixed(2)}
              {item.extras?.length > 0 && (
                <span> (Extras: {item.extras.map((e) => e.text).join(', ')})</span>
              )}
            </li>
          ))}
        </ul>

        <h3>Delivery Info:</h3>
        <div className={styles.deliveryInfo}>
          <p>
            <strong>Date:</strong> {deliveryDate}
          </p>
          <p>
            <strong>Time Slot:</strong> {deliverySlot}
          </p>
          <p>
            <strong>Status:</strong> {order.deliveryStatus ?? 'Scheduled'}
          </p>
          <p>
            {order.customer?.address?.street}, {order.customer?.address?.city},{' '}
            {order.customer?.address?.state} {order.customer?.address?.zip},{' '}
            {order.customer?.address?.country}
          </p>
        </div>
      </div>
    </div>
  );
}
