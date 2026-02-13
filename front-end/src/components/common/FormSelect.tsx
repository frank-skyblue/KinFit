import { SelectHTMLAttributes } from 'react';

interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: FormSelectOption[];
  size?: 'default' | 'compact';
}

const sizeStyles = {
  default: {
    label: 'block text-sm font-medium font-inter text-kin-navy mb-2',
    select:
      'w-full px-4 py-3 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter',
  },
  compact: {
    label: 'block text-xs font-inter text-kin-teal mb-1',
    select:
      'w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none text-sm',
  },
};

const FormSelect = ({ label, options, size = 'default', id, className, ...rest }: FormSelectProps) => {
  const styles = sizeStyles[size];

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <select id={id} className={styles.select} {...rest}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FormSelect;
