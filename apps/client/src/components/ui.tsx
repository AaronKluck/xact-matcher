import React from 'react';

// Table Components
export const TableCell = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <td className={`table-cell ${className}`}>{children}</td>
);

export const TableHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <th className={`table-header-cell ${className}`}>{children}</th>
);

export const TableRow = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <tr className={`table-row ${className}`}>{children}</tr>
);

export const TableHead = ({ children }: { children: React.ReactNode }) => (
  <thead className="table-header">{children}</thead>
);

export const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="table-body">{children}</tbody>
);

export const Table = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <table className={`table ${className}`}>{children}</table>
);

// Button Component
export const Button = ({ 
  children, 
  onClick, 
  variant = 'default',
  className = '',
  disabled = false 
}: { 
  children: React.ReactNode, 
  onClick?: () => void,
  variant?: 'default' | 'primary' | 'danger' | 'success',
  className?: string,
  disabled?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`btn btn-${variant} ${className}`}
  >
    {children}
  </button>
);

// Form Components
export const Input = ({ 
  type = 'text',
  value,
  onChange,
  step,
  className = ''
}: { 
  type?: 'text' | 'number' | 'date',
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  step?: string,
  className?: string 
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    step={step}
    className={`form-input ${className}`}
  />
);

export const FormField = ({ 
  label,
  type = 'text',
  value,
  onChange,
  step,
  className = ''
}: { 
  label: string,
  type?: 'text' | 'number' | 'date',
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  step?: string,
  className?: string 
}) => (
  <tr>
    <td className="form-label-cell">
      <label className="form-label">{label}</label>
    </td>
    <td className="form-input-cell">
      <Input
        type={type}
        value={value}
        onChange={onChange}
        step={step}
        className={className}
      />
    </td>
  </tr>
); 