'use client';

import NiceModal from '@ebay/nice-modal-react';

export function NiceModalProvider({ children }: { children: React.ReactNode }) {
  return <NiceModal.Provider>{children}</NiceModal.Provider>;
}
