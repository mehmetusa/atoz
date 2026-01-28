import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { addProduct, removeProduct } from '../redux/cartSlice';
import styles from '../styles/Cart.module.css';
import { FaCheck } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function Cart() {
  const cart = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleCheckout = () => {
    if (cart.products.length === 0) return alert('Your cart is empty');
    router.push('/checkout');
  };

  const handleEditItem = (item, newQty, newSize = item.size) => {
    const quantity = Math.min(Math.max(newQty, 1), 20);
    const basePrice = item.prices?.[newSize] ?? item.prices?.[0] ?? 0;
    const extrasTotal = item.extras?.reduce((sum, e) => sum + e.price, 0) || 0;
    const discountedPrice =
      item.isDiscounted > 0
        ? (basePrice + extrasTotal) * (1 - item.isDiscounted / 100)
        : basePrice + extrasTotal;

    dispatch(
      addProduct({
        ...item,
        quantity,
        size: newSize,
        price: discountedPrice,
        update: true,
      }),
    );
  };

  const handleRemoveItem = (item) => {
    dispatch(
      removeProduct({
        _id: item._id,
        size: item.size,
        extras: item.extras || [],
        notes: item.notes || '',
        whom: item.whom || '',
      }),
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.topActions}>
        <button className={styles.backButton} onClick={() => router.push('/products')}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1 className={styles.title}>Your Order</h1>
      </div>

      {cart.products.length > 0 ? (
        <>
          <div className={styles.cardsWrapper}>
            {cart.products.map((item, idx) => (
              <div key={`${item._id}-${idx}`} className={styles.productCard}>
                <Image
                  src={item.img || item.imgs?.[0]}
                  alt={item.title}
                  className={styles.cardImage}
                  width={100}
                  height={100}
                />
                <div className={styles.cardContent}>
                  <div className={styles.productTitle}>{item.title}</div>

                  {/* Size selector if Organic available */}
                  {item.prices?.[1] > 0 && (
                    <div className={styles.sizeSelector}>
                      <button
                        className={`${styles.sizeBtn} ${item.size === 0 ? styles.activeSizeBtn : ''}`}
                        onClick={() => handleEditItem(item, item.quantity, 0)}
                      >
                        Standard
                      </button>
                      <button
                        className={`${styles.sizeBtn} ${item.size === 1 ? styles.activeSizeBtn : ''}`}
                        onClick={() => handleEditItem(item, item.quantity, 1)}
                      >
                        Organic
                      </button>
                    </div>
                  )}

                  {/* Extras */}
                  <div className={styles.extras}>
                    {item.extras?.length > 0
                      ? item.extras.map((e) => (
                          <span key={e.text} className={styles.extraItem}>
                            + {e.text}
                          </span>
                        ))
                      : '-'}
                  </div>

                  {/* Notes */}
                  <div className={styles.notes}>{item.notes ? <em>{item.notes}</em> : '-'}</div>

                  {/* Whom */}
                  <div className={styles.whom}>{item.whom ? <em>{item.whom}</em> : '-'}</div>

                  {/* Quantity and Price */}
                  <div className={styles.cardFooter}>
                    {/* Quantity Controls */}
                    <div className={styles.qtyControls}>
                      <button onClick={() => handleEditItem(item, Math.max(1, item.quantity - 1))}>
                        -
                      </button>
                      <span className={styles.amountNumber}>{item.quantity}</span>
                      <button onClick={() => handleEditItem(item, item.quantity + 1)}>+</button>
                    </div>

                    {/* Price Info */}
                    <div className={styles.priceInfo}>
                      <span>${item.price.toFixed(2)} / unit</span>
                      <span>Total: ${(item.price * item.quantity).toFixed(2)}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.actions}>
                      {/* Edit Product Button */}
                      <button
                        className={styles.editButton}
                        onClick={() =>
                          router.push({
                            pathname: `/product/${item._id}`,
                            query: {
                              edit: 'true',
                              index: idx, // 🔥 cart index
                              size: item.size,
                              notes: item.notes || '',
                              whom: item.whom || '',
                              quantity: item.quantity,
                              extras: JSON.stringify(item.extras || []),
                            },
                          })
                        }
                      >
                        Edit Product
                      </button>

                      {/* Remove Button */}
                      <button
                        className={styles.removeButton}
                        onClick={() => handleRemoveItem(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer: total + checkout */}
          <div className={styles.cartFooter}>
            <div className={styles.totalCard}>
              <h2>Total</h2>
              <p className={styles.totalAmount}>${(cart.total || 0).toFixed(2)}</p>
              <p className={styles.checkoutNote}>
                Delivery, coupons, schedules, and taxes are handled at checkout.
              </p>
            </div>

            <div className={styles.actionsBar}>
              <button className={styles.checkoutBtn} onClick={handleCheckout}>
                <FaCheck style={{ marginRight: '8px' }} />
                Checkout Now
              </button>
            </div>
          </div>
        </>
      ) : (
        <p style={{ textAlign: 'center', fontSize: '18px', color: '#555' }}>Your cart is empty.</p>
      )}
    </div>
  );
}
