// /pages/userProfile.js
import { useEffect, useState } from "react";

export default function UserProfile({ email }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!email) return;

    fetch(`/api/user/${email}`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, [email]);

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
