import React from 'react';

interface DatePickerProps {
  label: string;
  selectedDate: string;
  onChange: (date: string) => void;
  disabled: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({ label, selectedDate, onChange, disabled }) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-brand-accent mb-2">{label}</h3>
      <input
        type="date"
        id="start-date"
        value={selectedDate}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full p-2 bg-brand-secondary border-2 border-brand-muted rounded-md focus:outline-none focus:border-brand-accent transition-colors text-brand-light disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          colorScheme: 'dark',
        }}
      />
    </div>
  );
};

export default DatePicker;
