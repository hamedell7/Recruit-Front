import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import "../../styles/workflow-manager.css";

function moveItem(items, fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return items;
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function WorkflowManager({ onError }) {
  const workflowKey = "employment_screening";
  const [detail, setDetail] = useState(null);
  const [groups, setGroups] = useState([]);
  const [newStepByGroup, setNewStepByGroup] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.workflowDetail(workflowKey);
      setDetail(result);
      const configured = result.draft_definition?.groups || result.active_definition?.groups || [];
      setGroups(configured.map((group) => ({
        ...group,
        steps: [...(group.steps || [])].sort((a, b) => a.order - b.order).map((step) => ({ ...step })),
      })));
      setNewStepByGroup({});
    } catch (error) {
      onError?.({ type: "error", text: error.message || "دریافت تنظیمات گردش‌کار انجام نشد." });
    } finally {
      setLoading(false);
    }
  }, [workflowKey, onError]);

  useEffect(() => { load(); }, [load]);

  const usedStepKeys = useMemo(
    () => new Set(groups.flatMap((group) => group.steps.map((step) => step.key))),
    [groups],
  );
  const catalog = detail?.step_catalog || [];
  const returnableStepCount = groups.reduce((count, group) => count + group.steps.length, 0);

  const updateGroupTitle = (groupIndex, title) => {
    setGroups((current) => current.map((group, index) => index === groupIndex ? { ...group, title } : group));
  };

  const updateStepTitle = (groupIndex, stepIndex, title) => {
    setGroups((current) => current.map((group, index) => index !== groupIndex ? group : ({
      ...group,
      steps: group.steps.map((step, index2) => index2 === stepIndex ? { ...step, title } : step),
    })));
  };

  const moveGroup = (index, delta) => {
    setGroups((current) => moveItem(current, index, index + delta));
  };

  const moveStep = (groupIndex, stepIndex, delta) => {
    setGroups((current) => current.map((group, index) => index !== groupIndex ? group : ({
      ...group,
      steps: moveItem(group.steps, stepIndex, stepIndex + delta),
    })));
  };

  const changeStepGroup = (fromGroupIndex, stepIndex, targetKey) => {
    if (!targetKey) return;
    setGroups((current) => {
      const source = current[fromGroupIndex];
      const step = source?.steps[stepIndex];
      const targetIndex = current.findIndex((group) => group.key === targetKey);
      if (!step || targetIndex < 0 || targetIndex === fromGroupIndex) return current;
      return current.map((group, index) => {
        if (index === fromGroupIndex) return { ...group, steps: group.steps.filter((_, itemIndex) => itemIndex !== stepIndex) };
        if (index === targetIndex) return { ...group, steps: [...group.steps, step] };
        return group;
      });
    });
  };

  const addStep = (groupIndex) => {
    const key = newStepByGroup[groupIndex];
    const item = catalog.find((entry) => entry.key === key);
    if (!item || usedStepKeys.has(key)) return;
    setGroups((current) => current.map((group, index) => index !== groupIndex ? group : ({
      ...group,
      steps: [...group.steps, { key: item.key, title: item.title, handler_key: item.handler_key }],
    })));
    setNewStepByGroup((current) => ({ ...current, [groupIndex]: "" }));
  };

  const removeStep = (groupIndex, stepIndex) => {
    const step = groups[groupIndex]?.steps[stepIndex];
    if (!step || ["personal", "declaration"].includes(step.key)) return;
    setGroups((current) => current.map((group, index) => index !== groupIndex ? group : ({
      ...group,
      steps: group.steps.filter((_, itemIndex) => itemIndex !== stepIndex),
    })));
  };

  const addGroup = () => {
    let suffix = groups.length + 1;
    let key = "custom_group_" + suffix;
    while (groups.some((group) => group.key === key)) {
      suffix += 1;
      key = "custom_group_" + suffix;
    }
    setGroups((current) => [...current, {
      key,
      title: "گروه جدید",
      order: current.length + 1,
      steps: [],
    }]);
  };

  const removeEmptyGroup = (groupIndex) => {
    if (groups[groupIndex]?.steps.length) return;
    setGroups((current) => current.filter((_, index) => index !== groupIndex));
  };

  const buildDraftPayload = () => ({
    expected_active_version: detail.active_version,
    groups: groups.map((group) => ({
      key: group.key,
      title: group.title.trim(),
      steps: group.steps.map((step) => ({ key: step.key, title: step.title.trim() })),
    })),
  });

  const saveDraft = async () => {
    if (!detail || saving || publishing) return;
    setSaving(true);
    try {
      await api.saveWorkflowDraft(workflowKey, buildDraftPayload());
      await load();
      onError?.({ type: "success", text: "پیش‌نویس گردش‌کار ذخیره شد." });
    } catch (error) {
      onError?.({ type: "error", text: error.message || "ذخیره‌ی پیش‌نویس انجام نشد." });
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!detail || saving || publishing) return;
    setPublishing(true);
    try {
      await api.saveWorkflowDraft(workflowKey, buildDraftPayload());
      await api.publishWorkflow(workflowKey, { expected_active_version: detail.active_version });
      await load();
      onError?.({ type: "success", text: "نسخه‌ی جدید گردش‌کار منتشر شد. درخواست‌های جدید از این نسخه استفاده می‌کنند." });
    } catch (error) {
      onError?.({ type: "error", text: error.message || "انتشار گردش‌کار انجام نشد." });
    } finally {
      setPublishing(false);
    }
  };

  if (loading && !detail) {
    return <section className="workflow-manager"><div className="workflow-manager-state">در حال بارگذاری تنظیمات گردش‌کار…</div></section>;
  }

  return (
    <section className="workflow-manager" dir="rtl">
      <div className="workflow-manager-hero">
        <div>
          <span className="eyebrow">تنظیمات فرایند</span>
          <h1>مدیریت گردش‌کار استخدام و گزینش</h1>
          <p>ترتیب و گروه‌بندی مراحل موجود را تنظیم کنید. این بخش فرم‌ساز عمومی نیست؛ هر مرحله از پردازشگر امن و از پیش پیاده‌سازی‌شده استفاده می‌کند.</p>
        </div>
        <div className="workflow-version-summary">
          <span>نسخه‌ی فعال</span>
          <strong>v{detail?.active_version ?? 1}</strong>
          <small>{detail?.draft_version ? "پیش‌نویس v" + detail.draft_version + " آماده‌ی ویرایش" : "تغییرات جدید هنوز پیش‌نویس نشده‌اند"}</small>
        </div>
      </div>

      <div className="workflow-manager-toolbar">
        <div>
          <strong>{returnableStepCount} مرحله در {groups.length} گروه</strong>
          <span>کلید فنی مراحل ثابت است؛ عنوان نمایشی قابل ویرایش است.</span>
        </div>
        <button type="button" className="workflow-secondary-button" onClick={addGroup}>＋ افزودن گروه</button>
      </div>

      <div className="workflow-manager-groups">
        {groups.map((group, groupIndex) => {
          const available = catalog.filter((item) => !usedStepKeys.has(item.key));
          return (
            <section className="workflow-group-card" key={group.key}>
              <header className="workflow-group-head">
                <span className="workflow-group-grip" aria-hidden="true">⋮⋮</span>
                <label className="workflow-group-title">
                  <span>عنوان گروه</span>
                  <input value={group.title} maxLength={150} onChange={(event) => updateGroupTitle(groupIndex, event.target.value)} />
                </label>
                <div className="workflow-order-actions">
                  <button type="button" aria-label="انتقال گروه به بالا" disabled={groupIndex === 0} onClick={() => moveGroup(groupIndex, -1)}>↑</button>
                  <button type="button" aria-label="انتقال گروه به پایین" disabled={groupIndex === groups.length - 1} onClick={() => moveGroup(groupIndex, 1)}>↓</button>
                  <button type="button" aria-label="حذف گروه خالی" title="فقط گروه خالی قابل حذف است" disabled={group.steps.length > 0} onClick={() => removeEmptyGroup(groupIndex)}>×</button>
                </div>
              </header>

              <div className="workflow-step-list">
                {group.steps.map((step, stepIndex) => (
                  <article className="workflow-step-row" key={step.key}>
                    <span className="workflow-step-position">{stepIndex + 1}</span>
                    <div className="workflow-step-main">
                      <label className="workflow-step-title">
                        <span>عنوان مرحله</span>
                        <input value={step.title} maxLength={150} onChange={(event) => updateStepTitle(groupIndex, stepIndex, event.target.value)} />
                      </label>
                      <div className="workflow-step-meta">
                        <code>{step.key}</code>
                        <span>{catalog.find((entry) => entry.key === step.key)?.handler_key || step.handler_key}</span>
                        {["personal", "declaration"].includes(step.key) && <b>الزامی</b>}
                      </div>
                    </div>
                    <div className="workflow-step-actions">
                      <button type="button" aria-label="انتقال مرحله به بالا" disabled={stepIndex === 0} onClick={() => moveStep(groupIndex, stepIndex, -1)}>↑</button>
                      <button type="button" aria-label="انتقال مرحله به پایین" disabled={stepIndex === group.steps.length - 1} onClick={() => moveStep(groupIndex, stepIndex, 1)}>↓</button>
                      <select aria-label="انتقال به گروه" value={group.key} onChange={(event) => changeStepGroup(groupIndex, stepIndex, event.target.value)}>
                        {groups.map((target) => <option key={target.key} value={target.key}>{target.title || target.key}</option>)}
                      </select>
                      <button type="button" className="workflow-remove-step" disabled={["personal", "declaration"].includes(step.key)} aria-label="حذف مرحله از گردش‌کار" title="مرحله از نسخه‌ی جدید حذف می‌شود؛ اطلاعات قبلی پاک نمی‌شود" onClick={() => removeStep(groupIndex, stepIndex)}>حذف</button>
                    </div>
                  </article>
                ))}
                {group.steps.length === 0 && <p className="workflow-empty-group">این گروه خالی است؛ مرحله‌ای به گروه دیگری منتقل کنید یا گروه را حذف نمایید.</p>}
              </div>

              <footer className="workflow-add-step">
                <select value={newStepByGroup[groupIndex] || ""} onChange={(event) => setNewStepByGroup((current) => ({ ...current, [groupIndex]: event.target.value }))}>
                  <option value="">انتخاب مرحله‌ی آماده برای افزودن…</option>
                  {available.map((item) => <option key={item.key} value={item.key}>{item.title} ({item.key})</option>)}
                </select>
                <button type="button" className="workflow-secondary-button" disabled={!newStepByGroup[groupIndex]} onClick={() => addStep(groupIndex)}>افزودن مرحله</button>
              </footer>
            </section>
          );
        })}
      </div>

      <div className="workflow-manager-footer">
        <p>انتشار نسخه‌ی جدید فقط روی درخواست‌های جدید اعمال می‌شود. پرونده‌های موجود با نسخه‌ی ثبت‌شده‌ی خودشان ادامه می‌یابند.</p>
        <div>
          <button type="button" className="workflow-secondary-button" onClick={load} disabled={saving || publishing}>بارگذاری مجدد</button>
          <button type="button" className="workflow-primary-button" onClick={saveDraft} disabled={saving || publishing}>{saving ? "در حال ذخیره…" : "ذخیره‌ی پیش‌نویس"}</button>
          <button type="button" className="workflow-publish-button" onClick={publish} disabled={!detail || saving || publishing}>{publishing ? "در حال انتشار…" : "انتشار نسخه"}</button>
        </div>
      </div>
    </section>
  );
}

export default WorkflowManager;
