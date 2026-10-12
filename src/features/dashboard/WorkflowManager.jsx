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
  const [workflowKey, setWorkflowKey] = useState("");
  const [availableWorkflows, setAvailableWorkflows] = useState([]);
  const [requestTypes, setRequestTypes] = useState([]);
  const [newWorkflowKey, setNewWorkflowKey] = useState("");
  const [newWorkflowTitle, setNewWorkflowTitle] = useState("");
  const [newRequestTypeCode, setNewRequestTypeCode] = useState("");
  const [newRequestTypeTitle, setNewRequestTypeTitle] = useState("");
  const [newRequestTypeWorkflow, setNewRequestTypeWorkflow] = useState("");
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);
  const [creatingRequestType, setCreatingRequestType] = useState(false);
  const [detail, setDetail] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupKey, setSelectedGroupKey] = useState("");
  const [expandedGroupKeys, setExpandedGroupKeys] = useState({});
  const [draggedStepKey, setDraggedStepKey] = useState("");
  const [dragOverGroupKey, setDragOverGroupKey] = useState("");
  const [focusedStepKey, setFocusedStepKey] = useState("");
  const [newStepByGroup, setNewStepByGroup] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    if (!workflowKey) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await api.workflowDetail(workflowKey);
      setDetail(result);
      const configured = result.draft_definition?.groups || result.active_definition?.groups || [];
      setGroups(configured.map((group) => ({
        ...group,
        steps: [...group.steps].sort((a, b) => a.order - b.order).map((step) => ({ ...step })),
      })));
      setSelectedGroupKey((current) => configured.some((group) => group.key === current)
        ? current
        : (configured[0]?.key || ""));
      setExpandedGroupKeys((current) => {
        const validKeys = new Set(configured.map((group) => group.key));
        const next = Object.fromEntries(Object.entries(current).filter(([key]) => validKeys.has(key)));
        if (configured.length && !Object.values(next).some(Boolean)) next[configured[0].key] = true;
        return next;
      });
      setDraggedStepKey("");
      setDragOverGroupKey("");
      setFocusedStepKey("");
      setNewStepByGroup({});
    } catch (error) {
      onError?.({ type: "error", text: error.message || "دریافت تنظیمات گردش‌کار انجام نشد." });
    } finally {
      setLoading(false);
    }
  }, [workflowKey, onError]);

  useEffect(() => { load(); }, [load]);

  const loadAdminCatalogs = useCallback(async () => {
    try {
      const [workflowsResult, requestTypesResult] = await Promise.all([
        api.workflows(),
        api.staffRequestTypes(),
      ]);
      setAvailableWorkflows(workflowsResult);
      setRequestTypes(requestTypesResult);
      setWorkflowKey((current) => current || workflowsResult[0]?.workflow_key || "");
      setNewRequestTypeWorkflow((current) => current || workflowsResult[0]?.workflow_key || "");
    } catch (error) {
      onError?.({ type: "error", text: error.message || "دریافت فهرست گردش‌کارها و انواع درخواست انجام نشد." });
    }
  }, [onError]);

  useEffect(() => { loadAdminCatalogs(); }, [loadAdminCatalogs]);

  const usedStepKeys = useMemo(
    () => new Set(groups.flatMap((group) => group.steps.map((step) => step.key))),
    [groups],
  );
  const catalog = detail?.step_catalog || [];
  const returnableStepCount = groups.reduce((count, group) => count + group.steps.length, 0);
  const selectedWorkflow = availableWorkflows.find((workflow) => workflow.workflow_key === workflowKey);
  const selectedGroupIndex = groups.findIndex((group) => group.key === selectedGroupKey);
  const findConfiguredStep = (stepKey) => groups.flatMap((group) => group.steps).find((step) => step.key === stepKey);
  const isPositionLockedStep = (stepKey) => {
    const step = findConfiguredStep(stepKey);
    return Boolean(step && step.position_constraint !== "ANY");
  };
  const isRequiredStep = (stepKey) => Boolean(findConfiguredStep(stepKey)?.required);
  const updateStepActive = (groupIndex, stepIndex, active) => {
    if (isRequiredStep(groups[groupIndex]?.steps[stepIndex]?.key) && !active) return;
    setGroups((current) => current.map((group, index) => index !== groupIndex ? group : ({
      ...group,
      steps: group.steps.map((step, index2) => index2 === stepIndex ? { ...step, active } : step),
    })));
  };
  const selectedGroup = selectedGroupIndex >= 0 ? groups[selectedGroupIndex] : null;

  useEffect(() => {
    if (!focusedStepKey || !selectedGroupKey) return;
    document.getElementById("workflow-stage-" + focusedStepKey)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [focusedStepKey, selectedGroupKey]);

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
    const group = groups[groupIndex];
    const targetIndex = stepIndex + delta;
    const step = group?.steps[stepIndex];
    const neighbor = group?.steps[targetIndex];
    if (!step || !neighbor || isPositionLockedStep(step.key) || isPositionLockedStep(neighbor.key)) return;
    setGroups((current) => current.map((item, index) => index !== groupIndex ? item : ({
      ...item,
      steps: moveItem(item.steps, stepIndex, targetIndex),
    })));
  };

  const moveStepToGroup = (sourceGroupKey, stepKey, targetGroupKey) => {
    if (!sourceGroupKey || !targetGroupKey || sourceGroupKey === targetGroupKey) return;
    if (isPositionLockedStep(stepKey)) return;

    setGroups((current) => {
      const sourceGroup = current.find((group) => group.key === sourceGroupKey);
      const step = sourceGroup?.steps.find((item) => item.key === stepKey);
      const targetGroup = current.find((group) => group.key === targetGroupKey);
      if (!step || !targetGroup || !sourceGroup) return current;

      return current.map((group) => {
        if (group.key === sourceGroupKey) {
          return { ...group, steps: group.steps.filter((item) => item.key !== stepKey) };
        }
        if (group.key === targetGroupKey) {
          const steps = [...group.steps];
          const lastPositionIndex = steps.findIndex((item) => (
            item.position_constraint
          ) === "LAST");
          if (lastPositionIndex >= 0) steps.splice(lastPositionIndex, 0, step);
          else steps.push(step);
          return { ...group, steps };
        }
        return group;
      });
    });
    setSelectedGroupKey(targetGroupKey);
    setExpandedGroupKeys((current) => ({ ...current, [targetGroupKey]: true }));
    setFocusedStepKey(stepKey);
  };

  const changeStepGroup = (fromGroupIndex, stepIndex, targetKey) => {
    const sourceGroup = groups[fromGroupIndex];
    const step = sourceGroup?.steps[stepIndex];
    if (!step || !targetKey) return;
    if (isPositionLockedStep(step.key)) return;
    moveStepToGroup(sourceGroup.key, step.key, targetKey);
  };

  const handleStepDragStart = (event, groupKey, step) => {
    if (isPositionLockedStep(step.key)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify({
      sourceGroupKey: groupKey,
      stepKey: step.key,
    }));
    setDraggedStepKey(step.key);
    setDragOverGroupKey("");
  };

  const handleStepDragEnd = () => {
    setDraggedStepKey("");
    setDragOverGroupKey("");
  };

  const handleGroupDragOver = (event, groupKey) => {
    if (!draggedStepKey || isPositionLockedStep(draggedStepKey)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (groupKey !== dragOverGroupKey) setDragOverGroupKey(groupKey);
  };

  const handleGroupDrop = (event, targetGroupKey) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    setDragOverGroupKey("");
    setDraggedStepKey("");
    if (!payload) return;
    try {
      const { sourceGroupKey, stepKey } = JSON.parse(payload);
      if (!stepKey || isPositionLockedStep(stepKey)) return;
      moveStepToGroup(sourceGroupKey, stepKey, targetGroupKey);
    } catch {
      onError?.({ type: "error", text: "انتقال مرحله انجام نشد؛ لطفاً دوباره تلاش کنید." });
    }
  };

  const jumpToStep = (groupKey, stepKey) => {
    setSelectedGroupKey(groupKey);
    setFocusedStepKey(stepKey);
  };

  const addStep = (groupIndex) => {
    const group = groups[groupIndex];
    if (!group) return;
    const key = newStepByGroup[group.key];
    const item = catalog.find((entry) => entry.key === key);
    if (!item || usedStepKeys.has(key)) return;
    setGroups((current) => current.map((itemGroup, index) => index !== groupIndex ? itemGroup : ({
      ...itemGroup,
      steps: [...itemGroup.steps, {
        key: item.key,
        title: item.title,
        handler_key: item.handler_key,
        required: item.is_required,
        position_constraint: item.position_constraint,
        active: true,
      }],
    })));
    setNewStepByGroup((current) => ({ ...current, [group.key]: "" }));
  };

  const removeStep = (groupIndex, stepIndex) => {
    const step = groups[groupIndex]?.steps[stepIndex];
    if (!step || isRequiredStep(step.key)) return;
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
    setSelectedGroupKey(key);
  };

  const removeEmptyGroup = (groupIndex) => {
    const group = groups[groupIndex];
    if (!group || group.steps.length) return;
    const fallbackGroupKey = groups.find((item) => item.key !== group.key)?.key || "";
    setSelectedGroupKey((current) => current === group.key ? fallbackGroupKey : current);
    setGroups((current) => current.filter((item) => item.key !== group.key));
  };

  const createWorkflow = async () => {
    if (!workflowKey || creatingWorkflow) return;
    const key = newWorkflowKey.trim();
    const title = newWorkflowTitle.trim();
    if (!key || !title) {
      onError?.({ type: "error", text: "کلید و عنوان گردش‌کار الزامی هستند." });
      return;
    }
    setCreatingWorkflow(true);
    try {
      const created = await api.createWorkflow({ workflow_key: key, title, template_workflow_key: workflowKey });
      setAvailableWorkflows(await api.workflows());
      setWorkflowKey(created.workflow_key);
      setNewWorkflowKey("");
      setNewWorkflowTitle("");
      onError?.({ type: "success", text: "گردش‌کار جدید از نسخه‌ی منتشرشده‌ی الگو ساخته شد." });
    } catch (error) {
      onError?.({ type: "error", text: error.message || "ساخت گردش‌کار جدید انجام نشد." });
    } finally {
      setCreatingWorkflow(false);
    }
  };

  const createRequestType = async () => {
    if (creatingRequestType) return;
    const code = newRequestTypeCode.trim().toUpperCase();
    const title = newRequestTypeTitle.trim();
    if (!code || !title || !newRequestTypeWorkflow) {
      onError?.({ type: "error", text: "کد، عنوان و گردش‌کار نوع درخواست را مشخص کنید." });
      return;
    }
    setCreatingRequestType(true);
    try {
      await api.createRequestType({ code, title, workflow_key: newRequestTypeWorkflow });
      setRequestTypes(await api.staffRequestTypes());
      setNewRequestTypeCode("");
      setNewRequestTypeTitle("");
      onError?.({ type: "success", text: "نوع درخواست جدید ثبت شد." });
    } catch (error) {
      onError?.({ type: "error", text: error.message || "ساخت نوع درخواست انجام نشد." });
    } finally {
      setCreatingRequestType(false);
    }
  };

  const buildDraftPayload = () => ({
    expected_active_version: detail.active_version,
    groups: groups.map((group) => ({
      key: group.key,
      title: group.title.trim(),
      steps: group.steps.map((step) => ({ key: step.key, title: step.title.trim(), active: step.active })),
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
      <header className="workflow-editor-header">
        <div className="workflow-editor-heading">
          <span className="workflow-editor-eyebrow"><span className="workflow-live-dot" /> تنظیمات فرایند سازمانی</span>
          <h1>مدیریت گردش‌کار {selectedWorkflow?.title || detail?.title || ""}</h1>
          <p>تعریف، ترتیب و گروه‌بندی مراحل را مدیریت کنید. تغییرات پس از انتشار برای درخواست‌های جدید اعمال می‌شوند.</p>
        </div>
        <div className="workflow-version-card">
          <div className="workflow-version-card-top">
            <span>نسخه فعال</span>
            <span className="workflow-version-live"><i /> فعال</span>
          </div>
          <div className="workflow-version-number">v{detail?.active_version ?? 1}</div>
          <div className="workflow-version-card-bottom">
            <span>{detail?.draft_version ? "پیش‌نویس v" + detail.draft_version : "بدون پیش‌نویس ذخیره‌شده"}</span>
            <span className="workflow-version-separator">·</span>
            <span>{returnableStepCount} مرحله</span>
          </div>
        </div>
      </header>

      <section className="workflow-admin-controls" aria-label="مدیریت تعاریف گردش‌کار">
        <div className="workflow-admin-control">
          <label htmlFor="workflow-definition-select">گردش‌کار برای ویرایش</label>
          <select id="workflow-definition-select" value={workflowKey} onChange={(event) => setWorkflowKey(event.target.value)} disabled={!availableWorkflows.length}>
            {availableWorkflows.map((workflow) => <option key={workflow.workflow_key} value={workflow.workflow_key}>{workflow.title} ({workflow.workflow_key})</option>)}
          </select>
        </div>
        <div className="workflow-admin-create-form">
          <strong>ساخت گردش‌کار از نسخه‌ی فعال انتخاب‌شده</strong>
          <input aria-label="کلید گردش‌کار جدید" placeholder="مثلاً contract_employment" value={newWorkflowKey} maxLength={100} onChange={(event) => setNewWorkflowKey(event.target.value)} />
          <input aria-label="عنوان گردش‌کار جدید" placeholder="عنوان گردش‌کار" value={newWorkflowTitle} maxLength={150} onChange={(event) => setNewWorkflowTitle(event.target.value)} />
          <button type="button" className="workflow-action-secondary" onClick={createWorkflow} disabled={creatingWorkflow || !workflowKey}>{creatingWorkflow ? "در حال ساخت…" : "ایجاد گردش‌کار"}</button>
        </div>
      </section>

      <section className="workflow-request-type-panel" aria-label="مدیریت انواع درخواست">
        <div className="workflow-request-type-heading">
          <div><strong>انواع درخواست</strong><p>هر نوع درخواست به یک گردش‌کار فعال متصل می‌شود؛ نسخه‌ی فعال هنگام ایجاد پرونده از سرور تعیین می‌شود.</p></div>
        </div>
        <div className="workflow-request-type-create">
          <input aria-label="کد نوع درخواست جدید" placeholder="کد انگلیسی، مانند CONTRACT_EMPLOYMENT" value={newRequestTypeCode} maxLength={50} onChange={(event) => setNewRequestTypeCode(event.target.value.toUpperCase())} />
          <input aria-label="عنوان نوع درخواست جدید" placeholder="عنوان نوع درخواست" value={newRequestTypeTitle} maxLength={150} onChange={(event) => setNewRequestTypeTitle(event.target.value)} />
          <select aria-label="گردش‌کار نوع درخواست" value={newRequestTypeWorkflow} onChange={(event) => setNewRequestTypeWorkflow(event.target.value)} disabled={!availableWorkflows.length}>
            {availableWorkflows.map((workflow) => <option key={workflow.workflow_key} value={workflow.workflow_key}>{workflow.title}</option>)}
          </select>
          <button type="button" className="workflow-action-secondary" onClick={createRequestType} disabled={creatingRequestType || !availableWorkflows.length}>{creatingRequestType ? "در حال ثبت…" : "افزودن نوع درخواست"}</button>
        </div>
        <div className="workflow-request-type-list">
          {requestTypes.map((type) => (
            <article className="workflow-request-type-item" key={type.id}>
              <div><strong>{type.title}</strong><code>{type.code}</code></div>
              <span>{availableWorkflows.find((workflow) => workflow.workflow_key === type.workflow_key)?.title || type.workflow_key}</span>
              <small>{type.is_active ? "فعال" : "غیرفعال"}{type.workflow_active_version ? " · v" + type.workflow_active_version : ""}</small>
            </article>
          ))}
          {!requestTypes.length && <p>هنوز نوع درخواستی تعریف نشده است.</p>}
        </div>
      </section>

      <div className="workflow-summary-strip">
        <div className="workflow-summary-item">
          <span className="workflow-summary-icon">☷</span>
          <span><strong>{groups.length.toLocaleString("fa-IR")}</strong><small>گروه فرایند</small></span>
        </div>
        <span className="workflow-summary-divider" />
        <div className="workflow-summary-item">
          <span className="workflow-summary-icon workflow-summary-icon-blue">↳</span>
          <span><strong>{returnableStepCount.toLocaleString("fa-IR")}</strong><small>مرحله تعریف‌شده</small></span>
        </div>
        <div className="workflow-summary-hint">
          <span className="workflow-summary-hint-dot" />
          ترتیب و عنوان‌ها قابل تنظیم‌اند؛ پردازشگرها از فهرست مجاز سامانه انتخاب می‌شوند.
        </div>
      </div>

      <div className="workflow-editor-layout">
        <aside className="workflow-groups-sidebar" aria-label="گروه‌های گردش‌کار">
          <div className="workflow-sidebar-heading">
            <div>
              <span className="workflow-sidebar-kicker">ساختار فرایند</span>
              <h2>گروه‌ها</h2>
              <p>برای مدیریت مراحل، یک گروه را انتخاب کنید.</p>
            </div>
            <button type="button" className="workflow-add-group-icon" onClick={addGroup} aria-label="افزودن گروه جدید" title="افزودن گروه">
              <span aria-hidden="true">＋</span>
            </button>
          </div>

          <nav className="workflow-group-navigation" aria-label="فهرست گروه‌ها و مراحل">
            {groups.map((group, groupIndex) => {
              const groupIsExpanded = Boolean(expandedGroupKeys[group.key]);
              const groupIsActive = selectedGroupKey === group.key;
              const groupIsDropTarget = dragOverGroupKey === group.key && draggedStepKey && !isPositionLockedStep(draggedStepKey);
              return (
                <div
                  className={"workflow-group-nav-item" + (groupIsActive ? " is-active" : "") + (groupIsDropTarget ? " is-drop-target" : "")}
                  key={group.key}
                  onDragOver={(event) => handleGroupDragOver(event, group.key)}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setDragOverGroupKey("");
                  }}
                  onDrop={(event) => handleGroupDrop(event, group.key)}
                >
                  <div className="workflow-group-nav-row">
                    <button
                      type="button"
                      className="workflow-group-nav-select"
                      onClick={() => setSelectedGroupKey(group.key)}
                      aria-current={groupIsActive ? "page" : undefined}
                    >
                      <span className="workflow-group-nav-number">{String(groupIndex + 1).padStart(2, "0")}</span>
                      <span className="workflow-group-nav-copy">
                        <strong>{group.title || "گروه بدون عنوان"}</strong>
                        <small>{group.steps.length.toLocaleString("fa-IR")} مرحله</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={"workflow-group-nav-expand" + (groupIsExpanded ? " is-expanded" : "")}
                      aria-label={(groupIsExpanded ? "بستن فهرست مراحل " : "نمایش مراحل ") + group.title}
                      aria-expanded={groupIsExpanded}
                      aria-controls={"workflow-substeps-" + group.key}
                      title={groupIsExpanded ? "بستن مراحل" : "نمایش مراحل"}
                      onClick={() => setExpandedGroupKeys((current) => ({ ...current, [group.key]: !current[group.key] }))}
                    >
                      <span className="workflow-group-nav-chevron" aria-hidden="true">‹</span>
                    </button>
                  </div>
                  {groupIsExpanded && (
                    <div className="workflow-substep-list" id={"workflow-substeps-" + group.key}>
                      {group.steps.map((step, stepIndex) => {
                        const isFixedStep = isPositionLockedStep(step.key);
                        const isDragging = draggedStepKey === step.key;
                        return (
                          <button
                            key={step.key}
                            type="button"
                            className={"workflow-substep-item" + (isDragging ? " is-dragging" : "") + (groupIsActive && focusedStepKey === step.key ? " is-focused" : "")}
                            draggable={!isFixedStep}
                            title={isFixedStep ? "این مرحله برای حفظ ترتیب الزامی قابل کشیدن نیست" : "برای انتقال، این مرحله را بکشید و روی گروه مقصد رها کنید"}
                            onClick={() => jumpToStep(group.key, step.key)}
                            onDragStart={(event) => handleStepDragStart(event, group.key, step)}
                            onDragEnd={handleStepDragEnd}
                          >
                            <span className="workflow-substep-grip" aria-hidden="true">{isFixedStep ? "•" : "⠿"}</span>
                            <span className="workflow-substep-copy">{step.title || step.key}</span>
                            {isFixedStep && <span className="workflow-substep-lock" title="مرحله الزامی">●</span>}
                          </button>
                        );
                      })}
                      {group.steps.length === 0 && <p className="workflow-substep-empty">این گروه هنوز مرحله‌ای ندارد.</p>}
                    </div>
                  )}
                </div>
              );
            })}
            {groups.length === 0 && (
              <div className="workflow-sidebar-empty">
                <span>＋</span>
                <strong>هنوز گروهی وجود ندارد</strong>
                <small>برای شروع، یک گروه جدید بسازید.</small>
              </div>
            )}
          </nav>

          <div className="workflow-sidebar-footer">
            <span className="workflow-sidebar-footer-icon">i</span>
            <p>مرحله‌های «مشخصات فردی» و «تعهد نهایی» برای حفظ اعتبار مسیر الزامی‌اند.</p>
          </div>
        </aside>

        <main className="workflow-editor-main">
          {selectedGroup ? (
            <>
              <div className="workflow-selected-group-head">
                <div className="workflow-selected-group-title">
                  <span className="workflow-selected-group-index">{String(selectedGroupIndex + 1).padStart(2, "0")}</span>
                  <div>
                    <span className="workflow-sidebar-kicker">گروه انتخاب‌شده</span>
                    <label className="workflow-selected-title-field">
                      <input
                        aria-label="عنوان گروه انتخاب‌شده"
                        value={selectedGroup.title}
                        maxLength={150}
                        onChange={(event) => updateGroupTitle(selectedGroupIndex, event.target.value)}
                      />
                    </label>
                    <small>{selectedGroup.steps.length.toLocaleString("fa-IR")} مرحله در این گروه</small>
                  </div>
                </div>
                <div className="workflow-group-management-actions">
                  <button type="button" className="workflow-icon-button" aria-label="انتقال گروه به بالا" title="انتقال به بالا" disabled={selectedGroupIndex === 0} onClick={() => moveGroup(selectedGroupIndex, -1)}>↑</button>
                  <button type="button" className="workflow-icon-button" aria-label="انتقال گروه به پایین" title="انتقال به پایین" disabled={selectedGroupIndex === groups.length - 1} onClick={() => moveGroup(selectedGroupIndex, 1)}>↓</button>
                  <button
                    type="button"
                    className="workflow-icon-button workflow-delete-group-button"
                    aria-label="حذف گروه خالی"
                    title={selectedGroup.steps.length ? "برای حذف، ابتدا مراحل گروه را منتقل کنید" : "حذف گروه خالی"}
                    disabled={selectedGroup.steps.length > 0}
                    onClick={() => removeEmptyGroup(selectedGroupIndex)}
                  >×</button>
                </div>
              </div>

              <div className="workflow-stages-heading">
                <div>
                  <h2>مراحل این گروه</h2>
                  <p>عنوان، ترتیب و محل قرارگیری مراحل را تنظیم کنید.</p>
                </div>
                <span className="workflow-stages-count">{selectedGroup.steps.length.toLocaleString("fa-IR")} مرحله</span>
              </div>

              <div className="workflow-stage-list">
                {selectedGroup.steps.map((step, stepIndex) => (
                  <article
                    className={"workflow-stage-card" + (focusedStepKey === step.key ? " is-focused" : "") + (!step.active ? " is-inactive" : "")}
                    id={"workflow-stage-" + step.key}
                    key={step.key}
                  >
                    <span className="workflow-stage-order">{String(stepIndex + 1).padStart(2, "0")}</span>
                    <div className="workflow-stage-content">
                      <label className="workflow-stage-title-field">
                        <span>عنوان نمایشی مرحله</span>
                        <input value={step.title} maxLength={150} onChange={(event) => updateStepTitle(selectedGroupIndex, stepIndex, event.target.value)} />
                      </label>
                      <div className="workflow-stage-identifiers">
                        <code>{step.key}</code>
                        <span className="workflow-stage-handler">
                          <span className="workflow-stage-handler-dot" />
                          {catalog.find((entry) => entry.key === step.key)?.handler_key || step.handler_key}
                        </span>
                        {isRequiredStep(step.key) && <b className="workflow-stage-required">مرحله الزامی</b>}
                      </div>
                      <label className="workflow-stage-active-toggle">
                        <input type="checkbox" checked={step.active} disabled={isRequiredStep(step.key)} onChange={(event) => updateStepActive(selectedGroupIndex, stepIndex, event.target.checked)} />
                        <span>مرحله فعال</span>
                      </label>
                    </div>
                    <div className="workflow-stage-actions">
                      <div className="workflow-stage-order-buttons">
                        <button type="button" aria-label="انتقال مرحله به بالا" title="انتقال به بالا" disabled={stepIndex === 0 || isPositionLockedStep(step.key) || isPositionLockedStep(selectedGroup.steps[stepIndex - 1]?.key)} onClick={() => moveStep(selectedGroupIndex, stepIndex, -1)}>↑</button>
                        <button type="button" aria-label="انتقال مرحله به پایین" title="انتقال به پایین" disabled={stepIndex === selectedGroup.steps.length - 1 || isPositionLockedStep(step.key) || isPositionLockedStep(selectedGroup.steps[stepIndex + 1]?.key)} onClick={() => moveStep(selectedGroupIndex, stepIndex, 1)}>↓</button>
                      </div>
                      <label className="workflow-move-step-select">
                        <span>انتقال به گروه</span>
                        <select aria-label={"انتقال مرحله " + step.title + " به گروه دیگر"} value={selectedGroup.key} onChange={(event) => changeStepGroup(selectedGroupIndex, stepIndex, event.target.value)}>
                          {groups.map((target) => <option key={target.key} value={target.key}>{target.title || target.key}</option>)}
                        </select>
                      </label>
                      <button type="button" className="workflow-stage-remove" disabled={isRequiredStep(step.key)} aria-label="حذف مرحله از گردش‌کار" title={isRequiredStep(step.key) ? "مرحله الزامی قابل حذف نیست" : "این مرحله فقط از نسخه جدید حذف می‌شود؛ اطلاعات قبلی پاک نمی‌شود"} onClick={() => removeStep(selectedGroupIndex, stepIndex)}>
                        <span aria-hidden="true">×</span><span>حذف مرحله</span>
                      </button>
                    </div>
                  </article>
                ))}
                {selectedGroup.steps.length === 0 && (
                  <div className="workflow-stages-empty">
                    <span className="workflow-stages-empty-icon">↳</span>
                    <strong>این گروه هنوز مرحله‌ای ندارد</strong>
                    <p>از بخش افزودن مرحله، یک مرحله آماده را به این گروه اضافه کنید.</p>
                  </div>
                )}
              </div>

              <div className="workflow-add-stage-panel">
                <div className="workflow-add-stage-copy">
                  <span className="workflow-add-stage-icon">＋</span>
                  <div><strong>افزودن مرحله</strong><small>از میان پردازشگرهای مجاز سامانه انتخاب کنید.</small></div>
                </div>
                <div className="workflow-add-stage-controls">
                  <select aria-label="انتخاب مرحله برای افزودن" value={newStepByGroup[selectedGroup.key] || ""} onChange={(event) => setNewStepByGroup((current) => ({ ...current, [selectedGroup.key]: event.target.value }))}>
                    <option value="">انتخاب مرحله آماده…</option>
                    {catalog.filter((item) => !usedStepKeys.has(item.key)).map((item) => <option key={item.key} value={item.key}>{item.title} ({item.key})</option>)}
                  </select>
                  <button type="button" className="workflow-add-stage-button" disabled={!newStepByGroup[selectedGroup.key]} onClick={() => addStep(selectedGroupIndex)}>＋ افزودن به گروه</button>
                </div>
              </div>
            </>
          ) : (
            <div className="workflow-editor-empty">
              <span className="workflow-editor-empty-icon">☷</span>
              <h2>ساختار فرایند را شروع کنید</h2>
              <p>ابتدا یک گروه بسازید. سپس می‌توانید مراحل مجاز را به آن اضافه و مرتب کنید.</p>
              <button type="button" className="workflow-add-stage-button" onClick={addGroup}>＋ افزودن گروه اول</button>
            </div>
          )}
        </main>
      </div>

      <footer className="workflow-editor-footer">
        <div className="workflow-editor-footer-note">
          <span className="workflow-editor-footer-note-icon">✓</span>
          <div>
            <strong>نسخه‌بندی امن گردش‌کار</strong>
            <p>انتشار نسخه جدید فقط روی درخواست‌های جدید اثر دارد؛ پرونده‌های موجود نسخه ثبت‌شده خود را حفظ می‌کنند.</p>
          </div>
        </div>
        <div className="workflow-editor-footer-actions">
          <button type="button" className="workflow-footer-button workflow-footer-secondary" onClick={load} disabled={saving || publishing}>بارگذاری مجدد</button>
          <button type="button" className="workflow-footer-button workflow-footer-save" onClick={saveDraft} disabled={!detail || groups.length === 0 || saving || publishing}>{saving ? "در حال ذخیره…" : "ذخیره پیش‌نویس"}</button>
          <button type="button" className="workflow-footer-button workflow-footer-publish" onClick={publish} disabled={!detail || groups.length === 0 || saving || publishing}>{publishing ? "در حال انتشار…" : "انتشار نسخه"}</button>
        </div>
      </footer>
    </section>
  );
}

export default WorkflowManager;