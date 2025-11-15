import { useEffect, useState } from "react";

interface ScreenReaderAnnouncerProps {
  message: string;
  politeness?: "polite" | "assertive";
}

export function ScreenReaderAnnouncer({ message, politeness = "polite" }: ScreenReaderAnnouncerProps) {
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      const timer = setTimeout(() => setAnnouncement(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!announcement) return null;

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

export function useScreenReaderAnnounce() {
  const [message, setMessage] = useState("");

  const announce = (text: string, politeness: "polite" | "assertive" = "polite") => {
    setMessage("");
    setTimeout(() => setMessage(text), 100);
  };

  return { message, announce };
}
