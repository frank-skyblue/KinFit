import { InputHTMLAttributes, useRef, useState, useEffect } from 'react';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  size?: 'default' | 'compact';
  suffix?: string;
}

const sizeStyles = {
  default: {
    label: 'block text-sm font-medium font-inter text-kin-navy mb-2',
    input:
      'w-full px-4 py-3 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter',
  },
  compact: {
    label: 'block text-xs font-inter text-kin-teal mb-1',
    input:
      'w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none text-sm',
  },
};

interface DragState {
  startX: number;
  startY: number;
  startValue: number;
  active: boolean;
}

const FormInput = ({ label, size = 'default', id, className, type, min, max, step, onChange, suffix, ...rest }: FormInputProps) => {
  const styles = sizeStyles[size];
  const isNumber = type === 'number';
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Keep latest props in a single ref so native listeners always have current values
  const propsRef = useRef({ onChange, step, min, max });
  propsRef.current = { onChange, step, min, max };

  // Attach native touch listeners with { passive: false } so preventDefault blocks scrolling
  useEffect(() => {
    const el = inputRef.current;
    if (!el || !isNumber) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      dragRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startValue: parseFloat(el.value || '0') || 0,
        active: false,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const state = dragRef.current;
      if (!state) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;

      if (!state.active) {
        if (Math.abs(deltaY) < 10) return;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          dragRef.current = null;
          return;
        }
        state.active = true;
        setIsDragging(true);
        el.blur();
        document.body.style.overflow = 'hidden';
      }

      e.preventDefault();

      const { step: s, min: mn, max: mx, onChange: cb } = propsRef.current;
      const numStep = Number(s) || 1;
      const steps = Math.round(-deltaY / 20);
      let newValue = state.startValue + steps * numStep;

      const numMin = Number(mn);
      const numMax = Number(mx);
      if (!isNaN(numMin)) newValue = Math.max(numMin, newValue);
      if (!isNaN(numMax)) newValue = Math.min(numMax, newValue);

      cb?.({ target: { value: String(newValue) } } as React.ChangeEvent<HTMLInputElement>);
    };

    const handleTouchEnd = () => {
      dragRef.current = null;
      setIsDragging(false);
      document.body.style.overflow = '';
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isNumber]);

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type={type}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          className={`${styles.input} ${isDragging ? 'ring-2 ring-kin-coral border-transparent' : ''} ${suffix ? 'pr-10' : ''}`}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-kin-stone-400 font-inter select-none" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export default FormInput;
