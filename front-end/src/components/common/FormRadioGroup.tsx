interface RadioOption {
  value: string;
  label: string;
}

interface FormRadioGroupProps {
  label: string;
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const FormRadioGroup = ({ label, name, options, value, onChange, className }: FormRadioGroupProps) => (
  <div className={className}>
    <label className="block text-sm font-medium font-inter text-kin-navy mb-2">{label}</label>
    <div className="flex gap-4">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="mr-2"
          />
          <span className="font-inter text-kin-navy">{opt.label}</span>
        </label>
      ))}
    </div>
  </div>
);

export default FormRadioGroup;
