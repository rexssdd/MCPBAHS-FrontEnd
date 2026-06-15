/**
 * useFacultyRpms.js
 * Custom hook that owns all async state for the RPMS feature.
 *
 * WHERE TO ADD:
 *   Import and call this hook inside RpmsModal.jsx:
 *     import { useFacultyRpms } from "../../hooks/useFacultyRpms";
 *
 * Returned shape:
 *   { rpms, status, apiWarning, schoolYear, quarter, setSchoolYear, setQuarter,
 *     SCHOOL_YEARS, QUARTERS, fetchReport, generateReport, reset }
 *
 * status:
 *   "idle"       — hook mounted, no request fired yet
 *   "loading"    — GET /rpms in-flight
 *   "generating" — POST /rpms/generate in-flight
 *   "success"    — data populated (may be demo if API unavailable)
 */

import { useState, useCallback } from "react";
import { getRpmsReport, generateRpmsReport } from "../services/Admin/FacultyAndStaff/rpmsService";

export const SCHOOL_YEARS = ["2024-2025", "2023-2024", "2022-2023", "2021-2022"];
export const QUARTERS     = ["Q1", "Q2", "Q3", "Q4", "Annual"];

function getAdjectivalRating(score) {
  if (score >= 4.5) return "Outstanding";
  if (score >= 3.5) return "Very Satisfactory";
  if (score >= 2.5) return "Satisfactory";
  if (score >= 1.5) return "Unsatisfactory";
  return "Poor";
}

function buildDemoRpms(facultyId, name, schoolYear, quarter) {
  const SCORES = [4.5, 4.2, 4.8, 4.6, 4.3, 4.4, 4.1, 4.5, 4.3, 4.2];
  const ratings = [
    "1.1 Content Knowledge and its Application within and across Curriculum Areas",
    "1.2 Research-Based Knowledge and Principles of Teaching and Learning",
    "2.1 Learner Safety and Security",
    "2.2 Fair Learning Environment",
    "3.1 Communication of Learning Goals, Directions and Instructions",
    "3.2 Learner Participation, Engagement and Motivation",
    "4.1 Planning and Management of Teaching and Learning Process",
    "4.2 Learning Outcomes Aligned with Learning Competencies",
    "5.1 Design, Selection and Use of Assessment Strategies",
    "5.2 Monitoring and Evaluation of Learner Progress and Achievement",
  ].map((indicator, i) => ({ indicator, score: SCORES[i] }));

  const finalRating = parseFloat(
    (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(2)
  );

  return {
    facultyId,
    name: name || "Faculty Member",
    schoolYear,
    quarter,
    ratings,
    finalRating,
    adjectivalRating: getAdjectivalRating(finalRating),
    remarks:
      "Consistently performs above expectations. Strong classroom management and learner engagement. Recommended for the school's performance incentive program.",
    generatedAt: new Date().toISOString(),
    isDemo: true,
  };
}

export function useFacultyRpms(facultyId, facultyName) {
  const [rpms,       setRpms]       = useState(null);
  const [status,     setStatus]     = useState("idle");
  const [apiWarning, setApiWarning] = useState(null);
  const [schoolYear, setSchoolYear] = useState(SCHOOL_YEARS[0]);
  const [quarter,    setQuarter]    = useState(QUARTERS[2]);

  const fetchReport = useCallback(async (syOverride, qOverride) => {
    if (!facultyId) return;
    const sy = syOverride ?? schoolYear;
    const q  = qOverride  ?? quarter;
    setStatus("loading");
    setApiWarning(null);

    const result = await getRpmsReport(facultyId, { schoolYear: sy, quarter: q });
    if (result.ok && result.data) {
      setRpms({
        ...result.data,
        adjectivalRating: result.data.adjectivalRating ?? getAdjectivalRating(result.data.finalRating ?? 0),
      });
      setStatus("success");
    } else {
      console.warn("[useFacultyRpms] fetchReport unavailable:", result.error);
      setRpms(buildDemoRpms(facultyId, facultyName, sy, q));
      setStatus("success");
      setApiWarning("Demo data shown — backend RPMS endpoint not yet available.");
    }
  }, [facultyId, facultyName, schoolYear, quarter]);

  const generateReport = useCallback(async () => {
    if (!facultyId) return;
    setStatus("generating");
    setApiWarning(null);

    const result = await generateRpmsReport(facultyId, { schoolYear, quarter });
    if (result.ok && result.data) {
      setRpms({
        ...result.data,
        adjectivalRating: result.data.adjectivalRating ?? getAdjectivalRating(result.data.finalRating ?? 0),
      });
      setStatus("success");
    } else {
      console.warn("[useFacultyRpms] generateReport unavailable:", result.error);
      setRpms(buildDemoRpms(facultyId, facultyName, schoolYear, quarter));
      setStatus("success");
      setApiWarning("Demo data shown — backend RPMS endpoint not yet available.");
    }
  }, [facultyId, facultyName, schoolYear, quarter]);

  const reset = useCallback(() => {
    setRpms(null);
    setStatus("idle");
    setApiWarning(null);
  }, []);

  return {
    rpms, status, apiWarning,
    schoolYear, quarter, setSchoolYear, setQuarter,
    SCHOOL_YEARS, QUARTERS,
    fetchReport, generateReport, reset,
  };
}
