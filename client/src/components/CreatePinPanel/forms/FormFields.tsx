import './FormFields.css';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function TextInput({ label, value, onChange, placeholder, required }: TextInputProps) {
  return (
    <div className="form-field">
      <label className="form-field__label">
        {label}
        {required && <span className="form-field__required">*</span>}
      </label>
      <input
        type="text"
        className="form-field__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function TextArea({ label, value, onChange, placeholder, rows = 3 }: TextAreaProps) {
  return (
    <div className="form-field">
      <label className="form-field__label">{label}</label>
      <textarea
        className="form-field__textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}

interface UrlInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function UrlInput({ label, value, onChange, placeholder }: UrlInputProps) {
  return (
    <div className="form-field">
      <label className="form-field__label">{label}</label>
      <input
        type="url"
        className="form-field__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

interface DateTimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function DateTimeInput({ label, value, onChange }: DateTimeInputProps) {
  return (
    <div className="form-field">
      <label className="form-field__label">{label}</label>
      <input
        type="datetime-local"
        className="form-field__input form-field__input--datetime"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

interface PrioritySelectProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function PrioritySelect({ label, value, onChange }: PrioritySelectProps) {
  return (
    <div className="form-field">
      <label className="form-field__label">{label}</label>
      <select
        className="form-field__select"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value={1}>High</option>
        <option value={2}>Medium</option>
        <option value={3}>Low</option>
      </select>
    </div>
  );
}

interface NumberInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
}

export function NumberInput({ label, value, onChange, placeholder, min = 0 }: NumberInputProps) {
  return (
    <div className="form-field">
      <label className="form-field__label">{label}</label>
      <input
        type="number"
        className="form-field__input form-field__input--number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
      />
    </div>
  );
}

interface SubmitButtonProps {
  isSubmitting: boolean;
  disabled?: boolean;
  label?: string;
}

export function SubmitButton({ isSubmitting, disabled, label = 'Create Pin' }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className="form-field__submit"
      disabled={disabled || isSubmitting}
    >
      {isSubmitting ? 'Creating...' : label}
    </button>
  );
}
