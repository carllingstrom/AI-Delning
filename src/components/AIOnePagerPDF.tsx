'use client';

import OnePagerController from '../export-functions/OnePagerController';

interface AIOnePagerPDFProps {
  project: any;
  children?: (props: { 
    loading: boolean; 
    generatePDF: () => void;
    version: 'data-driven' | 'text-focused';
    setVersion: (version: 'data-driven' | 'text-focused') => void;
  }) => React.ReactNode;
}



export default function AIOnePagerPDF({ project, children }: AIOnePagerPDFProps) {
  return (
    <OnePagerController project={project}>
      {children}
    </OnePagerController>
  );
} 