'use client';
import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending} 
      className="w-full bg-[--color-accent-purple] hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50"
    >
      {pending ? 'Processing... (This might take a while)' : 'Process Video (AI Magic)'}
    </button>
  );
}
