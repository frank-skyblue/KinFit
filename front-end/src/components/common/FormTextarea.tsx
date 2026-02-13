import { TextareaHTMLAttributes } from 'react';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

const FormTextarea = ({ label, id, className, ...rest }: FormTextareaProps) => (
  <div className={className}>
    <label htmlFor={id} className="block text-sm font-medium font-inter text-kin-navy mb-2">
      {label}
    </label>
    <textarea
      id={id}
      className="w-full px-4 py-3 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter"
      {...rest}
    />
  </div>
);

export default FormTextarea;
