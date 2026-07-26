'use client';

import { useEffect } from 'react';
import { useAgentStore } from '@/lib/store';

export default function ContextSetter({ type, id, title }: { type: "HOME" | "CHANNEL" | "TOPIC" | "NOTE", id?: string, title?: string }) {
  const setContext = useAgentStore((state) => state.setContext);

  useEffect(() => {
    setContext({ type, id, title });
  }, [type, id, title, setContext]);

  return null;
}
