import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  skeleton?: boolean;
}

export default function LoadingSpinner({ size = 'md', text, skeleton = false }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  if (skeleton) {
    return (
      <div className="animate-pulse space-y-4 w-full">
        <div className="h-4 bg-cf-border rounded-lg w-3/4" />
        <div className="h-4 bg-cf-border rounded-lg w-1/2" />
        <div className="h-32 bg-cf-border rounded-xl w-full" />
        <div className="h-4 bg-cf-border rounded-lg w-2/3" />
        <div className="h-4 bg-cf-border rounded-lg w-1/3" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className={`${sizeMap[size]} text-cf-primary animate-spin`} />
      {text && (
        <p className="text-sm text-cf-text-secondary font-medium">{text}</p>
      )}
    </div>
  );
}
