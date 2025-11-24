import React from 'react';
import { useTrackButtonClick } from '@/hooks/useAnalytics';

interface TrackedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  buttonName: string;
  additionalProperties?: Record<string, any>;
  children: React.ReactNode;
}

export default function TrackedButton({
  buttonName,
  additionalProperties,
  children,
  onClick,
  ...props
}: TrackedButtonProps) {
  const handleClick = useTrackButtonClick(buttonName, additionalProperties);

  const combinedOnClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleClick(event);
    onClick?.(event);
  };

  return (
    <button {...props} onClick={combinedOnClick}>
      {children}
    </button>
  );
}
