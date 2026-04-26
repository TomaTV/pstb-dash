"use client";

import { useEffect } from "react";
import AdminPanel from "@/components/AdminPanel";

export default function AdminPage() {
  useEffect(() => {
    document.body.setAttribute("data-admin", "true");
    return () => document.body.removeAttribute("data-admin");
  }, []);
  return <AdminPanel />;
}
