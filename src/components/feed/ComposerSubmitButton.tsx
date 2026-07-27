'use client';
import { useFormStatus } from 'react-dom';

export function ComposerSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2 rounded-full bg-white font-bold text-xs hover:bg-gray-200 transition-colors shadow disabled:opacity-50"
      style={{ color: "black" }}
    >
      {pending ? 'Ingesting...' : 'Ingest Note'}
    </button>
  );
}
