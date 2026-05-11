import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";

export default function TimedFlash({ success, error, duration = 3000 }) {
  const { props } = usePage();
  const flashId = props.flash?.id;
  const [visible, setVisible] = useState(Boolean(success || error));

  useEffect(() => {
    if (!success && !error) {
      setVisible(false);
      return undefined;
    }

    setVisible(true);

    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [duration, error, flashId, success]);

  if (!visible) {
    return null;
  }

  if (error) {
    return <div className="alert-warning">{error}</div>;
  }

  return <div className="alert-success">{success}</div>;
}
