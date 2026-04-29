'use client';

import { FormEvent, useMemo, useState } from 'react';

type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox';

type FieldOption = {
  label: string;
  value: string | number | boolean;
};

type FormFieldDefinition = {
  id?: string;
  name?: string;
  type: FieldType;
  label: string;
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean | null;
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  rows?: number;
  options?: FieldOption[];
};

type FormDefinitionJson = {
  title?: string;
  description?: string;
  fields: FormFieldDefinition[];
};

type FormValues = Record<string, string | number | boolean | null>;

type DynamicFormRendererProps = {
  schema: string | FormDefinitionJson;
  initialValues?: FormValues;
  disabled?: boolean;
  submitLabel?: string;
  onSubmit?: (values: FormValues) => void | Promise<void>;
  onChange?: (values: FormValues) => void;
};

const supportedTypes: FieldType[] = [
  'text',
  'textarea',
  'number',
  'date',
  'select',
  'checkbox',
];

const isFieldType = (value: unknown): value is FieldType =>
  typeof value === 'string' && supportedTypes.includes(value as FieldType);

const fieldKey = (field: FormFieldDefinition) => field.id || field.name || '';

const parseSchema = (schema: string | FormDefinitionJson) => {
  const parsed = typeof schema === 'string' ? JSON.parse(schema) : schema;
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.fields)) {
    throw new Error('Form schema must contain a fields array.');
  }
  return parsed as FormDefinitionJson;
};

const buildInitialValues = (
  fields: FormFieldDefinition[],
  initialValues?: FormValues
): FormValues =>
  fields.reduce<FormValues>((acc, field) => {
    const key = fieldKey(field);
    if (!key) return acc;

    if (initialValues && Object.prototype.hasOwnProperty.call(initialValues, key)) {
      acc[key] = initialValues[key];
      return acc;
    }

    if (field.defaultValue !== undefined) {
      acc[key] = field.defaultValue;
    } else if (field.type === 'checkbox') {
      acc[key] = false;
    } else {
      acc[key] = '';
    }
    return acc;
  }, {});

const isEmptyValue = (value: unknown) =>
  value === null || value === undefined || value === '';

const isDateValue = (value: unknown) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

export default function DynamicFormRenderer({
  schema,
  initialValues,
  disabled = false,
  submitLabel = 'Submit',
  onSubmit,
  onChange,
}: DynamicFormRendererProps) {
  const parsedSchemaResult = useMemo(() => {
    try {
      return { schema: parseSchema(schema), error: null as string | null };
    } catch (err: any) {
      return {
        schema: null,
        error: err.message || 'Invalid form schema.',
      };
    }
  }, [schema]);
  const parsedSchema = parsedSchemaResult.schema;
  const [values, setValues] = useState<FormValues>(() =>
    parsedSchema ? buildInitialValues(parsedSchema.fields, initialValues) : {}
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!parsedSchema) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {parsedSchemaResult.error}
      </div>
    );
  }

  const setFieldValue = (key: string, value: string | number | boolean | null) => {
    setValues((current) => {
      const next = { ...current, [key]: value };
      onChange?.(next);
      return next;
    });
  };

  const validate = () => {
    for (const field of parsedSchema.fields) {
      const key = fieldKey(field);
      if (!key) return 'Every field must define id or name.';
      if (!isFieldType(field.type)) return `Unsupported field type: ${field.type}`;
      if (!field.label) return `Field ${key} must define label.`;
      if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        return `Select field ${key} must define options.`;
      }
      if (field.required) {
        const value = values[key];
        const missing =
          isEmptyValue(value) ||
          (field.type === 'checkbox' && value !== true);
        if (missing) return `${field.label} is required.`;
      }

      const value = values[key];
      if (isEmptyValue(value)) {
        continue;
      }

      if ((field.type === 'text' || field.type === 'textarea') && typeof value !== 'string') {
        return `${field.label} must be text.`;
      }

      if (field.type === 'number') {
        if (typeof value !== 'number' || Number.isNaN(value)) {
          return `${field.label} must be a number.`;
        }
        if (typeof field.min === 'number' && value < field.min) {
          return `${field.label} must be greater than or equal to ${field.min}.`;
        }
        if (typeof field.max === 'number' && value > field.max) {
          return `${field.label} must be less than or equal to ${field.max}.`;
        }
      }

      if (field.type === 'date' && !isDateValue(value)) {
        return `${field.label} must be a valid date.`;
      }

      if (field.type === 'checkbox' && typeof value !== 'boolean') {
        return `${field.label} must be true or false.`;
      }

      if (field.type === 'select') {
        const allowedValues = (field.options || []).map((option) => String(option.value));
        if (!allowedValues.includes(String(value))) {
          return `${field.label} must be one of the available options.`;
        }
      }
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError(null);
    await onSubmit?.(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(parsedSchema.title || parsedSchema.description) && (
        <div>
          {parsedSchema.title && (
            <h3 className="text-lg font-bold text-slate-900">{parsedSchema.title}</h3>
          )}
          {parsedSchema.description && (
            <p className="mt-1 text-sm text-slate-600">{parsedSchema.description}</p>
          )}
        </div>
      )}

      {parsedSchema.fields.map((field) => {
        const key = fieldKey(field);
        const fieldDisabled = disabled || field.readonly;

        return (
          <div key={key}>
            {field.type !== 'checkbox' && (
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                {field.label}
                {field.required && <span className="text-red-600"> *</span>}
              </label>
            )}

            {field.type === 'text' && (
              <input
                type="text"
                value={String(values[key] ?? '')}
                onChange={(event) => setFieldValue(key, event.target.value)}
                placeholder={field.placeholder}
                minLength={field.minLength}
                maxLength={field.maxLength}
                disabled={fieldDisabled}
                className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                value={String(values[key] ?? '')}
                onChange={(event) => setFieldValue(key, event.target.value)}
                placeholder={field.placeholder}
                minLength={field.minLength}
                maxLength={field.maxLength}
                rows={field.rows || 4}
                disabled={fieldDisabled}
                className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                value={values[key] === null ? '' : String(values[key] ?? '')}
                onChange={(event) =>
                  setFieldValue(
                    key,
                    event.target.value === '' ? null : Number(event.target.value)
                  )
                }
                min={field.min}
                max={field.max}
                step={field.step}
                placeholder={field.placeholder}
                disabled={fieldDisabled}
                className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              />
            )}

            {field.type === 'date' && (
              <input
                type="date"
                value={String(values[key] ?? '')}
                onChange={(event) => setFieldValue(key, event.target.value)}
                disabled={fieldDisabled}
                className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              />
            )}

            {field.type === 'select' && (
              <select
                value={String(values[key] ?? '')}
                onChange={(event) => setFieldValue(key, event.target.value)}
                disabled={fieldDisabled}
                className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              >
                <option value="">Select...</option>
                {(field.options || []).map((option) => (
                  <option key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'checkbox' && (
              <label className="flex items-start gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={values[key] === true}
                  onChange={(event) => setFieldValue(key, event.target.checked)}
                  disabled={fieldDisabled}
                  className="mt-1"
                />
                <span>
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </span>
              </label>
            )}

            {field.helpText && (
              <p className="mt-1 text-xs text-slate-500">{field.helpText}</p>
            )}
          </div>
        );
      })}

      {submitError && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {onSubmit && (
        <button
          type="submit"
          disabled={disabled}
          className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {submitLabel}
        </button>
      )}
    </form>
  );
}
