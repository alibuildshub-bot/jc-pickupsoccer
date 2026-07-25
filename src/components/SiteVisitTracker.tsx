"use client";

import { useEffect } from "react";

const visitorStorageKey = "jc-footy-visitor-id";

export default function SiteVisitTracker() {
  useEffect(() => {
    const visitorId = getVisitorId();

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer || "",
        visitorId,
      }),
      keepalive: true,
    }).catch(() => {
      // Analytics should never interrupt the public site.
    });
  }, []);

  return null;
}

function getVisitorId() {
  const existingId = window.localStorage.getItem(visitorStorageKey);
  if (existingId) return existingId;

  const nextId = crypto.randomUUID();
  window.localStorage.setItem(visitorStorageKey, nextId);

  return nextId;
}
