import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import { reset } from '../redux/cartSlice';
import { updateUser } from '../redux/userSlice';
import { persistor } from '../redux/store';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import styles from '../styles/Checkout.module.css';
import LoadingSpinner from '../components/LoadingSpinner';

const DELIVERY_SLOTS = [
  '08:00–10:00',
  '10:00–12:00',
  '12:00–14:00',
  '14:00–16:00',
  '16:00–18:00',
  '18:00–20:00',
];

const TAX_RATE = 0.06;
const FREE_SHIPPING_THRESHOLD = 250;
const DEFAULT_SHIPPING_FEE = 25;

export default function Checkout() {
  const cart = useSelector((state) => state.cart);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();

  const subtotal =
    cart.products?.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0), 0) || 0;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;

  const defaultAddress = (user.addresses?.length && user.addresses[0]) || {};
  const [isGuest, setIsGuest] = useState(!user.isLoggedIn); // default guest if not logged in

  const [customerName, setCustomerName] = useState(user.name || '');
  const [customerEmail, setCustomerEmail] = useState(user.email || '');
  const [customerPhone, setCustomerPhone] = useState(user.phone || '');
  const [street, setStreet] = useState(defaultAddress.street || '');
  const [city, setCity] = useState(defaultAddress.city || '');
  const [stateAddr, setStateAddr] = useState(defaultAddress.state || '');
  const [zip, setZip] = useState(defaultAddress.zip || '');
  const [country, setCountry] = useState(defaultAddress.country || 'USA');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState(user.couponCode || '');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [taxAmount, setTaxAmount] = useState(Math.round(subtotal * TAX_RATE * 100) / 100);
  const [totalAmount, setTotalAmount] = useState(
    Math.round((subtotal + taxAmount + shippingFee - couponDiscount) * 100) / 100,
  );

  const recalculateTotals = (discount = couponDiscount) => {
    const newTax = Math.round((subtotal - discount) * TAX_RATE * 100) / 100;
    const newTotal = Math.round((subtotal - discount + newTax + shippingFee) * 100) / 100;
    setTaxAmount(newTax);
    setTotalAmount(newTotal);
  };

  const updateRedux = (changes = {}) => {
    if (!user.isLoggedIn) return; // don't update redux for guest
    dispatch(
      updateUser({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        addresses: [{ street, city, state: stateAddr, zip, country }],
        deliveryDate,
        deliverySlot,
        couponCode,
        couponDiscount,
        notes,
        ...changes,
      }),
    );
  };

  useEffect(() => {
    if (user.isLoggedIn) updateRedux();
  }, [
    customerName,
    customerEmail,
    customerPhone,
    street,
    city,
    stateAddr,
    zip,
    country,
    deliveryDate,
    deliverySlot,
    couponCode,
    couponDiscount,
  ]);

  useEffect(() => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponMessage('');
  }, []); // runs once on mount

  useEffect(() => {
    recalculateTotals();
  }, [subtotal, couponDiscount]); // <-- recalc when couponDiscount changes

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const getCustomerAddress = () => ({ street, city, state: stateAddr, zip, country });

  const normalizeItems = (products) =>
    (products || []).map((p) => ({
      productId: p._id,
      title: p.title || 'Untitled',
      quantity: Number(p.quantity || 0),
      price: Number(p.price || 0),
      totalPrice: Math.round(Number(p.quantity || 0) * Number(p.price || 0) * 100) / 100,
      size: p.size || 'Standard',
      extras: (p.extras || []).map((e) => ({ text: e.text, price: Number(e.price || 0) })),
      notes: p?.notes || '',
      whom: p?.whom || '',
      image: p.img || '/img/placeholder.png',
    }));

  const validateForm = () => {
    if (!customerName || !customerEmail || !street || !city || !stateAddr || !zip || !country) {
      alert('Please fill in all name, email, and address fields.');
      return false;
    }
    if (!deliveryDate || !deliverySlot) {
      alert('Please select delivery date & slot.');
      return false;
    }
    if (!cart.products?.length) {
      alert('Your cart is empty.');
      return false;
    }
    return true;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return setCouponMessage('Enter a coupon code');
    try {
      const res = await axios.post('/api/coupons/apply', {
        code: couponCode.trim().toUpperCase(),
        userId: user.id,
        cartTotal: subtotal,
      });

      if (res.data.valid) {
        setCouponDiscount(Number(res.data.discount || 0));
        setCouponMessage(res.data.message || 'Coupon applied!');
      } else {
        setCouponDiscount(0);
        setCouponMessage(res.data.message || 'Invalid coupon');
      }
    } catch (err) {
      console.error(err);
      setCouponMessage(err.response?.data?.message || 'Failed to validate coupon');
      setCouponDiscount(0);
    }
  };

  const placeOrder = async (paymentMethod = 0) => {
    if (!validateForm()) return;
    setLoading(true);
    const payload = {
      userId: user.isLoggedIn ? user.id : null,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: getCustomerAddress(),
      },
      items: normalizeItems(cart.products),
      subtotal,
      tax: taxAmount,
      total: totalAmount,
      method: paymentMethod,
      couponCode: couponCode.trim() || null,
      notes: notes.trim(),
      metadata: { deliveryDate, deliverySlot, ...getCustomerAddress() },
      discount: couponDiscount,
    };

    try {
      const endpoint = paymentMethod === 1 ? '/api/stripe/create-checkout-session' : '/api/orders';
      const res = await axios.post(endpoint, payload);
      const orderId = res.data._id || res.data.order?._id;
      if (paymentMethod === 1 && res.data?.url) window.location.href = res.data.url;
      else if (res.status === 201) {
        dispatch(reset());
        await persistor.flush();
        router.push(`/orders/${orderId}`);
      } else alert('Failed to place order.');
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  const handleCOD = () => placeOrder(0);
  const handleStripeCheckout = () => placeOrder(1);

  return (
    <div className={styles.checkoutWrapper}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <LoadingSpinner message="Verifying payment and saving order..." />
        </div>
      )}
      <div className={styles.container}>
        {/* Top Bar */}
        <div className={styles.topActions}>
          <button className={styles.backButton} onClick={() => router.push('/cart')}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className={styles.title}>Checkout</h1>
        </div>

        {/* User Info */}
        {/* Step 1: Not logged in, hasn’t chosen guest */}

        <div>
          {!user.isLoggedIn && <h3>Please login to prefill your info, or checkout as guest:</h3>}
          <div className={styles.loginPrompt}>
            {!user.isLoggedIn && (
              <>
                <div className={styles.guest}>
                  <label>
                    <input
                      type="checkbox"
                      checked={isGuest}
                      onChange={() => setIsGuest(!isGuest)}
                    />{' '}
                    Guest User
                  </label>
                </div>
              </>
            )}
            <div>
              {!user.isLoggedIn && !isGuest && (
                <button className={styles.login} onClick={() => router.push('/login')}>
                  Login
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Logged in OR guest mode → show full form */}
        {(user.isLoggedIn || isGuest) && (
          <div className={styles.userInfo}>
            <h2>Delivery Address</h2>
            <div className={styles.field}>
              <label>Name</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Phone</label>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Street</label>
              <input value={street} onChange={(e) => setStreet(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>State</label>
              <input value={stateAddr} onChange={(e) => setStateAddr(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>ZIP</label>
              <input value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Country</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className={styles.cartItems}>
          <h2>Cart Items</h2>

          {cart.products?.length ? (
            <>
              {/* Desktop / Tablet Table */}
              <table className={styles.cartTable}>
                <thead>
                  <tr>
                    <th>Picture</th>
                    <th>Title</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.products.map((item, idx) => (
                    <tr key={`${item._id}-${idx}`}>
                      <td>
                        <Image
                          src={item.img || '/img/placeholder.png'}
                          width={50}
                          height={50}
                          alt={item.title}
                          style={{ borderRadius: 6, objectFit: 'cover' }}
                        />
                      </td>
                      <td>
                        {item.title}{' '}
                        {item.extras?.map((e) => (
                          <span key={e.text}>+{e.text}</span>
                        ))}
                      </td>
                      <td>{item.quantity}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className={styles.cartCardList}>
                {cart.products.map((item, idx) => (
                  <div key={`${item._id}-${idx}`} className={styles.cartCard}>
                    <div className={styles.cartCardTop}>
                      <Image
                        src={item.img || '/img/placeholder.png'}
                        width={60}
                        height={60}
                        alt={item.title}
                      />
                      <div className={styles.cartCardInfo}>
                        <span className={styles.title}>{item.title}</span>
                        <div className={styles.extras}>
                          {item.extras?.map((e) => (
                            <span key={e.text}>+{e.text}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={styles.cartCardBottom}>
                      <span>
                        {item.quantity} × ${item.price.toFixed(2)}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ textAlign: 'center', marginTop: 20 }}>Your cart is empty.</p>
          )}
        </div>

        {/* Delivery Scheduling */}
        <div className={styles.deliveryCard}>
          <h2>Schedule Delivery</h2>
          <div className={styles.deliveryGrid}>
            <div className={styles.field}>
              <label>Delivery Date</label>
              <div className={styles.inputWithIconLarge}>
                {/* <FontAwesomeIcon icon={faCalendarAlt} className={styles.iconLarge} /> */}
                <input
                  type="date"
                  placeholder="MM/DD/YYYY"
                  min={minDate}
                  value={deliveryDate}
                  onChange={(e) => {
                    setDeliveryDate(e.target.value);
                    updateRedux();
                  }}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Time Slot</label>
              <div className={styles.inputWithIconLarge}>
                {/* <FontAwesomeIcon icon={faClock} className={styles.iconLarge} /> */}
                <select
                  value={deliverySlot}
                  onChange={(e) => {
                    setDeliverySlot(e.target.value);
                    updateRedux();
                  }}
                >
                  <option value="">Select a 2-hour slot</option>
                  {DELIVERY_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className={styles.notesSection}>
          <h2>Order Notes</h2>
          <textarea
            placeholder="Add any special instructions for your order..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        {/* Order Summary */}
        <div className={styles.orderSummary}>
          <h2>Order Summary</h2>
          <div className={styles.orderSummaryRow}>
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {couponDiscount > 0 && (
            <div className={styles.orderSummaryRow}>
              <span>Coupon Discount:</span>
              <span>- ${couponDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className={styles.orderSummaryRow}>
            <span>Tax (6%):</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className={styles.orderSummaryRow}>
            <span>Shipping:</span>
            {shippingFee === 0 ? (
              <span className={styles.freeShipping}>FREE</span>
            ) : (
              <span>${shippingFee.toFixed(2)}</span>
            )}
          </div>
          <div className={`${styles.orderSummaryRow} ${styles.total}`}>
            <span>Total:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>

          {/* Coupon Section */}
          <div className={styles.couponSection}>
            <input
              type="text"
              placeholder="Coupon Code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={couponDiscount > 0}
            />
            <button onClick={handleApplyCoupon} disabled={!couponCode.trim() || couponDiscount > 0}>
              Apply
            </button>
            {couponDiscount > 0 && (
              <button
                onClick={async () => {
                  try {
                    await axios.put('/api/coupons/remove', {
                      code: couponCode,
                      userId: user.id,
                    });
                    setCouponDiscount('');
                    setCouponCode('');
                    setCouponMessage('');
                    recalculateTotals(0);
                    updateRedux({ couponCode: '', couponDiscount: 0 });
                  } catch (err) {
                    console.error(err);
                    setCouponMessage('Failed to remove coupon');
                  }
                }}
                className={styles.removeCoupon}
              >
                Remove
              </button>
            )}

            {couponMessage && (
              <p className={couponDiscount > 0 ? styles.couponSuccess : styles.couponError}>
                {couponMessage}
              </p>
            )}
          </div>
        </div>

        {/* Payment Options */}
        <div className={styles.payButtons}>
          <h2>Payment Methods</h2>
          <Image
            src="/img/cash.png"
            alt="Cash on Delivery"
            width={200}
            height={60}
            style={{ cursor: 'pointer' }}
            onClick={handleCOD}
          />
          <Image
            src="/img/credit.png"
            alt="Pay with Stripe"
            width={240}
            height={60}
            style={{ cursor: 'pointer' }}
            onClick={handleStripeCheckout}
          />
        </div>
      </div>
    </div>
  );
}
