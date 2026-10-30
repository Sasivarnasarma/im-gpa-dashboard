import { useMemo } from 'react';
import { modules, gradeMap } from '../data/modules';
import {
  getActiveModules,
  computeGpaStats,
  computeTrendData,
  computeSemesterStats,
  isAtRiskGpa,
  sortModules,
} from '../lib/gpaEngine';
import { assessEligibility, assessClasses, resolveAwardTier } from '../lib/degreeAudit';
import { getGpaTier } from '../lib/gpaEngine';

const YEAR_NAMES = { 1: 'First Year', 2: 'Second Year', 3: 'Third Year', 4: 'Fourth Year' };

// Computes cumulative/per-year GPA stats, performance trends, and year view-models
export default function useGpaComputation(grades, pathway, specialization, moduleSemesters) {
  return useMemo(() => {
    const activeModules = getActiveModules(modules, pathway, specialization, moduleSemesters);
    const stats = computeGpaStats(activeModules, grades, gradeMap);
    const trendData = computeTrendData(activeModules, grades, gradeMap);
    const semesters = computeSemesterStats(activeModules, grades, gradeMap);
    const classes = assessClasses(activeModules, grades, gradeMap, stats.cgpa);

    const years = [1, 2, 3, 4].map((year) => {
      const yearModules = activeModules.filter((m) => m.y === year);
      const yStats = stats.yearStats[year];
      const gpa = yStats.credits > 0 ? yStats.points / yStats.credits : 0;
      const hasGrades = yStats.credits > 0;

      return {
        year,
        name: YEAR_NAMES[year],
        modules: yearModules,
        sem1: sortModules(yearModules.filter((m) => m.s === 1)),
        sem2: sortModules(yearModules.filter((m) => m.s === 2)),
        gpa,
        hasGrades,
        atRisk: isAtRiskGpa(gpa, hasGrades),
        hasOptional: yStats.optionalTotal > 0,
        gradedCredits: yStats.gradedCredits,
        compulsoryCredits: yStats.compulsoryTotal + yStats.optionalGraded,
        totalCredits: yStats.totalCredits,
      };
    });

    return {
      currentPathway: pathway || 'undecided',
      stats,
      trendData,
      semesters,
      years,
      eligibility: assessEligibility(activeModules, grades, gradeMap, stats.cgpa),
      classes,
      // Resolves actual honours award tier factoring in handbook constraints
      awardTier: resolveAwardTier(getGpaTier(stats.cgpa, stats.totalGpaCredits > 0), classes),
    };
  }, [grades, pathway, specialization, moduleSemesters]);
}
