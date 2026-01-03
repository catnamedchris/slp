// Centralized mock for react-datepicker
// Import this in test files that need DatePicker component

interface DatePickerMockProps {
  id: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText: string;
  className?: string;
}

const DatePickerMock = ({
  id,
  selected,
  onChange,
  placeholderText,
  className,
}: DatePickerMockProps) => (
  <input
    type="text"
    id={id}
    value={selected ? selected.toISOString().split('T')[0] : ''}
    placeholder={placeholderText}
    className={className}
    onChange={(e) => {
      const val = e.target.value;
      if (val) {
        const [year, month, day] = val.split('-').map(Number);
        onChange(new Date(year, month - 1, day));
      } else {
        onChange(null);
      }
    }}
  />
);

export default DatePickerMock;
