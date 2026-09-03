import { useMemo } from 'react';
import { modules, gradeMap } from '../data/modules';
import { getActiveModules, computeGpaStats, computeTrendData, isAtRiskGpa } from '../lib/gpaEngine';
import { assessEligibility, assessClasses, resolveAwardTier } from '../lib/degreeAudit';
import { getGpaTier } from '../lib/gpaEngine';

// Presentation order inside a semester list: common compulsory first, then
// pathway-specific, then non-GPA, then optional.
const sortModules = (moduleList) => {
  return [...moduleList].sort((a, b) => {
    const getWeight = (m) => {
      if (m.optional) return 4;
      if (m.nonGpa) return 3;
      if (!m.pathway || m.pathway === 'both') return 1; // common
      return 2; // specific (it or mit)
    };
    return getWeight(a) - getWeight(b);
  });
};

const YEAR_NAMES = { 1: 'First Year', 2: 'Second Year', 3: 'Third Year' };

// Rolls the curriculum and the entered grades into every derived figure the
// dashboard renders: the cumulative/per-year GPA stats behind the navbar and
// Executive Summary, the trend series behind the chart, and one view-model
// object per year (sorted semester lists + badge figures) for the curriculum
// column.
export default function useGpaComputation(grades, pathway, specialization) {
  return useMemo(() => {
    const activeModules = getActiveModules(modules, pathway, specialization);
    const stats = computeGpaStats(activeModules, grades, gradeMap);
    const trendData = computeTrendData(activeModules, grades, gradeMap);
    const classes = assessClasses(activeModules, grades, gradeMap, stats.cgpa);

    const years = [1, 2, 3].map((year) => {
      const yearModules = activeModules.filter((m) => m.y === year);
      const yStats = stats.yearStats[year];
      const gpa = year === 1 ? stats.y1GPA : year === 2 ? stats.y2GPA : stats.y3GPA;
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
      years,
      eligibility: assessEligibility(activeModules, grades, gradeMap, stats.cgpa),
      classes,
      // The class actually on offer, not the one the GPA alone would suggest.
      awardTier: resolveAwardTier(getGpaTier(stats.cgpa, stats.totalGpaCredits > 0), classes),
    };
  }, [grades, pathway, specialization]);
}
