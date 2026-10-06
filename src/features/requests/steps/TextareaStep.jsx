import FormSection from "../../../components/form/FormSection";
import TextArea from "../../../components/form/Fields";\n\nfunction TextareaStep({ value, onChange, readOnly, error }) {
  return <FormSection title="توضیحات تکمیلی" hint="هر نکته‌ای که در بخش‌های قبل پوشش داده نشده و لازم است ثبت شود."><TextArea label="متن توضیحات" value={value} onChange={onChange} error={error} rows={12} full readOnly={readOnly} /></FormSection>;
}\n\nexport default TextareaStep;\n