import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import YearSection from '../../src/components/YearSection';
import Navbar from '../../src/components/Navbar';
import MobileSelectorPanel from '../../src/components/MobileSelectorPanel';
import WelcomeModal from '../../src/components/WelcomeModal';

const emptyYear = (year) => ({
  year,
  name: `Year ${year}`,
  modules: [],
  sem1: [],
  sem2: [],
  gpa: 0,
  hasGrades: false,
  atRisk: false,
  hasOptional: false,
  gradedCredits: 0,
  compulsoryCredits: 0,
  totalCredits: 0,
});

describe('YearSection — the selectors shown in place of a locked year', () => {
  it('offers both degrees on Year 2 while the pathway is undecided', async () => {
    const onSelectPathway = vi.fn();
    render(
      <YearSection
        year={emptyYear(2)}
        grades={{}}
        onGradeChange={vi.fn()}
        currentPathway="undecided"
        specialization="undecided"
        onSelectPathway={onSelectPathway}
        onSelectSpecialization={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /in IT/i }));
    expect(onSelectPathway).toHaveBeenCalledWith('it');

    await userEvent.click(screen.getByRole('button', { name: /in MIT/i }));
    expect(onSelectPathway).toHaveBeenCalledWith('mit');
  });

  it('offers each specialization on Year 3 for an MIT student', async () => {
    const onSelectSpecialization = vi.fn();
    render(
      <YearSection
        year={emptyYear(3)}
        grades={{}}
        onGradeChange={vi.fn()}
        currentPathway="mit"
        specialization="undecided"
        onSelectPathway={vi.fn()}
        onSelectSpecialization={onSelectSpecialization}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /business systems engineering/i }));
    await userEvent.click(screen.getByRole('button', { name: /operations & supply chain/i }));
    await userEvent.click(screen.getByRole('button', { name: /information systems \(IS\)/i }));

    expect(onSelectSpecialization).toHaveBeenNthCalledWith(1, 'bse');
    expect(onSelectSpecialization).toHaveBeenNthCalledWith(2, 'oscm');
    expect(onSelectSpecialization).toHaveBeenNthCalledWith(3, 'is');
  });
});

describe('Navbar selectors', () => {
  const setup = (pathway = 'mit') => {
    const setPathway = vi.fn();
    const setSpecialization = vi.fn();
    const triggerToast = vi.fn();
    render(
      <Navbar
        cgpa={3.2}
        hasGradedCredits
        pathway={pathway}
        setPathway={setPathway}
        specialization="bse"
        setSpecialization={setSpecialization}
        gradedModulesCount={1}
        activeCompulsoryCount={2}
        totalModulesCount={3}
        gradedCredits={3}
        activeCompulsoryCredits={6}
        totalCreditsCount={9}
        onProfileClick={vi.fn()}
        profileName="Amara"
        triggerToast={triggerToast}
        showInstallBtn
        onInstallClick={vi.fn()}
        onCgpaClick={vi.fn()}
      />
    );
    return { setPathway, setSpecialization, triggerToast };
  };

  it('changes the degree and announces it', async () => {
    const { setPathway, triggerToast } = setup();
    await userEvent.selectOptions(screen.getByLabelText(/select degree programme/i), 'it');

    expect(setPathway).toHaveBeenCalledWith('it');
    expect(triggerToast).toHaveBeenCalledWith(expect.stringMatching(/DEGREE: IT/));
  });

  it('changes the specialization, which only MIT offers', async () => {
    const { setSpecialization } = setup();
    await userEvent.selectOptions(screen.getByLabelText(/select mit specialization/i), 'is');

    expect(setSpecialization).toHaveBeenCalledWith('is');
  });

  it('hides the specialization selector for an IT student', () => {
    setup('it');
    expect(screen.queryByLabelText(/select mit specialization/i)).not.toBeInTheDocument();
  });
});

describe('MobileSelectorPanel selectors', () => {
  const setup = () => {
    const setPathway = vi.fn();
    const setSpecialization = vi.fn();
    render(
      <MobileSelectorPanel
        pathway="mit"
        setPathway={setPathway}
        specialization="bse"
        setSpecialization={setSpecialization}
        profileName="Amara"
        onProfileClick={vi.fn()}
        triggerToast={vi.fn()}
      />
    );
    return { setPathway, setSpecialization };
  };

  it('changes the degree', async () => {
    const { setPathway } = setup();
    await userEvent.selectOptions(screen.getByLabelText(/select degree programme/i), 'it');
    expect(setPathway).toHaveBeenCalledWith('it');
  });

  it('changes the specialization', async () => {
    const { setSpecialization } = setup();
    await userEvent.selectOptions(screen.getByLabelText(/select mit specialization/i), 'oscm');
    expect(setSpecialization).toHaveBeenCalledWith('oscm');
  });
});

describe('WelcomeModal — the remaining choices', () => {
  const setup = (step) => {
    const onSelectPathway = vi.fn();
    const onSelectSpecialization = vi.fn();
    const setModalStep = vi.fn();
    render(
      <WelcomeModal
        isOpen
        modalStep={step}
        setModalStep={setModalStep}
        onSelectPathway={onSelectPathway}
        onSelectSpecialization={onSelectSpecialization}
      />
    );
    return { onSelectPathway, onSelectSpecialization, setModalStep };
  };

  it('lets a student defer the degree choice', async () => {
    const { onSelectPathway } = setup(1);
    await userEvent.click(screen.getByText(/^NOT DECIDED YET$/).closest('button'));

    expect(onSelectPathway).toHaveBeenCalledWith('undecided');
  });

  it('offers OSCM, IS and deferring on the specialization step', async () => {
    const { onSelectSpecialization } = setup(2);

    await userEvent.click(screen.getByText(/^OSCM$/).closest('button'));
    await userEvent.click(screen.getByText(/^IS$/).closest('button'));
    await userEvent.click(screen.getByText(/^NOT DECIDED YET$/).closest('button'));

    expect(onSelectSpecialization).toHaveBeenNthCalledWith(1, 'oscm');
    expect(onSelectSpecialization).toHaveBeenNthCalledWith(2, 'is');
    expect(onSelectSpecialization).toHaveBeenNthCalledWith(3, 'undecided');
  });

  it('goes back to the degree step', async () => {
    const { setModalStep } = setup(2);
    await userEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(setModalStep).toHaveBeenCalledWith(1);
  });
});
