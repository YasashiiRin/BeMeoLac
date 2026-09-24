import React from 'react';
import { Modal } from './Modal';
import { BottomSheet } from './BottomSheet';

interface ResponsiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveDrawer: React.FC<ResponsiveDrawerProps> = (props) => {
  return (
    <>
      <div className="hidden md:block">
        <Modal {...props} />
      </div>
      <div className="block md:hidden">
        <BottomSheet {...props} />
      </div>
    </>
  );
};
