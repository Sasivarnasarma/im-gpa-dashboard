// Pure calculation for required average GPA behind the Target GPA Planner.
export function computeTargetPlan({
  totalGpaCredits,
  totalWeightedPoints,
  ungradedGpaCredits,
  curriculumTotalGpaCredits,
  targetGPA,
}) {
  const currentCGPA = totalGpaCredits > 0 ? totalWeightedPoints / totalGpaCredits : 0;
  const numTarget = parseFloat(targetGPA) || 0;

  const totalPointsNeeded = numTarget * curriculumTotalGpaCredits;
  const pointsNeeded = totalPointsNeeded - totalWeightedPoints;

  let avgGpaNeeded = 0;
  let status = 'possible'; // 'possible' | 'impossible-high' | 'already-achieved'

  if (ungradedGpaCredits > 0) {
    avgGpaNeeded = pointsNeeded / ungradedGpaCredits;
    if (avgGpaNeeded > 4.0) {
      status = 'impossible-high';
    } else if (avgGpaNeeded < 0) {
      status = 'already-achieved';
      avgGpaNeeded = 0;
    }
  } else if (currentCGPA >= numTarget) {
    status = 'already-achieved';
  } else {
    status = 'impossible-high';
  }

  return { currentCGPA, numTarget, avgGpaNeeded, status };
}
