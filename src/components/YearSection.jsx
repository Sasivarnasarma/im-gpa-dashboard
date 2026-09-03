import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import SemesterCard from './SemesterCard';
import { getGradeBorderClass } from '../lib/gpaEngine';

// One year of the right-hand curriculum column: the header badges and the
// two semester cards — or, while the pathway/specialization is still
// undecided, the empty state that bootstraps that choice inline. The `year`
// view-model (sorted semester lists, badge figures, at-risk flags) is
// precomputed by useGpaComputation.
export default function YearSection({
  year,
  grades,
  onGradeChange,
  currentPathway,
  specialization,
  onSelectPathway,
  onSelectSpecialization,
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Year Header with Stats Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-2 font-bmw-display select-none">
        <h2 className="font-black text-lg text-white uppercase tracking-tight">{year.name}</h2>

        {/* GPA & Credits badges */}
        <div className="flex items-center gap-3 text-[10px] font-mono font-bold tracking-wider text-muted-text flex-nowrap">
          <div className="px-2.5 py-1 bg-surface-soft border border-hairline uppercase flex items-center gap-1.5 shrink-0">
            GPA:{' '}
            {year.atRisk && (
              <AlertTriangle className="w-3 h-3 text-m-red shrink-0" aria-hidden="true" />
            )}
            <span className={`font-black ${year.atRisk ? 'text-m-red' : 'text-white'}`}>
              {year.hasGrades ? year.gpa.toFixed(2) : 'AWAITING'}
            </span>
            {year.atRisk && <span className="sr-only">— below the 2.00 pass threshold</span>}
          </div>
          <div className="px-2.5 py-1 bg-surface-soft border border-hairline uppercase shrink-0">
            COMPLETED: <span className="text-white font-black">{year.gradedCredits}</span> /{' '}
            {year.hasOptional ? (
              <>
                <span className="text-white font-black">{year.compulsoryCredits}</span>{' '}
                <span className="text-muted-text font-normal">({year.totalCredits})</span>
              </>
            ) : (
              <span className="text-white font-black">{year.compulsoryCredits}</span>
            )}{' '}
            CREDITS
          </div>
        </div>
      </div>

      {/* Curriculums */}
      {year.modules.length === 0 ? (
        currentPathway === 'undecided' ? (
          year.year === 2 ? (
            <div className="border border-hairline bg-surface-soft p-8 text-center flex flex-col items-center gap-4 select-none">
              <Info className="w-8 h-8 text-m-blue-light" />
              <h3 className="font-bmw-display font-bold text-sm text-white uppercase tracking-wider">
                DEGREE PROGRAMME NOT SELECTED
              </h3>
              <p className="text-[11px] text-muted-text max-w-md leading-relaxed">
                Please select your B.Sc. (Hons) degree programme to load the corresponding Year 2
                and Year 3 course curricula.
              </p>
              <div className="flex gap-4 mt-2 justify-center font-mono">
                <button
                  onClick={() => onSelectPathway('it')}
                  className="px-5 py-2.5 border border-hairline hover:border-m-red text-white text-[10px] font-bold uppercase transition-colors cursor-pointer bg-surface-card"
                >
                  B.Sc. (Hons) in IT
                </button>
                <button
                  onClick={() => onSelectPathway('mit')}
                  className="px-5 py-2.5 border border-hairline hover:border-m-red text-white text-[10px] font-bold uppercase transition-colors cursor-pointer bg-surface-card"
                >
                  B.Sc. (Hons) in MIT
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-hairline bg-surface-soft p-8 text-center flex flex-col items-center gap-3 select-none">
              <Info className="w-8 h-8 text-m-blue-light" />
              <h3 className="font-bmw-display font-bold text-sm text-white uppercase tracking-wider">
                DEGREE PROGRAMME NOT SELECTED
              </h3>
              <p className="text-[11px] text-muted-text max-w-sm leading-relaxed">
                Please select B.Sc. Hons in IT or MIT in the Second Year block to view the Third
                Year course curriculum.
              </p>
            </div>
          )
        ) : year.year === 3 && currentPathway === 'mit' && specialization === 'undecided' ? (
          <div className="border border-hairline bg-surface-soft p-8 text-center flex flex-col items-center gap-4 select-none">
            <Info className="w-8 h-8 text-m-blue-light" />
            <h3 className="font-bmw-display font-bold text-sm text-white uppercase tracking-wider">
              YEAR 3 SPECIALIZATION NOT DECIDED
            </h3>
            <p className="text-[11px] text-muted-text max-w-md leading-relaxed">
              Please select your B.Sc. (Hons) in MIT Year 3 specialization to load the corresponding
              compulsory and optional courses.
            </p>
            <div className="flex gap-3 mt-2 flex-wrap justify-center font-mono">
              <button
                onClick={() => onSelectSpecialization('bse')}
                className="px-4 py-2 border border-hairline hover:border-m-blue-light text-white text-[10px] font-bold uppercase transition-colors cursor-pointer bg-surface-card"
              >
                Business Systems Engineering (BSE)
              </button>
              <button
                onClick={() => onSelectSpecialization('oscm')}
                className="px-4 py-2 border border-hairline hover:border-m-orange text-white text-[10px] font-bold uppercase transition-colors cursor-pointer bg-surface-card"
              >
                Operations & Supply Chain (OSCM)
              </button>
              <button
                onClick={() => onSelectSpecialization('is')}
                className="px-4 py-2 border border-hairline hover:border-m-blue-dark text-white text-[10px] font-bold uppercase transition-colors cursor-pointer bg-surface-card"
              >
                Information Systems (IS)
              </button>
            </div>
          </div>
        ) : null
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <SemesterCard
            semLabel="Semester 01"
            modules={year.sem1}
            grades={grades}
            onGradeChange={onGradeChange}
            getGradeBorderClass={getGradeBorderClass}
            bulletColor="bg-m-blue-light"
          />
          <SemesterCard
            semLabel="Semester 02"
            modules={year.sem2}
            grades={grades}
            onGradeChange={onGradeChange}
            getGradeBorderClass={getGradeBorderClass}
            bulletColor="bg-m-red"
          />
        </div>
      )}
    </div>
  );
}
