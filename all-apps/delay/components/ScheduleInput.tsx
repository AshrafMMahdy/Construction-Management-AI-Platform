import React from 'react';

interface ScheduleInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  rows?: number;
}

const ScheduleInput: React.FC<ScheduleInputProps> = ({ id, label, value, onChange, placeholder, rows = 8 }) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={id} className="font-semibold text-slate-700">
      {label}
    </label>
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 bg-slate-50"
    />
  </div>
);

export default ScheduleInput;