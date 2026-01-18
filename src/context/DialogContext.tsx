"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

type DialogType = "alert" | "confirm";
type Variant = "success" | "error" | "warning" | "info" | "default";

interface DialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
}

interface DialogContextProps {
  showAlert: (message: string, variant?: Variant) => Promise<void>;
  showConfirm: (message: string, variant?: Variant) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextProps | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DialogOptions>({
    title: "",
    message: "",
  });
  const [type, setType] = useState<DialogType>("alert");
  
  // Ref to hold the resolve function of the current promise
  const resolveRef = useRef<(value: any) => void>(() => {});

  const handleClose = () => {
    setIsOpen(false);
    if (type === "confirm") {
      resolveRef.current(false);
    } else {
      resolveRef.current(undefined);
    }
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (type === "confirm") {
      resolveRef.current(true);
    } else {
      resolveRef.current(undefined);
    }
  };

  const showAlert = useCallback((message: string, variant: Variant = "default") => {
    return new Promise<void>((resolve) => {
      setConfig({
        title: variant === 'error' ? 'Error' : variant === 'success' ? 'Success' : 'Message',
        message,
        confirmLabel: "OK",
        variant,
      });
      setType("alert");
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  const showConfirm = useCallback((message: string, variant: Variant = "warning") => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        title: "Confirm Action",
        message,
        confirmLabel: "Yes, I'm sure",
        cancelLabel: "Cancel",
        variant,
      });
      setType("confirm");
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  // Icon based on variant
  const renderIcon = () => {
      switch(config.variant) {
          case 'error': return (
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </div>
          );
          case 'success': return (
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            </div>
          );
          default: return (
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
            </div>
          );
      }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <Modal 
        isOpen={isOpen} 
        onClose={() => { /* Prevent closing by clicking backdrop for confirm? or allow? */ handleClose(); }} 
        className="max-w-[500px] p-6 rounded-xl"
        showCloseButton={false}
      >
        <div className="sm:flex sm:items-start">
            {renderIcon()}
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white" id="modal-title">
                    {config.title}
                </h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {config.message}
                    </p>
                </div>
            </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
             <Button onClick={handleConfirm} className={config.variant === 'error' ? 'bg-red-600 hover:bg-red-700' : ''}>
                {config.confirmLabel}
             </Button>
             {type === "confirm" && (
                <Button variant="outline" onClick={handleClose}>
                    {config.cancelLabel}
                </Button>
             )}
        </div>
      </Modal>
    </DialogContext.Provider>
  );
};
