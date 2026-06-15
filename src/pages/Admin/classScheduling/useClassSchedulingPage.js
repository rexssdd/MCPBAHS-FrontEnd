import { useState, useEffect, useCallback, useRef } from "react";
import * as schedulingService from "../../../services/Admin/ClassScheduling/schedulingService";
import {
  validateSections,
  validateSchedules,
  sanitizeSection,
  sanitizeSchedule,
  schedulesConflict,
  isDuplicateSection,
} from "../../../utils/schedulingValidation";
import { DEFAULT_SECTIONS, DEFAULT_SCHEDULES } from "./adminClassSchedulingConstants.js";

/**
 * State and mutations for the admin Class Scheduling page.
 * Keeps `ClassSchedulingPage.jsx` focused on layout and routing between views.
 */
export function useClassSchedulingPage() {
  const [mainTab, setMainTab] = useState("Sections");
  const [view, setView] = useState("list");
  const [activeSection, setActiveSection] = useState(null);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [schedules, setSchedules] = useState(DEFAULT_SCHEDULES);

  const [sectionStatus, setSectionStatus] = useState(null);
  const [scheduleStatus, setScheduleStatus] = useState(null);
  const [sectionLoading, setSectionLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [sectionError, setSectionError] = useState("");
  const [scheduleError, setScheduleError] = useState("");

  const showToast = (m) => setToast(m);
  const goList = () => {
    setView("list");
    setActiveSection(null);
    setActiveSchedule(null);
  };

  const fetchRemoteArray = useCallback(async (config) => {
    const { logLabel, fetcher, validate, fallback, setRows, setStatus, setErr, setLoading } = config;
    setStatus("fetching");
    setLoading(true);
    setErr("");
    try {
      const { data, ok, error } = await fetcher();
      if (!isMountedRef.current) return;
      if (ok && Array.isArray(data)) {
        // Empty array is a valid response (no data) — not an error
        setRows(validate(data, fallback));
        setStatus("success");
      } else {
        throw new Error(error || "Failed to fetch data");
      }
    } catch (err) {
      console.error(logLabel, err);
      if (!isMountedRef.current) return;
      setErr(err.message || "Failed to fetch");
      setRows(fallback);
      setStatus("error");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  const fetchSections = useCallback(
    () =>
      fetchRemoteArray({
        logLabel: "[ClassScheduling] Fetch sections failed:",
        fetcher: () => schedulingService.listSections(),
        validate: validateSections,
        fallback: DEFAULT_SECTIONS,
        setRows: setSections,
        setStatus: setSectionStatus,
        setErr: setSectionError,
        setLoading: setSectionLoading,
      }),
    [fetchRemoteArray],
  );

  const fetchSchedules = useCallback(
    () =>
      fetchRemoteArray({
        logLabel: "[ClassScheduling] Fetch schedules failed:",
        fetcher: () => schedulingService.listSchedules(),
        validate: validateSchedules,
        fallback: DEFAULT_SCHEDULES,
        setRows: setSchedules,
        setStatus: setScheduleStatus,
        setErr: setScheduleError,
        setLoading: setScheduleLoading,
      }),
    [fetchRemoteArray],
  );

  useEffect(() => {
    fetchSections();
    fetchSchedules();
  }, [fetchSections, fetchSchedules]);

  const addSection = async (form) => {
    const sanitized = sanitizeSection(form);
    if (
      isDuplicateSection(sections, {
        sectionName: sanitized.sectionName,
        gradeLevel: sanitized.gradeLevel,
      })
    ) {
      showToast("A section with this name already exists for this grade level.");
      return;
    }
    try {
      const { data, ok, error } = await schedulingService.createSection(sanitized);
      if (!isMountedRef.current) return;

      if (ok && data && validateSections([data]).length > 0) {
        setSections((p) => [...p, data]);
        showToast("Section successfully added");
      } else if (ok) {
        setSections((p) => [...p, sanitized]);
        showToast("Section added");
      } else {
        throw new Error(error || "Failed to create section");
      }
    } catch (err) {
      console.error("[ClassScheduling] Add section failed:", err);
      if (!isMountedRef.current) return;
      setSections((p) => [...p, { id: `sec-${Date.now()}`, ...form, students: 0 }]);
      showToast("Section added (offline mode)");
    }
    goList();
  };

  const editSection = async (orig, form) => {
    const sanitized = sanitizeSection({ ...orig, ...form });
    if (
      isDuplicateSection(sections, {
        sectionName: sanitized.sectionName,
        gradeLevel: sanitized.gradeLevel,
        excludeId: orig.id,
      })
    ) {
      showToast("A section with this name already exists for this grade level.");
      return;
    }
    try {
      const { data, ok, error } = await schedulingService.updateSection(orig.id, sanitized);
      if (!isMountedRef.current) return;

      if (ok && data && validateSections([data]).length > 0) {
        setSections((p) => p.map((s) => (s.id === orig.id ? data : s)));
        showToast("Section successfully updated");
      } else if (ok) {
        setSections((p) => p.map((s) => (s.id === orig.id ? sanitized : s)));
        showToast("Section updated");
      } else {
        throw new Error(error || "Failed to update section");
      }
    } catch (err) {
      console.error("[ClassScheduling] Edit section failed:", err);
      if (!isMountedRef.current) return;
      setSections((p) => p.map((s) => (s.id === orig.id ? { ...s, ...form } : s)));
      showToast("Section updated (offline mode)");
    }
    goList();
  };

  const delSection = (item, silent = false) => {
    if (!silent) {
      setDelTarget({ type: "section", item });
      return;
    }
    setSections((p) => p.filter((s) => s.id !== item.id));
  };

  const handleArchiveSection = async (item) => {
    const previousSections = sections;
    setSections((p) => p.filter((s) => s.id !== item.id));
    showToast("Section archived");

    try {
      const { ok, error } = await schedulingService.archiveSection(item.id);
      if (!isMountedRef.current) return;
      if (!ok) {
        setSections(previousSections);
        showToast(`Archive failed: ${error || "API error"}`);
      }
    } catch (err) {
      console.error("[ClassScheduling] Archive section failed:", err);
      if (!isMountedRef.current) return;
      setSections(previousSections);
      showToast("Archive failed — please try again");
    }
  };

  const addSchedule = async (form) => {
    const sanitized = sanitizeSchedule(form);
    if (schedulesConflict(schedules, sanitized)) {
      showToast("Conflict detected; schedule is not saved.");
      return;
    }
    try {
      const { data, ok, error } = await schedulingService.createSchedule(sanitized);
      if (!isMountedRef.current) return;

      if (ok && data && validateSchedules([data]).length > 0) {
        setSchedules((p) => [...p, data]);
        showToast("Class schedule successfully added");
      } else if (ok) {
        setSchedules((p) => [...p, sanitized]);
        showToast("Schedule added");
      } else {
        throw new Error(error || "Failed to create schedule");
      }
    } catch (err) {
      console.error("[ClassScheduling] Add schedule failed:", err);
      if (!isMountedRef.current) return;
      const fallback = { id: `sch-${Date.now()}`, ...form };
      if (schedulesConflict(schedules, fallback)) {
        showToast("Conflict detected; schedule is not saved.");
        return;
      }
      setSchedules((p) => [...p, fallback]);
      showToast("Schedule added (offline mode)");
    }
    goList();
  };

  const editSchedule = async (orig, form) => {
    const sanitized = sanitizeSchedule({ ...orig, ...form });
    if (schedulesConflict(schedules, { ...sanitized, id: orig.id }, { excludeId: orig.id })) {
      showToast("Conflict detected; schedule is not saved.");
      return;
    }
    try {
      const { data, ok, error } = await schedulingService.updateSchedule(orig.id, sanitized);
      if (!isMountedRef.current) return;

      if (ok && data && validateSchedules([data]).length > 0) {
        setSchedules((p) => p.map((s) => (s.id === orig.id ? data : s)));
        showToast("Schedule successfully updated");
      } else if (ok) {
        setSchedules((p) => p.map((s) => (s.id === orig.id ? sanitized : s)));
        showToast("Schedule updated");
      } else {
        throw new Error(error || "Failed to update schedule");
      }
    } catch (err) {
      console.error("[ClassScheduling] Edit schedule failed:", err);
      if (!isMountedRef.current) return;
      const merged = { ...orig, ...form };
      if (schedulesConflict(schedules, merged, { excludeId: orig.id })) {
        showToast("Conflict detected; schedule is not saved.");
        return;
      }
      setSchedules((p) => p.map((s) => (s.id === orig.id ? merged : s)));
      showToast("Schedule updated (offline mode)");
    }
    goList();
  };

  const delSchedule = (item, silent = false) => {
    if (!silent) {
      setDelTarget({ type: "schedule", item });
      return;
    }
    setSchedules((p) => p.filter((s) => s.id !== item.id));
  };

  const handleArchiveSchedule = async (item) => {
    const previousSchedules = schedules;
    setSchedules((p) => p.filter((s) => s.id !== item.id));
    showToast("Schedule archived");

    try {
      const { ok, error } = await schedulingService.archiveSchedule(item.id);
      if (!isMountedRef.current) return;
      if (!ok) {
        setSchedules(previousSchedules);
        showToast(`Archive failed: ${error || "API error"}`);
      }
    } catch (err) {
      console.error("[ClassScheduling] Archive schedule failed:", err);
      if (!isMountedRef.current) return;
      setSchedules(previousSchedules);
      showToast("Archive failed — please try again");
    }
  };

  const confirmDel = async () => {
    if (!delTarget) return;
    setDelLoading(true);

    const isSection = delTarget.type === "section";
    const previousSections = sections;
    const previousSchedules = schedules;

    try {
      const { ok, error } = isSection
        ? await schedulingService.deleteSection(delTarget.item.id)
        : await schedulingService.deleteSchedule(delTarget.item.id);

      if (!isMountedRef.current) return;

      if (isSection) {
        setSections((p) => p.filter((s) => s.id !== delTarget.item.id));
        showToast(ok ? "Section deleted" : "Deleted (offline mode)");
      } else {
        setSchedules((p) => p.filter((s) => s.id !== delTarget.item.id));
        showToast(ok ? "Schedule deleted" : "Deleted (offline mode)");
      }

      if (!ok) {
        console.warn(`[ClassScheduling] Delete failed:`, error);
      }
    } catch (err) {
      console.error("[ClassScheduling] Delete failed:", err);
      if (!isMountedRef.current) return;
      setSections(previousSections);
      setSchedules(previousSchedules);
      showToast("Delete failed — please try again");
    } finally {
      if (isMountedRef.current) {
        setDelLoading(false);
        setDelTarget(null);
      }
    }
  };

  return {
    mainTab,
    setMainTab,
    view,
    setView,
    activeSection,
    setActiveSection,
    activeSchedule,
    setActiveSchedule,
    delTarget,
    setDelTarget,
    delLoading,
    toast,
    setToast,
    sections,
    schedules,
    sectionStatus,
    scheduleStatus,
    sectionLoading,
    scheduleLoading,
    sectionError,
    scheduleError,
    fetchSections,
    fetchSchedules,
    goList,
    addSection,
    editSection,
    delSection,
    handleArchiveSection,
    addSchedule,
    editSchedule,
    delSchedule,
    handleArchiveSchedule,
    confirmDel,
  };
}
