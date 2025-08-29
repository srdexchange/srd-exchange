import { useState, useEffect } from 'react';

interface ModalState {
  orderId: string;
  modalType: 'BUY_UPI' | 'BUY_CDM' | 'SELL_UPI' | 'SELL_CDM';
  currentStep: number;
  formData: any;
  adminPaymentDetails: any;
  lastUpdated: number;
}

export const useModalState = () => {
  const [modalStates, setModalStates] = useState<Record<string, ModalState>>({});

  // Load modal states from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStates = localStorage.getItem('orderModalStates');
      if (savedStates) {
        try {
          const parsed = JSON.parse(savedStates);
          // Filter out states older than 24 hours
          const now = Date.now();
          const validStates = Object.entries(parsed).reduce((acc, [key, state]: [string, any]) => {
            if (now - state.lastUpdated < 24 * 60 * 60 * 1000) { // 24 hours
              acc[key] = state;
            }
            return acc;
          }, {} as Record<string, ModalState>);
          setModalStates(validStates);
        } catch (error) {
          console.error('Error loading modal states:', error);
        }
      }
    }
  }, []);

  // Save modal states to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orderModalStates', JSON.stringify(modalStates));
    }
  }, [modalStates]);

  const saveModalState = (orderId: string, modalType: ModalState['modalType'], currentStep: number, formData: any = {}, adminPaymentDetails: any = null) => {
    if (!orderId) {
      console.warn('Cannot save modal state: orderId is undefined');
      return;
    }
    
    console.log('💾 Saving modal state:', { orderId, modalType, currentStep, adminPaymentDetails: !!adminPaymentDetails });
    setModalStates(prev => ({
      ...prev,
      [orderId]: {
        orderId,
        modalType,
        currentStep,
        formData,
        adminPaymentDetails,
        lastUpdated: Date.now()
      }
    }));
  };

  const getModalState = (orderId: string): ModalState | null => {
    if (!orderId) {
      console.warn('Cannot get modal state: orderId is undefined');
      return null;
    }
    return modalStates[orderId] || null;
  };

  const clearModalState = (orderId: string) => {
    setModalStates(prev => {
      const newState = { ...prev };
      delete newState[orderId];
      return newState;
    });
  };

  const clearAllModalStates = () => {
    setModalStates({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('orderModalStates');
    }
  };

  return {
    saveModalState,
    getModalState,
    clearModalState,
    clearAllModalStates
  };
};