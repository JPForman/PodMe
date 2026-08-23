type FormFieldProps = {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  multiline?: boolean
}

export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = true,
  multiline = false,
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
        />
      )}
      {error && <em className="field-error">{error}</em>}
    </label>
  )
}
