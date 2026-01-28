// pages/cancel.jsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CancelPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/checkout'); // 🚀 instantly send back to cart
  }, [router]);

  return null; // nothing rendered
}
