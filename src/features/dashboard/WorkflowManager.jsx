import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../services/api";
import "../../styles/workflow-manager.css";

const inFlightRequests = new Map();

function requestOnce(key, request) {
  const inFlight = inFlightRequests.get(key);
  if (inFlight) return inFlight;

  const pending = Promise.resolve()
    .then(request)
    .finally(() => {
      if (inFlightRequests.get(key) === pending) inFlightRequests.delete(key);
    });
  inFlightRequests.set(key, pending);
  return pending;
}

function moveItem(items, fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return items;
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function getDropInsertIndex(steps, targetStepKey, position) {
  const targetIndex = steps.findIndex((step) => step.key === targetStepKey);
  if (targetIndex < 0) return -1;

  const constraint = steps[targetIndex].position_constraint;
  if (constraint === "FIRST") return targetIndex + 1;
  if (constraint === "LAST") return targetIndex;
  return position === "after" ? targetIndex + 1 : targetIndex;
}

function WorkflowManager({ onError }) {
  const [selectedRequestTypeCode, setSelectedRequestTypeCode] = useState("");
  const [requestTypes, setRequestTypes] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupKey, setSelectedGroupKey] = useState("");
  const [expandedGroupKeys, setExpandedGroupKeys] = useState({});
  const [draggedStepKey, setDraggedStepKey] = useState("");
  const [dragOverGroupKey, setDragOverGroupKey] = useState("");
  const [dragOverStepKey, setDragOverStepKey] = useState("");
  const [dragOverPosition, setDragOverPosition] = useState("before");
  const [recentlyMovedStepKey, setRecentlyMovedStepKey] = useState("");
  const [draggedStepGroupKey, setDraggedStepGroupKey] = useState("");
  const [draggedStepSource, setDraggedStepSource] = useState("");
  const [focusedStepKey, setFocusedStepKey] = useState("");
  const [newStepByGroup, setNewStepByGroup] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const selectedRequestType = requestTypes.find(
    (type) => type.code === selectedRequestTypeCode && type.is_active !== false,
  ) || null;
  const workflowKey = selectedRequestType?.workflow_key || "";
  const workflowKeyRef = useRef(workflowKey);
  workflowKeyRef.current = workflowKey;

  const load = useCallback(async ({ clearCurrent = false } = {}) => {
    if (!workflowKey) {
      if (clearCurrent) {
        setDetail(null);
        setGroups([]);
      }
      setLoading(false);
      return;
    }
    if (clearCurrent) {
      setDetail(null);
      setGroups([]);
    }
    setLoading(true);
    try {
      const result = await requestOnce(
        "workflow-detail:" + workflowKey,
        () => api.workflowDetail(workflowKey),
      );
      if (workflowKeyRef.current !== workflowKey) return;
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
      if (workflowKeyRef.current === workflowKey) {
        onError?.({ type: "error", text: error.message || "دریافت تنظیمات گردش‌کار انجام نشد." });
      }
    } finally {
      if (workflowKeyRef.current === workflowKey) setLoading(false);
    }
  }, [workflowKey, onError]);

  useEffect(() => {
    load({ clearCurrent: true });
  }, [load]);

  const loadAdminCatalogs = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const result = await requestOnce("workflow-manager:request-types", () => api.staffRequestTypes());
      const items = Array.isArray(result) ? result : [];
      const activeItems = items.filter((type) => type.is_active !== false);
      setRequestTypes(items);
      setSelectedRequestTypeCode((current) => (
        activeItems.some((type) => type.code === current)
          ? current
          : activeItems[0]?.code || ""
      ));
    } catch (error) {
      onError?.({ type: "error", text: error.message || "دریافت فهرست انواع درخواست انجام نشد." });
    } finally {
      setCatalogLoading(false);
    }
  }, [onError]);

  useEffect(() => { loadAdminCatalogs(); }, [loadAdminCatalogs]);

  const usedStepKeys = useMemo(
    () => new Set(groups.flatMap((group) => group.steps.map((step) => step.key))),
    [groups],
  );
  const catalog = detail?.step_catalog || [];
  const returnableStepCount = groups.reduce((count, group) => count + group.steps.length, 0);
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

  useEffect(() => {
    if (!recentlyMovedStepKey) return undefined;
    const timeoutId = window.setTimeout(() => setRecentlyMovedStepKey(""), 320);
    return () => window.clearTimeout(timeoutId);
  }, [recentlyMovedStepKey]);

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

  const moveStepToGroup = (sourceGroupKey, stepKey, targetGroupKey, dropTarget = null) => {
    if (!sourceGroupKey || !targetGroupKey || sourceGroupKey === targetGroupKey) return;
    if (isPositionLockedStep(stepKey)) return;

    setGroups((current) => {
      const sourceGroup = current.find((group) => group.key === sourceGroupKey);
      const targetGroup = current.find((group) => group.key === targetGroupKey);
      const step = sourceGroup?.steps.find((item) => item.key === stepKey);
      if (!sourceGroup || !targetGroup || !step) return current;

      const targetSteps = [...targetGroup.steps];
      const lastPositionIndex = targetSteps.findIndex(
        (item) => item.position_constraint === "LAST",
      );
      const insertIndex = dropTarget?.stepKey
        ? getDropInsertIndex(targetSteps, dropTarget.stepKey, dropTarget.position)
        : lastPositionIndex >= 0 ? lastPositionIndex : targetSteps.length;

      if (insertIndex < 0) return current;
      targetSteps.splice(insertIndex, 0, step);

      return current.map((group) => {
        if (group.key === sourceGroupKey) {
          return { ...group, steps: group.steps.filter((item) => item.key !== stepKey) };
        }
        if (group.key === targetGroupKey) {
          return { ...group, steps: targetSteps };
        }
        return group;
      });
    });

    setSelectedGroupKey(targetGroupKey);
    setExpandedGroupKeys((current) => ({ ...current, [targetGroupKey]: true }));
    setFocusedStepKey(stepKey);
    setRecentlyMovedStepKey(stepKey);
  };

  const moveStepWithinGroup = (groupKey, stepKey, targetStepKey, position) => {
    if (!groupKey || !targetStepKey || stepKey === targetStepKey || isPositionLockedStep(stepKey)) return;

    const group = groups.find((item) => item.key === groupKey);
    const step = group?.steps.find((item) => item.key === stepKey);
    const targetStep = group?.steps.find((item) => item.key === targetStepKey);
    if (!group || !step || !targetStep) return;

    const steps = group.steps.filter((item) => item.key !== stepKey);
    const insertIndex = getDropInsertIndex(steps, targetStepKey, position);
    if (insertIndex < 0) return;
    steps.splice(insertIndex, 0, step);

    const previousOrder = group.steps.map((item) => item.key).join("\u001f");
    const nextOrder = steps.map((item) => item.key).join("\u001f");
    if (previousOrder === nextOrder) return;

    setGroups((current) => current.map((item) => (
      item.key === groupKey ? { ...item, steps } : item
    )));
    setFocusedStepKey(stepKey);
    setRecentlyMovedStepKey(stepKey);
  };

  const moveStepToDropTarget = (sourceGroupKey, stepKey, targetGroupKey, targetStepKey, position) => {
    if (!sourceGroupKey || !targetGroupKey || !targetStepKey || isPositionLockedStep(stepKey)) return;

    if (sourceGroupKey === targetGroupKey) {
      moveStepWithinGroup(sourceGroupKey, stepKey, targetStepKey, position);
      return;
    }

    moveStepToGroup(sourceGroupKey, stepKey, targetGroupKey, {
      stepKey: targetStepKey,
      position,
    });
  };

  const changeStepGroup = (fromGroupIndex, stepIndex, targetKey) => {
    const sourceGroup = groups[fromGroupIndex];
    const step = sourceGroup?.steps[stepIndex];
    if (!step || !targetKey) return;
    if (isPositionLockedStep(step.key)) return;
    moveStepToGroup(sourceGroup.key, step.key, targetKey);
  };

  const handleStepDragStart = (event, groupKey, step, sourceArea = "sidebar") => {
    if (isPositionLockedStep(step.key)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify({
      sourceGroupKey: groupKey,
      stepKey: step.key,
      sourceArea,
    }));
    setDraggedStepKey(step.key);
    setDraggedStepGroupKey(groupKey);
    setDraggedStepSource(sourceArea);
    setDragOverGroupKey("");
    setDragOverStepKey("");
  };

  const resetStepDragState = () => {
    setDraggedStepKey("");
    setDraggedStepGroupKey("");
    setDraggedStepSource("");
    setDragOverGroupKey("");
    setDragOverStepKey("");
    setDragOverPosition("before");
  };

  const handleStepDragEnd = resetStepDragState;

  const handleGroupDragOver = (event, groupKey) => {
    if (!draggedStepKey || !draggedStepGroupKey || isPositionLockedStep(draggedStepKey)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (groupKey !== dragOverGroupKey) setDragOverGroupKey(groupKey);
    if (dragOverStepKey) setDragOverStepKey("");
    setDragOverPosition("before");
  };

  const handleGroupDrop = (event, targetGroupKey) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    resetStepDragState();
    if (!payload) return;

    try {
      const { sourceArea = "sidebar", sourceGroupKey, stepKey } = JSON.parse(payload);
      if (
        !["sidebar", "editor"].includes(sourceArea)
        || !sourceGroupKey
        || !stepKey
        || isPositionLockedStep(stepKey)
      ) return;
      moveStepToGroup(sourceGroupKey, stepKey, targetGroupKey);
    } catch {
      onError?.({ type: "error", text: "انتقال مرحله انجام نشد؛ لطفاً دوباره تلاش کنید." });
    }
  };

  const getStableDropPosition = (event, element, targetStep) => {
    if (targetStep?.position_constraint === "FIRST") return "after";
    if (targetStep?.position_constraint === "LAST") return "before";

    const bounds = element.getBoundingClientRect();
    const ratio = bounds.height > 0 ? (event.clientY - bounds.top) / bounds.height : 0.5;

    // A dead zone around the midpoint prevents tiny pointer movements from
    // flipping the insertion gap between the top and bottom of the same item.
    if (dragOverStepKey === targetStep?.key) {
      if (dragOverPosition === "before" && ratio < 0.62) return "before";
      if (dragOverPosition === "after" && ratio > 0.38) return "after";
    }

    return ratio >= 0.5 ? "after" : "before";
  };

  const resolveSidebarStepDropTarget = (event, groupKey) => {
    const targetElement = event.target instanceof Element ? event.target : null;
    const dropSlot = targetElement?.closest(".workflow-substep-drop-slot");

    if (dropSlot) {
      return {
        stepKey: dropSlot.dataset.dropStepKey || "",
        position: dropSlot.dataset.dropPosition || "before",
      };
    }

    const item = targetElement?.closest(".workflow-substep-item");
    const targetStepKey = item?.dataset.stepKey;
    if (!item || !targetStepKey) return null;

    const group = groups.find((candidate) => candidate.key === groupKey);
    const targetStep = group?.steps.find((step) => step.key === targetStepKey);
    const position = getStableDropPosition(event, item, targetStep);

    return { stepKey: targetStepKey, position };
  };

  const handleSidebarStepListDragOver = (event, groupKey) => {
    if (!draggedStepKey || !draggedStepGroupKey || isPositionLockedStep(draggedStepKey)) return;

    event.preventDefault();
    event.stopPropagation();

    const target = resolveSidebarStepDropTarget(event, groupKey);
    // Preserve the last valid slot across the source row and narrow gaps.
    if (!target || target.stepKey === draggedStepKey) return;

    if (dragOverStepKey !== target.stepKey) setDragOverStepKey(target.stepKey);
    if (dragOverPosition !== target.position) setDragOverPosition(target.position);
    if (dragOverGroupKey) setDragOverGroupKey("");
  };

  const handleSidebarStepListDrop = (event, groupKey) => {
    const payload = event.dataTransfer.getData("text/plain");
    if (!payload) return;

    const target = resolveSidebarStepDropTarget(event, groupKey);
    if (!target?.stepKey) return;

    event.preventDefault();
    event.stopPropagation();
    resetStepDragState();

    try {
      const { sourceArea = "sidebar", sourceGroupKey, stepKey } = JSON.parse(payload);
      if (
        !["sidebar", "editor"].includes(sourceArea)
        || !sourceGroupKey
        || !stepKey
        || isPositionLockedStep(stepKey)
      ) return;

      moveStepToDropTarget(sourceGroupKey, stepKey, groupKey, target.stepKey, target.position);
    } catch {
      onError?.({ type: "error", text: "جابه‌جایی مرحله انجام نشد؛ لطفاً دوباره تلاش کنید." });
    }
  };

  const handleSidebarStepListDragLeave = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setDragOverStepKey("");
    setDragOverPosition("before");
  };

  const resolveStageDropTarget = (event) => {
    const targetElement = event.target instanceof Element ? event.target : null;
    const dropSlot = targetElement?.closest(".workflow-stage-drop-slot");

    if (dropSlot) {
      return {
        stepKey: dropSlot.dataset.dropStepKey || "",
        position: dropSlot.dataset.dropPosition || "before",
      };
    }

    const card = targetElement?.closest(".workflow-stage-card");
    const targetStepKey = card?.dataset.stepKey;
    if (!card || !targetStepKey) return null;

    const targetStep = selectedGroup?.steps.find((step) => step.key === targetStepKey);
    const position = getStableDropPosition(event, card, targetStep);

    return { stepKey: targetStepKey, position };
  };

  const handleStageListDragOver = (event) => {
    if (!draggedStepKey || !draggedStepGroupKey || isPositionLockedStep(draggedStepKey)) return;

    const target = resolveStageDropTarget(event);
    // Retain the last valid slot while crossing the dragged card or row gaps.
    if (!target || target.stepKey === draggedStepKey) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverStepKey !== target.stepKey) setDragOverStepKey(target.stepKey);
    if (dragOverPosition !== target.position) setDragOverPosition(target.position);
    if (dragOverGroupKey) setDragOverGroupKey("");
  };

  const handleStageListDrop = (event) => {
    const payload = event.dataTransfer.getData("text/plain");
    if (!payload) return;

    const target = resolveStageDropTarget(event);
    if (!target?.stepKey) return;

    event.preventDefault();
    resetStepDragState();

    try {
      const { sourceArea, sourceGroupKey, stepKey } = JSON.parse(payload);
      if (
        !["sidebar", "editor"].includes(sourceArea)
        || !sourceGroupKey
        || !stepKey
        || isPositionLockedStep(stepKey)
      ) return;

      moveStepToDropTarget(sourceGroupKey, stepKey, selectedGroupKey, target.stepKey, target.position);
    } catch {
      onError?.({ type: "error", text: "جابه‌جایی مرحله انجام نشد؛ لطفاً دوباره تلاش کنید." });
    }
  };

  const handleStageListDragLeave = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setDragOverStepKey("");
    setDragOverPosition("before");
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

  const requestTypeSelector = (
    <div className="workflow-request-type-selector">
      <label htmlFor="workflow-request-type-select">نوع درخواست</label>
      <select
        id="workflow-request-type-select"
        value={selectedRequestTypeCode}
        onChange={(event) => {
          const nextCode = event.target.value;
          const nextType = requestTypes.find((type) => type.code === nextCode && type.is_active !== false);
          if (nextType?.workflow_key && nextType.workflow_key !== workflowKey) {
            setDetail(null);
            setGroups([]);
            setLoading(true);
          }
          setSelectedRequestTypeCode(nextCode);
        }}
        disabled={catalogLoading || !requestTypes.some((type) => type.is_active !== false)}
      >
        {requestTypes.filter((type) => type.is_active !== false).map((type) => (
          <option key={type.code} value={type.code}>{type.title}</option>
        ))}
      </select>
    </div>
  );

  const workflowSummaryStrip = (
    <div className="workflow-summary-strip" aria-label="خلاصه گردش‌کار">
      {requestTypeSelector}
      <span className="workflow-summary-divider workflow-summary-primary-divider" aria-hidden="true" />
      <div className="workflow-summary-item">
        <span className="workflow-summary-icon">☷</span>
        <span><strong>{groups.length.toLocaleString("fa-IR")}</strong><small>گروه فرایند</small></span>
      </div>
      <span className="workflow-summary-divider" aria-hidden="true" />
      <div className="workflow-summary-item">
        <span className="workflow-summary-icon workflow-summary-icon-blue">↳</span>
        <span><strong>{returnableStepCount.toLocaleString("fa-IR")}</strong><small>مرحله تعریف‌شده</small></span>
      </div>
      <div className="workflow-summary-hint">
        <span className="workflow-summary-hint-dot" />
        ترتیب و عنوان‌ها قابل تنظیم‌اند؛ پردازشگرها از فهرست مجاز سامانه انتخاب می‌شوند.
      </div>
    </div>
  );

  if (catalogLoading || (!detail && workflowKey)) {
    return (
      <section className="workflow-manager" dir="rtl">
        {workflowSummaryStrip}
        <div className="workflow-manager-state">در حال بارگذاری تنظیمات گردش‌کار…</div>
      </section>
    );
  }

  if (!selectedRequestType || !workflowKey) {
    return (
      <section className="workflow-manager" dir="rtl">
        {workflowSummaryStrip}
        <div className="workflow-manager-state">نوع درخواست فعالی که به گردش‌کار متصل باشد پیدا نشد.</div>
      </section>
    );
  }

  return (
    <section className="workflow-manager" dir="rtl">
      <header className="workflow-editor-header">
        <div className="workflow-editor-heading">
          <span className="workflow-editor-eyebrow"><span className="workflow-live-dot" /> تنظیمات فرایند سازمانی</span>
          <h1>مدیریت گردش‌کار {selectedRequestType.title}</h1>
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

      {workflowSummaryStrip}

      <div className="workflow-editor-layout">
        <aside className="workflow-groups-sidebar" aria-label="گروه‌های گردش‌کار">
          <div className="workflow-sidebar-heading">
            <div>
              <span className="workflow-sidebar-kicker">ساختار فرایند</span>
              <h2>گروه‌ها</h2>
              <p>گروه را باز کنید و مراحل را بکشید.</p>
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
                    <div
                      className="workflow-substep-list"
                      id={"workflow-substeps-" + group.key}
                      onDragOver={(event) => handleSidebarStepListDragOver(event, group.key)}
                      onDrop={(event) => handleSidebarStepListDrop(event, group.key)}
                      onDragLeave={handleSidebarStepListDragLeave}
                    >
                      {group.steps.map((step, stepIndex) => {
                        const isFixedStep = isPositionLockedStep(step.key);
                        const isDragging = draggedStepKey === step.key && draggedStepSource === "sidebar";
                        const isDropTarget = Boolean(
                          draggedStepKey
                          && draggedStepKey !== step.key
                          && dragOverStepKey === step.key,
                        );
                        const dropSlot = (position) => (
                          <div
                            className={
                              "workflow-substep-drop-slot"
                              + (position === "after" ? " is-after" : " is-before")
                              + (isDropTarget && dragOverPosition === position ? " is-visible" : "")
                            }
                            data-drop-step-key={step.key}
                            data-drop-position={position}
                            aria-hidden="true"
                          >
                            <span className="workflow-substep-drop-slot-icon">↳</span><span>جایگاه جدید</span>
                          </div>
                        );

                        return (
                          <Fragment key={step.key}>
                            {dropSlot("before")}
                            <button
                              type="button"
                              className={"workflow-substep-item" + (isDragging ? " is-dragging" : "") + (isDropTarget ? " is-drop-target" : "") + (groupIsActive && focusedStepKey === step.key ? " is-focused" : "")}
                              data-step-key={step.key}
                              draggable={!isFixedStep}
                              title={
                                isFixedStep
                                  ? "این مرحله جایگاه ثابتی دارد"
                                  : "برای جابه‌جایی، مرحله را قبل یا بعد از مرحلهٔ مقصد رها کنید"
                              }
                              onClick={() => jumpToStep(group.key, step.key)}
                              onDragStart={(event) => handleStepDragStart(event, group.key, step)}
                              onDragEnd={handleStepDragEnd}
                            >
                              <span className="workflow-substep-grip" aria-hidden="true">{isFixedStep ? "•" : "⠿"}</span>
                              <span className="workflow-substep-copy">{step.title || step.key}</span>
                              {isFixedStep && <span className="workflow-substep-lock" title="مرحله الزامی">●</span>}
                            </button>
                            {dropSlot("after")}
                          </Fragment>
                        );
                      })}
                      {group.steps.length === 0 && <p className="workflow-substep-empty">این گروه هنوز مرحله‌ای ندارد.</p>}
                    </div>
                  )}
                  {groupIsDropTarget && (
                    <div className="workflow-group-drop-hint" aria-live="polite">
                      <span aria-hidden="true">↳</span>
                      <span>برای انتقال، اینجا رها کنید</span>
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
                  <p>مرحله را قبل یا بعد از مقصد رها کنید؛ با انتخاب مقصد از گروهی دیگر، مرحله به همان گروه منتقل می‌شود.</p>
                </div>
                <span className="workflow-stages-count">{selectedGroup.steps.length.toLocaleString("fa-IR")} مرحله</span>
              </div>

              <div
                className="workflow-stage-list"
                onDragOver={handleStageListDragOver}
                onDrop={handleStageListDrop}
                onDragLeave={handleStageListDragLeave}
              >
                {selectedGroup.steps.map((step, stepIndex) => {
                  const isFixedStep = isPositionLockedStep(step.key);
                  const isDragging = draggedStepKey === step.key && draggedStepSource === "editor";
                  const isDropTarget = Boolean(
                    draggedStepKey
                    && draggedStepKey !== step.key
                    && dragOverStepKey === step.key,
                  );
                  const dropSlot = (position) => (
                    <div
                      className={
                        "workflow-stage-drop-slot"
                        + (position === "after" ? " is-after" : " is-before")
                        + (isDropTarget && dragOverPosition === position ? " is-visible" : "")
                      }
                      aria-hidden="true"
                      data-drop-step-key={step.key}
                      data-drop-position={position}
                    >
                      <span className="workflow-stage-drop-slot-icon">↳</span>
                      <span>جایگاه جدید مرحله</span>
                    </div>
                  );

                  return (
                    <Fragment key={step.key}>
                      {dropSlot("before")}
                      <article
                        className={
                          "workflow-stage-card"
                          + (focusedStepKey === step.key ? " is-focused" : "")
                          + (!step.active ? " is-inactive" : "")
                          + (isDragging ? " is-dragging" : "")
                          + (recentlyMovedStepKey === step.key ? " is-just-moved" : "")
                          + (isDropTarget
                            ? (dragOverPosition === "after" ? " is-drop-after" : " is-drop-before")
                            : "")
                        }
                        id={"workflow-stage-" + step.key}
                        data-step-key={step.key}
                      >
                        <span
                          className="workflow-stage-order workflow-stage-drag-handle"
                          draggable={!isFixedStep}
                          title={
                            isFixedStep
                              ? "این مرحله جایگاه ثابتی دارد"
                              : "برای جابه‌جایی، قبل یا بعد از مرحلهٔ مقصد رها کنید"
                          }
                          aria-label={"دستگیره جابه‌جایی مرحله " + (step.title || step.key)}
                          onDragStart={(event) => handleStepDragStart(event, selectedGroup.key, step, "editor")}
                          onDragEnd={handleStepDragEnd}
                        >
                          {!isFixedStep && (
                            <span className="workflow-stage-drag-grip" aria-hidden="true">⠿</span>
                          )}
                          <span>{String(stepIndex + 1).padStart(2, "0")}</span>
                        </span>
                        <div className="workflow-stage-content">
                          <label className="workflow-stage-title-field">
                            <span>عنوان نمایشی مرحله</span>
                            <input
                              value={step.title}
                              maxLength={150}
                              onChange={(event) => updateStepTitle(selectedGroupIndex, stepIndex, event.target.value)}
                            />
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
                            <input
                              type="checkbox"
                              checked={step.active}
                              disabled={isRequiredStep(step.key)}
                              onChange={(event) => updateStepActive(selectedGroupIndex, stepIndex, event.target.checked)}
                            />
                            <span>مرحله فعال</span>
                          </label>
                        </div>
                        <div className="workflow-stage-actions">
                          <div className="workflow-stage-order-buttons">
                            <button
                              type="button"
                              aria-label="انتقال مرحله به بالا"
                              title="انتقال به بالا"
                              disabled={
                                stepIndex === 0
                                || isPositionLockedStep(step.key)
                                || isPositionLockedStep(selectedGroup.steps[stepIndex - 1]?.key)
                              }
                              onClick={() => moveStep(selectedGroupIndex, stepIndex, -1)}
                            >↑</button>
                            <button
                              type="button"
                              aria-label="انتقال مرحله به پایین"
                              title="انتقال به پایین"
                              disabled={
                                stepIndex === selectedGroup.steps.length - 1
                                || isPositionLockedStep(step.key)
                                || isPositionLockedStep(selectedGroup.steps[stepIndex + 1]?.key)
                              }
                              onClick={() => moveStep(selectedGroupIndex, stepIndex, 1)}
                            >↓</button>
                          </div>
                          <label className="workflow-move-step-select">
                            <span>انتقال به گروه</span>
                            <select
                              aria-label={"انتقال مرحله " + step.title + " به گروه دیگر"}
                              value={selectedGroup.key}
                              onChange={(event) => changeStepGroup(selectedGroupIndex, stepIndex, event.target.value)}
                            >
                              {groups.map((target) => (
                                <option key={target.key} value={target.key}>{target.title || target.key}</option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            className="workflow-stage-remove"
                            disabled={isRequiredStep(step.key)}
                            aria-label="حذف مرحله از گردش‌کار"
                            title={
                              isRequiredStep(step.key)
                                ? "مرحله الزامی قابل حذف نیست"
                                : "این مرحله فقط از نسخه جدید حذف می‌شود؛ اطلاعات قبلی پاک نمی‌شود"
                            }
                            onClick={() => removeStep(selectedGroupIndex, stepIndex)}
                          >
                            <span aria-hidden="true">×</span><span>حذف مرحله</span>
                          </button>
                        </div>
                      </article>
                      {dropSlot("after")}
                    </Fragment>
                  );
                })}
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