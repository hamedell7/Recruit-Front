import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../services/api";
import { STEP_DESCRIPTIONS } from "../../config/workflow";
import { formatDate } from "../../utils/date";
import { statusLabel } from "../../utils/status";
import { normalizeList } from "../../utils/collections";
import { cleanLegalIncidentPayload, cleanMarriagePayload, cleanMilitaryPayload, cleanPayload, makeForm, mergeDraft, sanitizeMarriageForm, sanitizeMilitaryForm, validateStep } from "../../utils/form";
import ValidationSummary from "../../components/form/ValidationSummary";
import DraftStatus from "../../components/form/DraftStatus";
import DocumentsStep from "./steps/DocumentsStep";

import StepRailItem from "./StepRailItem";
import StepRenderer from "./StepRenderer";

function buildWorkflowSteps(groups = []) {
  return Array.isArray(groups)
    ? groups.flatMap((group) => (group.steps || []).map((step) => step.key))
    : [];
}

function filterWorkflowGroupsByGender(groups = [], gender) {
  if (!Array.isArray(groups) || groups.length === 0) return [];
  if (String(gender || "").trim() !== "زن") return groups;

  return groups
    .map((group) => ({
      ...group,
      steps: (group.steps || []).filter((step) => (
        step.key !== "military" && step.handler_key !== "military_v1"
      )),
    }))
    .filter((group) => group.steps.length > 0);
}

function militarySkipStorageKey(requestId) {
  return "recruit:request:" + String(requestId) + ":military-skipped";
}

function ensureMilitaryStep(groups = [], template) {
  if (!Array.isArray(groups) || groups.length === 0 || !template) return groups;
  if (groups.some((group) => (group.steps || []).some((step) => (
    step.key === "military" || step.handler_key === "military_v1"
  )))) return groups;

  const clonedGroups = groups.map((group) => ({
    ...group,
    steps: [...(group.steps || [])],
  }));
  let targetGroup = clonedGroups.find((group) => group.key === template.group_key);
  if (!targetGroup) {
    targetGroup = clonedGroups.find((group) => (group.steps || []).some((step) => (
      step.key === "personal" || step.handler_key === "personal_v1"
    )));
  }

  const step = {
    ...template,
    key: "military",
    handler_key: "military_v1",
    active: true,
    required: false,
  };
  if (!targetGroup) {
    clonedGroups.push({
      key: template.group_key || "identity",
      title: template.group_title || "هویت و اطلاعات پایه",
      order: 0,
      steps: [step],
    });
    return clonedGroups;
  }

  const insertAt = targetGroup.steps.findIndex((item) => (
    Number(item.order) > Number(step.order)
  ));
  if (insertAt >= 0) targetGroup.steps.splice(insertAt, 0, step);
  else targetGroup.steps.push(step);
  return clonedGroups;
}

function getApplicantWorkflowGroups(groups = [], gender, militaryTemplate) {
  const completeGroups = String(gender || "").trim() === "زن"
    ? groups
    : ensureMilitaryStep(groups, militaryTemplate);
  return filterWorkflowGroupsByGender(completeGroups, gender);
}


function getEditBlockMessage(resume) {
  if (resume?.edit_block_reason === "REQUEST_TYPE_INACTIVE") {
    return "نوع این درخواست غیرفعال شده است؛ ادامه تکمیل این پرونده امکان‌پذیر نیست.";
  }
  if (resume?.edit_block_reason === "REQUEST_REGISTRATION_NOT_STARTED") {
    return "امکان تکمیل این پرونده از تاریخ " + formatDate(resume.registration_start_date) + " فعال می‌شود.";
  }
  if (resume?.edit_block_reason === "REQUEST_REGISTRATION_CLOSED") {
    return "مهلت تکمیل این پرونده در تاریخ " + formatDate(resume.registration_end_date) + " پایان یافته است؛ اطلاعات فقط برای مشاهده در دسترس است.";
  }
  if (resume?.edit_block_reason === "REQUEST_EDIT_DEADLINE_PASSED") {
    return "مهلت ویرایش این پرونده در " + formatDate(resume.edit_until_date) + " به پایان رسیده است؛ اطلاعات فقط برای مشاهده در دسترس است.";
  }
  const editDeadlineClosed = ["IN_PROGRESS", "RETURNED", "SUBMITTED"].includes(resume?.status)
    && resume?.can_edit !== true
    && Boolean(resume?.edit_until_date);
  if (editDeadlineClosed) {
    return "مهلت ویرایش این پرونده در " + formatDate(resume.edit_until_date) + " به پایان رسیده است؛ اطلاعات فقط برای مشاهده در دسترس است.";
  }
  return "این پرونده در وضعیت فعلی فقط برای مشاهده در دسترس است.";
}

function RequestWizard({ user, request, onBack, onError, sidebarOpen = true }) {
  const [appRequest, setAppRequest] = useState(request);
  const [steps, setSteps] = useState([]);
  const [resume, setResume] = useState(null);
  const [workflowDefinition, setWorkflowDefinition] = useState(null);
  const [workflowTemplateGroups, setWorkflowTemplateGroups] = useState([]);
  const [workflowLoadError, setWorkflowLoadError] = useState("");
  const [showMilitaryPlaceholder, setShowMilitaryPlaceholder] = useState(false);
  const [militarySkipped, setMilitarySkipped] = useState(false);
  const [index, setIndex] = useState(0);
  const [stepData, setStepData] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState(null);
  const [draftStatus, setDraftStatus] = useState("idle");
  const [lastDraftSaved, setLastDraftSaved] = useState(null);
  const [hasSpouse, setHasSpouse] = useState(false);
  const [applicantGender, setApplicantGender] = useState("");
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const validationSummaryRef = useRef(null);
  const autosaveSequence = useRef(0);
  const autosaveTimer = useRef(null);
  const autosaveController = useRef(null);

  const cancelPendingAutosave = () => {
    ++autosaveSequence.current;
    if (autosaveTimer.current !== null) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
    if (autosaveController.current !== null) {
      autosaveController.current.abort();
      autosaveController.current = null;
    }
  };

  const militaryStepTemplate = useMemo(() => {
    for (const group of workflowTemplateGroups) {
      const step = (group.steps || []).find((item) => (
        item.key === "military" || item.handler_key === "military_v1"
      ));
      if (step) {
        return { ...step, group_key: group.key, group_title: group.title };
      }
    }

    const personalGroup = workflowTemplateGroups.find((group) => (
      (group.steps || []).some((step) => step.key === "personal" || step.handler_key === "personal_v1")
    )) || workflowTemplateGroups[0];
    const personalSteps = personalGroup?.steps || [];
    const personalStep = personalSteps.find((step) => (
      step.key === "personal" || step.handler_key === "personal_v1"
    ));
    const marriageStep = personalSteps.find((step) => (
      step.key === "marriage" || step.handler_key === "marriage_v1"
    ));
    return {
      key: "military",
      title: "وضعیت نظام وظیفه",
      handler_key: "military_v1",
      order: Number(marriageStep?.order || personalStep?.order || 1) + 0.5,
      required: false,
      active: false,
      group_key: personalGroup?.key || "identity",
      group_title: personalGroup?.title || "هویت و اطلاعات پایه",
    };
  }, [workflowTemplateGroups]);

  const workflowGroups = useMemo(() => {
    const configuredGroups = workflowDefinition?.groups;
    if (!Array.isArray(configuredGroups) || configuredGroups.length === 0) return [];

    // Keep the applicant-specific route stable while the backend refreshes the
    // active step after saving gender. Otherwise the military step can briefly
    // reappear between the completion response and the refreshed workflow.
    // Gender editing is only possible on the personal step, which is the
    // first workflow step. Use that visible form selection immediately even
    // when the server cursor is many steps ahead.
    const effectiveGender = index === 0 && form?.gender
      ? form.gender
      : applicantGender;
    return filterWorkflowGroupsByGender(configuredGroups, effectiveGender);
  }, [workflowDefinition, index, form?.gender, applicantGender]);


  const workflowSteps = useMemo(() => buildWorkflowSteps(workflowGroups), [workflowGroups]);


  const currentKey = workflowSteps[index] || workflowSteps[0];
  const currentStep = workflowGroups.flatMap((group) => group.steps).find((step) => step.key === currentKey);
  const handlerKey = currentStep?.handler_key;
  const isDocumentsStep = handlerKey === "documents_v1";
  const isFemaleApplicant = (
    handlerKey === "personal_v1" && form?.gender
      ? form.gender
      : applicantGender
  ) === "زن";

  const sidebarWorkflowGroups = useMemo(() => {
    const groups = workflowGroups.map((group) => ({
      ...group,
      steps: [...(group.steps || [])],
    }));

    if (
      !isFemaleApplicant ||
      !militaryStepTemplate ||
      groups.some((group) => group.steps.some((step) => step.key === "military" || step.handler_key === "military_v1"))
    ) {
      return groups;
    }

    const placeholder = {
      ...militaryStepTemplate,
      key: "military",
      disabled_placeholder: true,
      active: false,
    };
    let targetGroup = groups.find((group) => group.key === militaryStepTemplate.group_key);
    if (!targetGroup) {
      targetGroup = groups.find((group) => group.steps.some((step) => (
        step.key === "personal" || step.handler_key === "personal_v1"
      )));
    }

    if (targetGroup) {
      const insertAt = targetGroup.steps.findIndex((step) => (
        Number(step.order) > Number(militaryStepTemplate.order)
      ));
      if (insertAt >= 0) targetGroup.steps.splice(insertAt, 0, placeholder);
      else targetGroup.steps.push(placeholder);
    } else {
      groups.push({
        key: militaryStepTemplate.group_key || "identity",
        title: militaryStepTemplate.group_title || "هویت و اطلاعات پایه",
        order: 0,
        steps: [placeholder],
      });
    }

    return groups.filter((group) => group.steps.length > 0);
  }, [workflowGroups, isFemaleApplicant, militaryStepTemplate]);

  const sidebarWorkflowSteps = useMemo(
    () => buildWorkflowSteps(sidebarWorkflowGroups),
    [sidebarWorkflowGroups]
  );
  const isDeclarationStep = handlerKey === "declaration_v1";
  const backendCurrentIndex = Math.max(0, workflowSteps.indexOf(resume?.current_step));
  const currentReturnReason = steps
    .filter((step) => step.step_key === resume?.current_step && step.status === "RETURNED")
    .sort((left, right) => right.attempt_no - left.attempt_no)[0]?.return_reason;

  const finalizedStatuses = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "COMPLETED"];
  const isFinalized = finalizedStatuses.includes(resume?.status);
  const canEditRequest = resume?.can_edit === true;
  const isEditingSubmittedRequest = resume?.status === "SUBMITTED" && canEditRequest;
  const isHistoricalStep = index < backendCurrentIndex;
  const readOnly = !canEditRequest || index > backendCurrentIndex;
  const readOnlyMessage = getEditBlockMessage(resume);
  const submittedEditMessage = resume?.edit_until_date
    ? "پرونده ثبت نهایی شده است؛ تا " + formatDate(resume.edit_until_date) + " امکان ویرایش اطلاعات وجود دارد."
    : "پرونده ثبت نهایی شده است؛ امکان ویرایش اطلاعات وجود دارد.";

  const clearValidationError = (fieldPath) => {
    setValidationErrors((current) => {
      const next = { ...current };
      Object.keys(next).forEach((key) => {
        if (key === fieldPath || key.startsWith(fieldPath + ".")) delete next[key];
      });
      return next;
    });
  };

  const applyValidationErrors = (errors) => {
    const next = {};
    (errors || []).forEach((item) => {
      const key = item.path || "";
      if (!next[key]) next[key] = item.message;
    });
    setValidationErrors(next);
    if (Object.keys(next).length > 0) {
      requestAnimationFrame(() => validationSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setWorkflowLoadError("");
      setHasSpouse(false);
      setShowMilitaryPlaceholder(false);
      setMilitarySkipped(false);
      setWorkflowTemplateGroups([]);
      setApplicantGender("");
      try {
        const [requestData, resumeData, stepsData, countriesData, workflowData, personalData] = await Promise.all([
          api.request(request.id),
          api.resume(request.id),
          api.steps(request.id),
          api.countries(),
          api.requestWorkflow(request.id),
          api.stepData(request.id, "personal").catch(() => null),
        ]);
        if (!Array.isArray(workflowData?.groups) || workflowData.groups.length === 0) {
          throw new Error("تعریف گردش‌کار این درخواست از سرور دریافت نشد؛ تنظیمات گردش‌کار را بررسی کنید.");
        }
        const savedGender = String(personalData?.person?.gender || "");
        let savedMilitarySkipped = false;
        try {
          savedMilitarySkipped = savedGender === "زن"
            && window.localStorage.getItem(militarySkipStorageKey(request.id)) === "true";
        } catch {
          // The workflow remains usable if browser storage is unavailable.
        }
        const initialWorkflowSteps = buildWorkflowSteps(
          filterWorkflowGroupsByGender(workflowData?.groups, savedGender)
        );
        setAppRequest(requestData);
        setResume(resumeData);
        setWorkflowDefinition(workflowData);
        setWorkflowTemplateGroups(workflowData.groups);
        setApplicantGender(savedGender);
        setMilitarySkipped(savedMilitarySkipped);
        setSteps(normalizeList(stepsData));
        setCountries(normalizeList(countriesData));
        const finalizedStatuses = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "COMPLETED"];
        const initialIndex = finalizedStatuses.includes(resumeData.status)
          ? 0
          : Math.max(0, initialWorkflowSteps.indexOf(resumeData.current_step));
        setIndex(initialIndex);
      } catch (error) {
        setWorkflowLoadError(error.message || "دریافت فرایند استخدام و گزینش از سرور انجام نشد.");
        onError({ type: "error", text: error.message || "دریافت فرایند استخدام و گزینش از سرور انجام نشد.", requestId: error.requestId });
      } finally {
        setBootstrapped(true);
        setLoading(false);
      }
    };
    bootstrap();
  }, [request.id]);

  useEffect(() => {
    if (showMilitaryPlaceholder) return undefined;
    if (!bootstrapped || !resume?.current_step || !appRequest || !currentKey) return;
    let cancelled = false;
    const load = async () => {
      setStepData(null);
      setForm(null);
      setDraftHydrated(false);
      setDraftStatus("idle");
      setLastDraftSaved(null);
      setValidationErrors({});
      try {
        if (isDocumentsStep) {
          const docs = await api.documents(appRequest.id);
          if (!cancelled) setDocuments(normalizeList(docs));
          return;
        }


        const needsSpouseCheck = !["personal_v1", "marriage_v1"].includes(handlerKey) && !isDocumentsStep;
        const loadResults = await Promise.allSettled([
          api.stepData(appRequest.id, currentKey),
          api.stepDraft(appRequest.id, currentKey),
          ...(needsSpouseCheck ? [api.stepData(appRequest.id, "marriage")] : []),
        ]);
        const [dataResult, draftResult, marriageResult] = loadResults;

        if (cancelled) return;

        if (needsSpouseCheck && marriageResult?.status === "fulfilled") {
          const marriages = Array.isArray(marriageResult.value?.marriages) ? marriageResult.value.marriages : [];
          setHasSpouse(marriages.some((marriage) => Boolean(marriage?.spouse?.id) && marriage.spouse.is_active !== false));
        } else {
          setHasSpouse(false);
        }

        const data = dataResult.status === "fulfilled" ? dataResult.value : null;
        if (dataResult.status === "rejected" && ![404, 409].includes(dataResult.reason?.status)) {
          onError({ type: "error", text: dataResult.reason.message, requestId: dataResult.reason.requestId });
        }

        const draft = draftResult.status === "fulfilled" ? draftResult.value : null;
        const merged = mergeDraft(makeForm(currentKey, data, user), draft?.data, currentKey);
        // The applicant national ID is an immutable account attribute; never trust a draft value.
        if (handlerKey === "personal_v1" && user?.national_id) {
          merged.national_id = String(user.national_id);
        }
        const normalizedForm = handlerKey === "military_v1" ? sanitizeMilitaryForm(merged) : handlerKey === "marriage_v1" ? sanitizeMarriageForm(merged) : merged;
        setStepData(data);
        setForm(normalizedForm);
        setLastDraftSaved(draft?.updated_at || null);
        setDraftHydrated(true);
        if (draft?.data) setDraftStatus("saved");
      } catch (error) {
        if (!cancelled) {
          onError({ type: "error", text: error.message, requestId: error.requestId });
          const fallbackForm = makeForm(currentKey, null, user);
          if (handlerKey === "personal_v1" && user?.national_id) {
            fallbackForm.national_id = String(user.national_id);
          }
          setForm(fallbackForm);
          setDraftHydrated(true);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [bootstrapped, resume?.current_step, appRequest, currentKey, user, isDocumentsStep, showMilitaryPlaceholder]);

  useEffect(() => {
    if (
      showMilitaryPlaceholder ||
      !appRequest ||
      !form ||
      !draftHydrated ||
      !resume?.current_step ||
      readOnly ||
      isDocumentsStep
    ) return undefined;

    const sequence = ++autosaveSequence.current;
    setDraftStatus("dirty");
    if (autosaveTimer.current !== null) clearTimeout(autosaveTimer.current);
    const timer = setTimeout(async () => {
      setDraftStatus("saving");
      const controller = new AbortController();
      autosaveController.current = controller;
      try {
        const payload = handlerKey === "military_v1" ? cleanMilitaryPayload(form) : handlerKey === "marriage_v1" ? cleanMarriagePayload(form) : handlerKey === "legal_incidents_v1" ? cleanLegalIncidentPayload(form) : cleanPayload(form);
        const result = await api.saveDraft(appRequest.id, currentKey, payload, controller.signal);
        if (sequence !== autosaveSequence.current) return;
        setLastDraftSaved(result.updated_at);
        setDraftStatus("saved");
      } catch (error) {
        if (sequence !== autosaveSequence.current) return;
        setDraftStatus("error");
        if (error.status === 409) {
          try {
            const liveResume = await api.resume(appRequest.id);
            if (sequence !== autosaveSequence.current) return;
            setResume(liveResume);
            if (liveResume.can_edit !== true) {
              onError({ type: "error", text: getEditBlockMessage(liveResume) });
            }
          } catch {
            // Keep the local draft error visible if availability cannot be refreshed.
          }
        }
      } finally {
        if (autosaveController.current === controller) autosaveController.current = null;
      }
    }, 1200);
    autosaveTimer.current = timer;

    return () => {
      clearTimeout(timer);
      if (autosaveTimer.current === timer) autosaveTimer.current = null;
      if (autosaveController.current !== null) {
        autosaveController.current.abort();
        autosaveController.current = null;
      }
    };
  }, [appRequest?.id, currentKey, form, draftHydrated, resume?.current_step, readOnly, isDocumentsStep, showMilitaryPlaceholder]);

  useEffect(() => {
    if (handlerKey !== "personal_v1" || !form?.gender) return;

    setApplicantGender(form.gender);
    if (form.gender !== "زن") {
      setMilitarySkipped(false);
      try {
        window.localStorage.removeItem(militarySkipStorageKey(appRequest?.id));
      } catch {
        // The form can still switch back to military without browser storage.
      }
    }
  }, [handlerKey, form?.gender, appRequest?.id]);

  const refreshWorkflow = async ({ preserveIndex = false } = {}) => {
    // The backend resume is authoritative for the active step.
    const resumeData = await api.resume(appRequest.id);
    setResume(resumeData);

    if (resumeData.status === "SUBMITTED") {
      onError({ type: "success", text: "پرونده با موفقیت ثبت نهایی شد." });
    }

    // A step may no longer apply after a saved answer (for example, military
    // service after gender is saved). Refresh the version-pinned definition as
    // well as request/history data so the rail and progress use the same route
    // that the backend will enforce.
    const [requestResult, stepsResult, workflowResult] = await Promise.allSettled([
      api.request(appRequest.id),
      api.steps(appRequest.id),
      api.requestWorkflow(appRequest.id),
    ]);

    const effectiveGender = handlerKey === "personal_v1" && form?.gender
      ? form.gender
      : applicantGender;
    let currentWorkflowGroups = filterWorkflowGroupsByGender(
      workflowDefinition?.groups,
      effectiveGender
    );
    if (
      workflowResult.status === "fulfilled" &&
      Array.isArray(workflowResult.value?.groups) &&
      workflowResult.value.groups.length > 0
    ) {
      setWorkflowDefinition(workflowResult.value);
      currentWorkflowGroups = filterWorkflowGroupsByGender(
        workflowResult.value.groups,
        effectiveGender
      );
    }

    const currentWorkflowSteps = buildWorkflowSteps(currentWorkflowGroups);
    const serverIndex = currentWorkflowSteps.indexOf(resumeData.current_step);
    if (serverIndex >= 0 && !preserveIndex) setIndex(serverIndex);

    // Non-essential dashboard/history refreshes must not block route navigation.
    if (requestResult.status === "fulfilled") setAppRequest(requestResult.value);
    if (stepsResult.status === "fulfilled") setSteps(normalizeList(stepsResult.value));
  };

  const complete = async () => {
    if (showMilitaryPlaceholder) {
      cancelPendingAutosave();
      setSaving(true);
      try {
        const liveResume = await api.resume(appRequest.id);
        setResume(liveResume);
        const nextIndex = workflowSteps.indexOf(liveResume.current_step);
        if (nextIndex < 0) {
          throw new Error("مرحله بعدی پرونده از سرور دریافت نشد؛ دوباره تلاش کنید.");
        }
        setIndex(nextIndex);
        setMilitarySkipped(true);
        try {
          window.localStorage.setItem(militarySkipStorageKey(appRequest.id), "true");
        } catch {
          // Keep the green check for the current session if storage is unavailable.
        }
        setShowMilitaryPlaceholder(false);
      } catch (error) {
        onError({
          type: "error",
          text: error.message || "عبور از مرحله غیرفعال انجام نشد.",
          requestId: error.requestId,
        });
      } finally {
        setSaving(false);
      }
      return;
    }

    if (readOnly) return;
    const localErrors = validateStep(currentKey, form || {});
    if (Object.keys(localErrors).length > 0) {
      setValidationErrors(localErrors);
      requestAnimationFrame(() => validationSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      onError({ type: "error", text: "برخی از فیلدهای فرم نیاز به اصلاح دارند." });
      return;
    }
    setValidationErrors({});
    if (handlerKey === "personal_v1" && form?.gender) {
      setApplicantGender(form.gender);
    }
    cancelPendingAutosave();
    setSaving(true);
    try {
      // Re-check the persisted backend state immediately before completion so a
      // stale UI can never submit a step that is no longer current.
      const liveResume = await api.resume(appRequest.id);
      const liveIndex = workflowSteps.indexOf(liveResume.current_step);
      const currentTargetIndex = workflowSteps.indexOf(currentKey);
      const editingHistorical = liveResume.status === "SUBMITTED" || currentTargetIndex < liveIndex;

      if (
        liveResume.can_edit !== true
        || currentTargetIndex > liveIndex
        || (currentTargetIndex !== liveIndex && !editingHistorical)
      ) {
        setResume(liveResume);
        if (liveIndex >= 0) setIndex(liveIndex);
        if (liveResume.can_edit !== true) {
          onError({ type: "error", text: getEditBlockMessage(liveResume) });
        }
        return;
      }

      let result;
      if (isDocumentsStep) {
        result = await api.completeGeneric(appRequest.id, currentKey);
      } else {
        const payload = handlerKey === "military_v1" ? cleanMilitaryPayload(form || {}) : handlerKey === "marriage_v1" ? cleanMarriagePayload(form || {}) : handlerKey === "legal_incidents_v1" ? cleanLegalIncidentPayload(form || {}) : cleanPayload(form || {});
        result = await api.completeStep(appRequest.id, currentKey, payload);
      }
      // Editing a previous step must preserve the server's workflow cursor.
      // After saving, move one step forward locally without submitting the request again.
      if (editingHistorical) {
        setDraftStatus("idle");
        setLastDraftSaved(null);

        // When personal data is edited far into the workflow, keep the manual
        // inactive-step acknowledgement in front of the applicant.
        if (handlerKey === "personal_v1" && form?.gender === "زن") {
          setShowMilitaryPlaceholder(true);
          await refreshWorkflow({ preserveIndex: true });
        } else if (handlerKey === "personal_v1") {
          setShowMilitaryPlaceholder(false);
          setMilitarySkipped(false);
          await refreshWorkflow();
        } else if (currentTargetIndex < liveIndex) {
          setIndex(Math.min(currentTargetIndex + 1, liveIndex));
        }

        onError({ type: "success", text: "تغییرات مرحله «" + stepTitle + "» با موفقیت ذخیره شد." });
        return;
      }

      // Final declaration closes an in-progress request and returns to the dashboard.
      if (isDeclarationStep && !result?.next_step) {
        onError({ type: "success", text: "پرونده با موفقیت ثبت نهایی شد." });
        onBack();
        return;
      }

      if (handlerKey === "personal_v1" && form?.gender === "زن") {
        // Show an explicit, non-editable military step instead of briefly
        // jumping to the backend cursor and immediately away from it.
        setShowMilitaryPlaceholder(true);
        await refreshWorkflow({ preserveIndex: true });
        return;
      }

      await refreshWorkflow();
    } catch (error) {
      if (error.validationErrors?.length) {
        applyValidationErrors(error.validationErrors);
        onError({
          type: "error",
          text: "سامانه چند مورد از اطلاعات واردشده را معتبر ندانست؛ جزئیات کنار فیلدها نمایش داده شده است.",
          requestId: error.requestId,
        });
      } else if (error.status === 401 || error.code === "INVALID_CREDENTIALS") {
        onError({
          type: "error",
          text: "اعتبار نشست شما برای ثبت این فرم تأیید نشد. لطفاً دوباره وارد سامانه شوید.",
          requestId: error.requestId,
        });
      } else {
        if (error.status === 409) {
          try {
            const liveResume = await api.resume(appRequest.id);
            setResume(liveResume);
            if (liveResume.can_edit !== true) {
              onError({
                type: "error",
                text: getEditBlockMessage(liveResume),
                requestId: error.requestId,
              });
              return;
            }
          } catch {
            // Preserve the original save error if the latest policy cannot be loaded.
          }
        }
        onError({ type: "error", text: error.message || "ثبت اطلاعات با خطا مواجه شد.", requestId: error.requestId });
      }
    } finally {
      setSaving(false);
    }
  };

  const movePrevious = () => {
    cancelPendingAutosave();
    setIndex((value) => Math.max(0, value - 1));
  };
  const moveTo = (target) => {
    if (target <= backendCurrentIndex) {
      cancelPendingAutosave();
      setIndex(target);
    }
  };

  if (workflowLoadError) {
    return (
      <main className="page wizard-page">
        <section className="workflow-load-error" dir="rtl" role="alert">
          <span className="workflow-load-error-icon" aria-hidden="true">!</span>
          <h1>تعریف فرایند در دسترس نیست</h1>
          <p>{workflowLoadError}</p>
          <button type="button" className="primary-button" onClick={onBack}>بازگشت به پرونده‌ها</button>
        </section>
      </main>
    );
  }

  if (loading) return <div className="page"><div className="wizard-loading"><div className="loading-spinner" /><strong>در حال بارگذاری پرونده…</strong></div></div>;

  const currentGroup = workflowGroups.find((group) => group.steps.some((step) => step.key === currentKey));
  const stepTitle = showMilitaryPlaceholder
    ? (militaryStepTemplate?.title || "وضعیت نظام وظیفه")
    : (currentStep?.title || currentKey || "");
  const stepDescription = showMilitaryPlaceholder
    ? "این مرحله برای متقاضیان خانم غیرفعال است. برای ادامه، دکمه «مرحله بعد» را بزنید؛ نیازی به ثبت اطلاعات نظام وظیفه نیست."
    : (currentStep?.description || STEP_DESCRIPTIONS[currentKey] || "اطلاعات این مرحله را تکمیل کنید و پس از بررسی، ثبت نمایید.");
  const groupTitle = showMilitaryPlaceholder
    ? (militaryStepTemplate?.group_title || "هویت و اطلاعات پایه")
    : (currentGroup?.title || "");
  const displayCurrentIndex = Math.max(0, sidebarWorkflowSteps.indexOf(
    showMilitaryPlaceholder ? "military" : resume?.current_step
  ));
  const completionCount = Math.min(workflowSteps.length, backendCurrentIndex + (resume?.status === "SUBMITTED" ? 0 : 0));
  const status = statusLabel(appRequest?.status);

  return (
    <main className="page wizard-page">
      <div className="wizard-toolbar">
        <button className="back-button" onClick={onBack}>→ <span>بازگشت به پرونده‌ها</span></button>
        <div className="request-report-toolbar">
          <div className="wizard-identity"><span>کد رهگیری</span><b>{appRequest.tracking_code}</b><i className="divider" /><span>{status[0]}</span></div>
        </div>
      </div>

      <div className={"wizard-layout" + (sidebarOpen ? "" : " is-sidebar-closed")}>
        <aside id="request-step-sidebar" className="wizard-sidebar" aria-hidden={!sidebarOpen} inert={!sidebarOpen}>
          <div className="wizard-progress-head">
            <div><span className="eyebrow">مسیر پرونده</span><strong>{displayCurrentIndex + 1} از {sidebarWorkflowSteps.length}</strong></div>
            <div className="progress-track"><span style={{ width: ((isFinalized ? 100 : (displayCurrentIndex / sidebarWorkflowSteps.length) * 100)) + "%" }} /></div>
          </div>
          <div className="step-sections">
            {sidebarWorkflowGroups.map((group) => (
              <div className="step-section" key={group.key}>
                <span className="step-section-title">{group.title}</span>
                {group.steps.map((step) => {
                  const inactivePlaceholder = Boolean(step.disabled_placeholder);
                  const routeTarget = workflowSteps.indexOf(step.key);
                  const displayTarget = sidebarWorkflowSteps.indexOf(step.key);
                  return (
                    <StepRailItem
                      key={step.key}
                      keyName={step.key}
                      title={step.title}
                      kicker={group.title}
                      disabledLabel={inactivePlaceholder ? (militarySkipped ? "رد شده" : "غیرفعال") : ""}
                      active={inactivePlaceholder ? showMilitaryPlaceholder : currentKey === step.key}
                      completed={inactivePlaceholder
                        ? militarySkipped
                        : (displayTarget < displayCurrentIndex || (isFinalized && displayTarget <= displayCurrentIndex))}
                      disabled={inactivePlaceholder}
                      onClick={() => {
                        if (!inactivePlaceholder) moveTo(routeTarget);
                      }}
                      order={inactivePlaceholder ? "—" : displayTarget + 1}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        <section className="wizard-content">
          <div className="step-header">
            <div>
              <span className="eyebrow">{groupTitle}</span>
              <h1>{stepTitle}</h1>
              <p className="step-description">{stepDescription}</p>
              {!readOnly && !isDocumentsStep && (
                <DraftStatus state={draftStatus} updatedAt={lastDraftSaved} />
              )}
            </div>
            <div className="step-number">{String(index + 1).padStart(2, "0")}</div>
          </div>

          {(isFinalized || !canEditRequest) && (
            <div className={"submitted-readonly-banner" + (resume?.edit_block_reason === "REQUEST_TYPE_INACTIVE" ? " is-inactive" : "")} role="status">
              <span className="submitted-readonly-icon" aria-hidden="true">{resume?.edit_block_reason === "REQUEST_TYPE_INACTIVE" ? "i" : (canEditRequest ? "✎" : "✓")}</span>
              <strong>{isEditingSubmittedRequest ? submittedEditMessage : readOnlyMessage}</strong>
            </div>
          )}

          {Object.keys(validationErrors).length > 0 && (
            <ValidationSummary errors={validationErrors} summaryRef={validationSummaryRef} />
          )}

          {resume?.status === "RETURNED" && backendCurrentIndex === index && (
            <div className="return-alert"><strong>این مرحله برای اصلاح برگشت داده شده است.</strong>{currentReturnReason && <span>علت بازگشت: {currentReturnReason}</span>}<span>پس از اصلاح اطلاعات، دکمه ثبت و ادامه را بزنید تا دوباره وارد فرآیند بررسی شود.</span></div>
          )}

          {showMilitaryPlaceholder ? (
            <div className="inline-info military-inactive-step" role="status">
              <strong>مرحله نظام وظیفه برای شما غیرفعال است.</strong>
              <span>اطلاعاتی در این مرحله لازم نیست ثبت کنید. با زدن «مرحله بعد» به ادامه فرم می‌روید.</span>
            </div>
          ) : isDocumentsStep ? (
            <DocumentsStep documents={documents} requestId={appRequest.id} onUploaded={(doc) => setDocuments((items) => [doc, ...items])} onError={onError} readOnly={readOnly} />
          ) : (
            <StepRenderer
              stepKey={currentKey}
              handlerKey={handlerKey}
              form={form}
              setForm={setForm}
              data={stepData}
              countries={countries}
              hasSpouse={hasSpouse}
              readOnly={readOnly}
              errors={validationErrors}
              clearValidationError={clearValidationError}
            />
          )}

          <div className="wizard-footer">
            <div className="footer-left">
              {index > 0 ? (
                <button className="ghost-button" onClick={movePrevious}>مرحله قبل</button>
              ) : null}
            </div>
            <div className="footer-right">
              {(!readOnly || showMilitaryPlaceholder) ? (
                <button className="primary-button" disabled={saving} onClick={complete}>
                  {saving ? <><span className="button-spinner" /> در حال ذخیره…</> : showMilitaryPlaceholder ? "مرحله بعد" : (
                    isEditingSubmittedRequest
                      ? (isHistoricalStep ? "ذخیره تغییرات و مرحله بعد" : "ذخیره تغییرات")
                      : (isHistoricalStep ? "ذخیره تغییرات و مرحله بعد" : (isDeclarationStep ? "تأیید و ثبت نهایی" : "ثبت مرحله و ادامه"))
                  )}
                  <span>←</span>
                </button>
              ) : (
                <span className="readonly-note">فقط مشاهده</span>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default RequestWizard;
