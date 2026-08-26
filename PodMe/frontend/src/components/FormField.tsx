type FormFieldProps = {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  multiline?: boolean
  min?: string
  step?: string
}

export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = true,
  multiline = false,
  min,
  step,
}: FormFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} required={required} />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          min={min}
          step={step}
        />
      )}
      {error && <em className="field-error">{error}</em>}
    </label>
  )
}
