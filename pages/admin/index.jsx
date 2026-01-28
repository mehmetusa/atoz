import { useEffect, useState } from "react";
import ProductTable from "../../components/admin/ProductTable";
import ManualScanForm from "../../components/admin/ManualScanForm";
import CategorySelector from "../../components/admin/CategorySelector";
import ProductChart from "../../components/ProductChart";
import ScheduleForm from "../../components/ScheduleForm";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const p = {
    id: "ASIN_B08XYZ123",
    title: "Wireless Noise Cancelling Headphones",
    category: "Electronics",
    brand: "SoundPro",
  
    pricing: {
      buyPriceUS: 79.99,      // ABD alış fiyatı
      sellPriceEU: 129.99,    // Avrupa satış fiyatı
      currencyBuy: "USD",
      currencySell: "EUR"
    },
  
    fees: {
      amazonFee: 19.5,
      fbaFee: 7.2,
      shippingUS2EU: 8.5,
      vat: 22.0
    },
  
    profit: {
      gross: 50.0,
      net: 18.8,
      marginPercent: 23.5
    },
  
    sales: {
      estimatedMonthlySales: 320,
      rank: 1450,
      competition: 6
    },
  
    history: {
      dates: [
        "2025-01-01",
        "2025-01-08",
        "2025-01-15",
        "2025-01-22"
      ],
      buyPriceUS: [82, 80, 79, 79.99],
      sellPriceEU: [135, 132, 130, 129.99],
      netProfit: [16, 18, 19, 18.8]
    }
  };

  
  useEffect(() => {
    fetch("/api/getProducts")
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  return (
    <div className="container">
      <h1>Scoutly AI Arbitrage Dashboard</h1>

      <section>
        <h2>Manual Scan</h2>
        <ManualScanForm />
      </section>

      <section>
        <h2>Automatic Scan</h2>
        <CategorySelector />
      </section>

      <section>
        <h2>Product Opportunities</h2>
        <ProductTable products={products} />
      </section>

  <ProductChart product={p} />

<ScheduleForm />

    </div>
  );
}





// import { useState, useEffect } from 'react';
// import { getSession, useSession, signOut } from 'next-auth/react';
// import { useRouter } from 'next/router';
// import LoadingSpinner from '../../components/LoadingSpinner';
// import UsersTab from '../../components/admin/UsersTab';

// import layoutStyles from '../../styles/admin/AdminLayout.module.css';

// import axios from 'axios';

// const AdminPage = ({ products: initialProducts, orders: initialOrders, users: initialUsers }) => {
//   const { data: session, status } = useSession();
//   const router = useRouter();
//   const [activeSection, setActiveSection] = useState('orders');

//   // --- Auth check ---
//   useEffect(() => {
//     if (status === 'loading') return;
//     if (!session || session.user.role !== 'admin') {
//       router.replace('/login');
//     }
//   }, [status, session, router]);

//   if (status === 'loading') return <LoadingSpinner message="Baking something fresh for you..." />;
//   if (!session || session.user.role !== 'admin') return null;

//   return (
//     <div className={layoutStyles.adminContainer}>
//       <h2>Admin Panel</h2>
//       {/* Sidebar */}
//       <div className={layoutStyles.sidePanel}>
//         {['orders', 'products', 'users', 'coupons'].map((section) => (
//           <button
//             key={section}
//             onClick={() => setActiveSection(section)}
//             className={activeSection === section ? layoutStyles.activeTab : ''}
//           >
//             {section.charAt(0).toUpperCase() + section.slice(1)}
//           </button>
//         ))}

//         <button onClick={() => signOut()} className={layoutStyles.logoutButtonSide}>
//           Logout
//         </button>
//       </div>

//       {/* Main Content */}
//       <div className={layoutStyles.mainContent}>
//         {activeSection === 'users' && <UsersTab initialData={initialUsers} />}
//       </div>
//     </div>
//   );
// };

// // --- Server-side props ---
// export const getServerSideProps = async (ctx) => {
//   const session = await getSession({ req: ctx.req });

//   if (!session || session.user.role !== 'admin') {
//     return { redirect: { destination: '/login', permanent: false } };
//   }

//   let products = [],
//     orders = [],
//     users = [],
//     coupons = [];

//   try {
//     const res = await axios.get('/api/products');
//     products = res.data || [];
//   } catch (err) {
//     console.error(err);
//   }

//   try {
//     const res = await axios.get('/api/orders?admin=true&limit=100');
//     orders = res.data.orders || [];
//   } catch (err) {
//     console.error(err);
//   }

//   try {
//     const res = await axios.get('/api/users');
//     users = res.data || [];
//   } catch (err) {
//     console.error(err);
//   }

//   try {
//     const res = await axios.get('/api/coupons');
//     coupons = res.data || [];
//   } catch (err) {
//     console.error(err);
//   }

//   return { props: { products, orders, users, coupons } };
// };

// export default AdminPage;
