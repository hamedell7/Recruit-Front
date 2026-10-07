import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../services/api";
import { STEP_META, STEP_DESCRIPTIONS, FLOW_SECTIONS } from "../../config/workflow";
import { statusLabel } from "../../utils/status";
import { normalizeList } from "../../utils/collections";
import { cleanMarriagePayload, cleanMilitaryPayload, cleanPayload, makeForm, mergeDraft, sanitizeMarriageForm, sanitizeMilitaryForm, validateStep } from "../../utils/form";
import ValidationSummary from "../../components/form/ValidationSummary";
import DraftStatus from "../../components/form/DraftStatus";
import DocumentsStep from "./steps/DocumentsStep";
import ReviewStep from "./steps/ReviewStep";
import StepRail from "./StepRail";
import StepRailItem from "./StepRailItem";
import StepRenderer from "./StepRenderer";

function RequestWizard({ user, request, onBack, onError }) {
  const [appRequest, setAppRequest] = useState(request);
  const [steps, setSteps] = useState([]);
  const [resume, setResume] = useState(null);
  const [index, setIndex] = useState(0);
  const [stepData, setStepData] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState(null);
  const [draftStatus, setDraftStatus] = useState("idle");
  const [lastDraftSaved, setLastDraftSaved] = useState(null);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const validationSummaryRef = useRef(null);
  const autosaveSequence = useRef(0);

  const workflowSteps = useMemo(() => {
    if (appRequest?.workflow_key === "employment") {
      return ["personal", "education", "employment", "documents", "review", "declaration"];
    }
    return FLOW_SECTIONS.flatMap(([, items]) => items);
  }, [appRequest]);

  const currentKey = workflowSteps[index] || workflowSteps[0];
  const backendCurrentIndex = Math.max(0, workflowSteps.indexOf(resume?.current_step));
  const readOnly = resume?.status === "SUBMITTED" || resume?.status === "APPROVED" || resume?.status === "REJECTED" || index < backendCurrentIndex;

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
      try {
        const [requestData, resumeData, stepsData, countriesData] = await Promise.all([
          api.request(request.id),
          api.resume(request.id),
          api.steps(request.id),
          api.countries(),
        ]);
        setAppRequest(requestData);
        setResume(resumeData);
        setSteps(normalizeList(stepsData));
        setCountries(normalizeList(countriesData));
        const initialIndex = Math.max(0, workflowSteps.indexOf(resumeData.current_step));
        setIndex(initialIndex);
      } catch (error) {
        onError({ type: "error", text: error.message, requestId: error.requestId });
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [request.id]);

  useEffect(() => {
    if (!appRequest || !currentKey) return;
    let cancelled = false;
    const load = async () => {
      setStepData(null);
      setForm(null);
      setDraftHydrated(false);
      setDraftStatus("idle");
      setLastDraftSaved(null);
      setValidationErrors({});
      try {
        if (currentKey === "documents") {
          const docs = await api.documents(appRequest.id);
          if (!cancelled) setDocuments(normalizeList(docs));
          return;
        }
        if (currentKey === "review") return;

        const [dataResult, draftResult] = await Promise.allSettled([
          api.stepData(appRequest.id, currentKey),
          api.stepDraft(appRequest.id, currentKey),
        ]);

        if (cancelled) return;

        const data = dataResult.status === "fulfilled" ? dataResult.value : null;
        if (dataResult.status === "rejected" && ![404, 409].includes(dataResult.reason?.status)) {
          onError({ type: "error", text: dataResult.reason.message, requestId: dataResult.reason.requestId });
        }

        const draft = draftResult.status === "fulfilled" ? draftResult.value : null;
        const merged = mergeDraft(makeForm(currentKey, data, user), draft?.data);
        const normalizedForm = currentKey === "military" ? sanitizeMilitaryForm(merged) : currentKey === "marriage" ? sanitizeMarriageForm(merged) : merged;
        setStepData(data);
        setForm(normalizedForm);
        setLastDraftSaved(draft?.updated_at || null);
        setDraftHydrated(true);
        if (draft?.data) setDraftStatus("saved");
      } catch (error) {
        if (!cancelled) {
          onError({ type: "error", text: error.message, requestId: error.requestId });
          setForm(makeForm(currentKey, null, user));
          setDraftHydrated(true);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [appRequest, currentKey, user]);

  useEffect(() => {
    if (
      !appRequest ||
      !form ||
      !draftHydrated ||
      readOnly ||
      currentKey === "documents" ||
      currentKey === "review"
    ) return undefined;

    const sequence = ++autosaveSequence.current;
    setDraftStatus("dirty");
    const timer = setTimeout(async () => {
      setDraftStatus("saving");
      try {
        const payload = currentKey === "military" ? cleanMilitaryPayload(form) : currentKey === "marriage" ? cleanMarriagePayload(form) : cleanPayload(form);
        const result = await api.saveDraft(appRequest.id, currentKey, payload);
        if (sequence !== autosaveSequence.current) return;
        setLastDraftSaved(result.updated_at);
        setDraftStatus("saved");
      } catch {
        if (sequence === autosaveSequence.current) setDraftStatus("error");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [appRequest?.id, currentKey, form, draftHydrated, readOnly]);

  const refreshWorkflow = async (nextIndexOverride) => {
    const [requestData, resumeData, stepsData] = await Promise.all([
      api.request(appRequest.id),
      api.resume(appRequest.id),
      api.steps(appRequest.id),
    ]);
    setAppRequest(requestData);
    setResume(resumeData);
    setSteps(normalizeList(stepsData));
    const target = nextIndexOverride ?? workflowSteps.indexOf(resumeData.current_step);
    setIndex(Math.max(0, target));
    if (resumeData.status === "SUBMITTED") {
      onError({ type: "success", text: "پرونده با موفقیت ثبت نهایی شد." });
    }
  };

  const complete = async () => {
    if (readOnly) return;
    const localErrors = validateStep(currentKey, form || {});
    if (Object.keys(localErrors).length > 0) {
      setValidationErrors(localErrors);
      requestAnimationFrame(() => validationSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      onError({ type: "error", text: "برخی از فیلدهای فرم نیاز به اصلاح دارند." });
      return;
    }
    setValidationErrors({});
    setSaving(true);
    try {
      let result;
      if (currentKey === "documents" || currentKey === "review") {
        result = await api.completeGeneric(appRequest.id, currentKey);
      } else {
        const payload = currentKey === "military" ? cleanMilitaryPayload(form || {}) : currentKey === "marriage" ? cleanMarriagePayload(form || {}) : cleanPayload(form || {});
        result = await api.completeStep(appRequest.id, currentKey, payload);
      }
      if (currentKey !== "documents" && currentKey !== "review") {
        try { await api.deleteDraft(appRequest.id, currentKey); } catch {}
      }
      await refreshWorkflow(result.next_step ? workflowSteps.indexOf(result.next_step) : workflowSteps.length - 1);
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
        onError({ type: "error", text: error.message || "ثبت اطلاعات با خطا مواجه شد.", requestId: error.requestId });
      }
    } finally {
      setSaving(false);
    }
  };

  const movePrevious = () => setIndex((value) => Math.max(0, value - 1));
  const moveTo = (target) => {
    if (target <= backendCurrentIndex) setIndex(target);
  };

  if (loading) return <div className="page"><div className="wizard-loading"><div className="loading-spinner" /><strong>در حال بارگذاری پرونده…</strong></div></div>;

  const meta = STEP_META[currentKey] || { title: currentKey, kicker: "" };
  const completionCount = Math.min(workflowSteps.length, backendCurrentIndex + (resume?.status === "SUBMITTED" ? 0 : 0));
  const status = statusLabel(appRequest?.status);

  return (
    <main className="page wizard-page">
      <div className="wizard-toolbar">
        <button className="back-button" onClick={onBack}>→ <span>بازگشت به پرونده‌ها</span></button>
        <div className="wizard-identity"><span>کد رهگیری</span><b>{appRequest.tracking_code}</b><i className="divider" /><span>{status[0]}</span></div>
      </div>

      <div className="wizard-layout">
        <aside className="wizard-sidebar">
          <div className="wizard-progress-head">
            <div><span className="eyebrow">مسیر پرونده</span><strong>{backendCurrentIndex + 1} از {workflowSteps.length}</strong></div>
            <div className="progress-track"><span style={{ width: ((resume?.status === "SUBMITTED" ? 100 : (backendCurrentIndex / workflowSteps.length) * 100)) + "%" }} /></div>
          </div>
          <div className="step-sections">
            {appRequest.workflow_key === "employment" ? (
              <StepRail items={workflowSteps} currentKey={currentKey} backendCurrentIndex={backendCurrentIndex} onMove={moveTo} />
            ) : FLOW_SECTIONS.map(([heading, items]) => (
              <div className="step-section" key={heading}>
                <span className="step-section-title">{heading}</span>
                {items.map((key) => {
                  const target = workflowSteps.indexOf(key);
                  return <StepRailItem key={key} keyName={key} active={currentKey === key} completed={target < backendCurrentIndex || resume?.status === "SUBMITTED"} onClick={() => moveTo(target)} order={target + 1} />;
                })}
              </div>
            ))}
          </div>
          <div className="privacy-card"><span>✓</span><div><strong>حفاظت از اطلاعات</strong><small>این صفحه اطلاعات پرونده را از طریق نشست امن و بدون ذخیره توکن در مرورگر مصرف می‌کند.</small></div></div>
        </aside>

        <section className="wizard-content">
          <div className="step-header">
            <div>
              <span className="eyebrow">{meta.kicker}</span>
              <h1>{meta.title}</h1>
              <p>{STEP_DESCRIPTIONS[currentKey] || "اطلاعات این مرحله را با دقت تکمیل کنید."}</p>
              {!readOnly && !["documents", "review"].includes(currentKey) && (
                <DraftStatus state={draftStatus} updatedAt={lastDraftSaved} />
              )}
            </div>
            <div className="step-number">{String(index + 1).padStart(2, "0")}</div>
          </div>

          {Object.keys(validationErrors).length > 0 && (
            <ValidationSummary errors={validationErrors} summaryRef={validationSummaryRef} />
          )}

          {resume?.status === "RETURNED" && backendCurrentIndex === index && (
            <div className="return-alert"><strong>این مرحله برای اصلاح برگشت داده شده است.</strong><span>پس از اصلاح اطلاعات، دکمه ثبت و ادامه را بزنید تا دوباره وارد فرآیند بررسی شود.</span></div>
          )}

          {currentKey === "documents" ? (
            <DocumentsStep documents={documents} requestId={appRequest.id} onUploaded={(doc) => setDocuments((items) => [doc, ...items])} onError={onError} readOnly={readOnly} />
          ) : currentKey === "review" ? (
            <ReviewStep workflowSteps={workflowSteps} steps={steps} currentIndex={backendCurrentIndex} request={appRequest} />
          ) : (
            <StepRenderer
              stepKey={currentKey}
              form={form}
              setForm={setForm}
              data={stepData}
              countries={countries}
              readOnly={readOnly}
              errors={validationErrors}
              clearValidationError={clearValidationError}
            />
          )}

          <div className="wizard-footer">
            <div className="footer-left">
              {index > 0 && <button className="ghost-button" onClick={movePrevious}>مرحله قبل</button>}
            </div>
            <div className="footer-right">
              {readOnly ? (
                <button className="outline-button" onClick={() => setIndex(backendCurrentIndex)}>برگشت به مرحله جاری</button>
              ) : (
                <button className="primary-button" disabled={saving} onClick={complete}>
                  {saving ? <><span className="button-spinner" /> در حال ثبت…</> : (currentKey === "declaration" ? "تأیید و ثبت نهایی" : "ثبت مرحله و ادامه")}
                  <span>←</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default RequestWizard;
