// redux/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  total: 0,
  quantity: 0,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addProduct: (state, action) => {
      const {
        _id,
        prices = [],
        size = 0,
        extras = [],
        notes = '',
        whom = '',
        isDiscounted = 0,
        quantity = 1,
        update,
        ...rest
      } = action.payload;

      // Calculate per-unit price including extras and discount
      const basePrice = prices[size] ?? prices[0] ?? 0;
      const extrasTotal = extras?.reduce((sum, e) => sum + e.price, 0) || 0;
      const discountedPrice =
        isDiscounted > 0
          ? (basePrice + extrasTotal) * (1 - isDiscounted / 100)
          : basePrice + extrasTotal;

      const productToAdd = {
        _id,
        prices,
        size,
        extras,
        notes,
        whom,
        isDiscounted,
        quantity,
        price: discountedPrice, // unit price
        ...rest,
      };
      if (update) {
        if (action.payload.index !== null && action.payload.index >= 0) {
          state.products[action.payload.index] = { ...productToAdd };
        } else {
          const index = state.products.findIndex(
            (p) =>
              p._id === _id &&
              p.size === size &&
              JSON.stringify(p.extras) === JSON.stringify(extras) &&
              p.notes === notes &&
              p.whom === whom,
          );
          if (index >= 0) {
            state.products[index] = { ...productToAdd };
          } else {
            state.products.push(productToAdd);
          }
        }
      } else {
        state.products.push(productToAdd);
      }

      // Update totals
      state.total = state.products.reduce((sum, item) => sum + item.price * item.quantity, 0);
      state.quantity = state.products.reduce((sum, item) => sum + item.quantity, 0);
    },

    removeProduct: (state, action) => {
      const { _id, size = 0, extras = [], notes = '', whom = '' } = action.payload;

      state.products = state.products.filter(
        (p) =>
          !(
            p._id === _id &&
            p.size === size &&
            JSON.stringify(p.extras) === JSON.stringify(extras) &&
            p.notes === notes &&
            p.whom === whom
          ),
      );

      // Update totals
      state.total = state.products.reduce((sum, item) => sum + item.price * item.quantity, 0);
      state.quantity = state.products.reduce((sum, item) => sum + item.quantity, 0);
    },

    reset: (state) => {
      state.products = [];
      state.total = 0;
      state.quantity = 0;
    },
  },
});

export const { addProduct, removeProduct, reset } = cartSlice.actions;
export default cartSlice.reducer;
