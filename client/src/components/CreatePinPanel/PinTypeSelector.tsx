import type { PinType } from '../../../../shared/types';
import { PIN_TYPE_CONFIG } from './pinTypeConfig';
import './PinTypeSelector.css';

interface PinTypeSelectorProps {
  value: PinType;
  onChange: (type: PinType) => void;
}

export function PinTypeSelector({ value, onChange }: PinTypeSelectorProps) {
  return (
    <div className="pin-type-selector">
      <label className="pin-type-selector__label">Type</label>
      <select
        className="pin-type-selector__select"
        value={value}
        onChange={(e) => onChange(e.target.value as PinType)}
      >
        {PIN_TYPE_CONFIG.map((config) => (
          <option key={config.value} value={config.value}>
            {config.emoji} {config.label}
          </option>
        ))}
      </select>
    </div>
  );
}
