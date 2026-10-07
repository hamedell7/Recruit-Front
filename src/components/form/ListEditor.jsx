import { normalizeList } from "../../utils/collections";

function ListEditor({ title, hint, items, setItems, empty, render, readOnly, compact = false, clearValidationError, errorPrefix, addLabel = "افزودن مورد" }) {
  const list = normalizeList(items);
  const clearListErrors = () => errorPrefix && clearValidationError?.(errorPrefix);
  return (
    <section className={"form-section " + (compact ? "compact-section" : "")}>
      <div className="form-section-head">
        <div><h3>{title}</h3>{hint && <p>{hint}</p>}</div>
        {!readOnly && <button className="add-button" onClick={() => { clearListErrors(); setItems([...list, empty()]); }}>+ {addLabel}</button>}
      </div>
      {list.length === 0 ? (
        <div className="inline-empty"><span>∅</span><p>هنوز موردی ثبت نشده است.</p>{!readOnly && <button className="text-button" onClick={() => { clearListErrors(); setItems([empty()]); }}>افزودن اولین مورد</button>}</div>
      ) : (
        <div className="list-stack">{list.map((item, index) => {
          const setItem = (next) => setItems(list.map((entry, i) => i === index ? next : entry));
          return <div key={index} className="list-item-wrap">{render(item, setItem, index)}{!readOnly && <button className="remove-button" onClick={() => { clearListErrors(); setItems(list.filter((_, i) => i !== index)); }}>حذف این مورد</button>}</div>;
        })}</div>
      )}
    </section>
  );
}

export default ListEditor;

