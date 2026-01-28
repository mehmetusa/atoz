// redux/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const defaultAddress = {
  street: '',
  city: '',
  state: '',
  zip: '',
  country: 'USA',
  isDefault: false,
};

const initialState = {
  id: null,
  name: '',
  email: '',
  phone: '',
  address: defaultAddress,
  role: 'user',
  isLoggedIn: false,
  addresses: [],
  deliveryDate: '',
  deliverySlot: '',
  couponCode: '',
  couponDiscount: 0,
};

// --- Helpers ---
const normalizeAddresses = (addresses = []) => {
  if (!Array.isArray(addresses)) return [];
  return addresses.map((a) => ({
    ...defaultAddress,
    ...a,
  }));
};

const getDefaultAddress = (addresses) =>
  addresses.find((a) => a.isDefault) || addresses[0] || defaultAddress;

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      const user = action.payload || {};

      state.id = user._id || user.id || null;
      state.name = user.name || '';
      state.email = user.email || '';
      state.phone = user.phone || '';
      state.role = user.role || 'user';
      state.isLoggedIn = true;

      // Addresses
      state.addresses = normalizeAddresses(user.addresses);
      state.address = getDefaultAddress(state.addresses);

      // Optional fields
      Object.assign(state, {
        deliveryDate: user.deliveryDate || '',
        deliverySlot: user.deliverySlot || '',
        couponCode: user.couponCode || '',
        couponDiscount: user.couponDiscount || 0,
      });
    },

    updateUser: (state, action) => {
      const payload = action.payload || {};

      // Merge simple fields dynamically
      const simpleFields = [
        'name',
        'email',
        'phone',
        'role',
        'deliveryDate',
        'deliverySlot',
        'couponCode',
        'couponDiscount',
      ];
      simpleFields.forEach((key) => {
        if (payload[key] !== undefined) state[key] = payload[key];
      });

      // Single address update
      if (payload.address) {
        const newAddr = { ...defaultAddress, ...payload.address, isDefault: true };
        state.address = newAddr;

        const idx = state.addresses.findIndex((a) => a.isDefault);
        if (idx !== -1) state.addresses[idx] = newAddr;
        else state.addresses.push(newAddr);
      }

      // Full addresses array update
      if (Array.isArray(payload.addresses)) {
        state.addresses = normalizeAddresses(payload.addresses);
        state.address = getDefaultAddress(state.addresses);
      }
    },

    resetUser: () => initialState,
  },
});

export const { setUser, updateUser, resetUser } = userSlice.actions;
export default userSlice.reducer;
