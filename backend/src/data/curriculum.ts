/**
 * Canonical Curriculum Data for Classes 1 to 12 across CBSE, ICSE, and State Boards
 * Includes official subjects, chapters, topics, and pre-generated high-yield flashcards.
 */

export interface CurriculumTopic {
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface CurriculumChapter {
  title: string;
  topics: CurriculumTopic[];
}

export interface CurriculumFlashcard {
  deckTitle: string;
  question: string;
  answer: string;
  keyConcept: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface CurriculumSubject {
  name: string;
  code?: string;
  color: string;
  icon: string;
  chapters: CurriculumChapter[];
  flashcards: CurriculumFlashcard[];
}

export interface CurriculumKey {
  gradeClass: string; // e.g. "Class 10", "Class 12"
  board: string;      // "CBSE", "ICSE", "State Board"
  stream?: string;    // "Science", "Commerce", "Arts" (for Class 11 & 12)
}

// -------------------------------------------------------------
// CLASS 11-12 SCIENCE (CBSE / ICSE / State Board)
// -------------------------------------------------------------
const physics12: CurriculumSubject = {
  name: 'Physics',
  code: 'PHY-12',
  color: '#38BDF8',
  icon: 'atom',
  chapters: [
    {
      title: 'Electrostatics & Electric Potential',
      topics: [
        { title: "Coulomb's Law & Principle of Superposition", difficulty: 'EASY' },
        { title: 'Electric Field Lines & Gauss Law Applications', difficulty: 'MEDIUM' },
        { title: 'Electric Potential due to Dipole & Equipotential Surfaces', difficulty: 'MEDIUM' },
        { title: 'Capacitance & Dielectrics Energy Stored', difficulty: 'HARD' },
      ],
    },
    {
      title: 'Current Electricity & Circuits',
      topics: [
        { title: "Drift Velocity & Ohm's Law Derivation", difficulty: 'EASY' },
        { title: "Kirchhoff's Laws & Wheatstone Bridge Analysis", difficulty: 'MEDIUM' },
        { title: 'Potentiometer & Meter Bridge Working Principles', difficulty: 'HARD' },
      ],
    },
    {
      title: 'Magnetism & Electromagnetic Induction',
      topics: [
        { title: 'Biot-Savart Law & Ampere Circuital Law', difficulty: 'MEDIUM' },
        { title: "Faraday's Laws & Lenz's Law of Induction", difficulty: 'MEDIUM' },
        { title: 'Self & Mutual Inductance Derivations', difficulty: 'HARD' },
        { title: 'Alternating Currents & LCR Resonance Circuits', difficulty: 'HARD' },
      ],
    },
    {
      title: 'Ray & Wave Optics',
      topics: [
        { title: "Total Internal Reflection & Lens Maker's Formula", difficulty: 'MEDIUM' },
        { title: "Huygens' Principle & Wavefront Reflection/Refraction", difficulty: 'MEDIUM' },
        { title: "Young's Double Slit Experiment (YDSE) Interference", difficulty: 'HARD' },
        { title: 'Single Slit Diffraction & Resolving Power', difficulty: 'HARD' },
      ],
    },
    {
      title: 'Modern Physics & Semiconductors',
      topics: [
        { title: "Photoelectric Effect & Einstein's Equation", difficulty: 'EASY' },
        { title: "Bohr's Atomic Model & Hydrogen Spectrum Series", difficulty: 'MEDIUM' },
        { title: 'Nuclear Binding Energy & Mass Defect', difficulty: 'MEDIUM' },
        { title: 'p-n Junction Diodes, Rectifiers & Logic Gates', difficulty: 'MEDIUM' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Physics Formula Mastery',
      question: "What is Gauss's Law in electrostatics?",
      answer: "The total electric flux through a closed Gaussian surface equals the net charge enclosed divided by permittivity (Φ = q_enclosed / ε₀).",
      keyConcept: "Gauss's Law",
      difficulty: 'MEDIUM',
    },
    {
      deckTitle: 'Physics Formula Mastery',
      question: "What is the condition for resonance in a series LCR circuit?",
      answer: "Inductive reactance equals capacitive reactance (X_L = X_C), yielding maximum current and resonant frequency f_0 = 1 / (2π√(LC)).",
      keyConcept: 'LCR Resonance',
      difficulty: 'HARD',
    },
    {
      deckTitle: 'Physics Formula Mastery',
      question: "State Einstein's photoelectric equation.",
      answer: "hν = Φ + (1/2)m(v_max)², where incident photon energy equals work function plus maximum kinetic energy of emitted photoelectrons.",
      keyConcept: 'Photoelectric Effect',
      difficulty: 'MEDIUM',
    },
    {
      deckTitle: 'Physics Formula Mastery',
      question: "What is the physical meaning of Lenz's Law?",
      answer: "The direction of an induced electromotive force opposes the change in magnetic flux that produces it (Law of Conservation of Energy).",
      keyConcept: "Lenz's Law",
      difficulty: 'EASY',
    },
  ],
};

const chemistry12: CurriculumSubject = {
  name: 'Chemistry',
  code: 'CHEM-12',
  color: '#A855F7',
  icon: 'flask-conical',
  chapters: [
    {
      title: 'Physical Chemistry: Solutions & Electrochemistry',
      topics: [
        { title: "Raoult's Law & Colligative Properties", difficulty: 'MEDIUM' },
        { title: 'Van t Hoff Factor & Abnormal Molar Mass', difficulty: 'HARD' },
        { title: 'Nernst Equation & Standard Electrode Potentials', difficulty: 'HARD' },
        { title: "Kohlrausch's Law & Conductance in Electrolytes", difficulty: 'MEDIUM' },
      ],
    },
    {
      title: 'Chemical Kinetics & Surface Chemistry',
      topics: [
        { title: 'Rate Laws, Order & Molecularity of Reactions', difficulty: 'EASY' },
        { title: 'Integrated Rate Equations for Zero & First Order', difficulty: 'MEDIUM' },
        { title: 'Arrhenius Equation & Activation Energy', difficulty: 'HARD' },
      ],
    },
    {
      title: 'Inorganic Chemistry: Coordination Compounds',
      topics: [
        { title: "Werner's Theory & IUPAC Nomenclature of Complexes", difficulty: 'EASY' },
        { title: 'Valence Bond Theory & Crystal Field Theory (CFT)', difficulty: 'HARD' },
        { title: 'Isomerism in Coordination Complexes', difficulty: 'MEDIUM' },
      ],
    },
    {
      title: 'Organic Chemistry: Functional Groups & Biomolecules',
      topics: [
        { title: 'Haloalkanes & Nucleophilic Substitution (SN1/SN2)', difficulty: 'MEDIUM' },
        { title: 'Alcohols, Phenols & Ether Synthesis Mechanisms', difficulty: 'MEDIUM' },
        { title: 'Aldehydes, Ketones & Carboxylic Acids Condensation', difficulty: 'HARD' },
        { title: 'Amines, Diazonium Salts & Coupling Reactions', difficulty: 'MEDIUM' },
        { title: 'Proteins, Carbohydrates & Nucleic Acid Structures', difficulty: 'EASY' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Chemistry High-Yield Flashcards',
      question: 'What is the Nernst Equation at 298 K?',
      answer: 'E_cell = E°_cell - (0.0591 / n) * log(Q), where Q is the reaction quotient and n is the number of transferred moles of electrons.',
      keyConcept: 'Nernst Equation',
      difficulty: 'HARD',
    },
    {
      deckTitle: 'Chemistry High-Yield Flashcards',
      question: 'What differentiates SN1 and SN2 reaction mechanisms?',
      answer: 'SN1 is a two-step unimolecular process via a carbocation intermediate causing racemization; SN2 is a one-step bimolecular concerted displacement with complete inversion of configuration (Walden inversion).',
      keyConcept: 'SN1 vs SN2 Mechanisms',
      difficulty: 'HARD',
    },
    {
      deckTitle: 'Chemistry High-Yield Flashcards',
      question: "State Raoult's Law for a solution of volatile liquids.",
      answer: "The partial vapor pressure of each component in the solution is directly proportional to its mole fraction in the liquid mixture (p_i = p°_i * x_i).",
      keyConcept: "Raoult's Law",
      difficulty: 'MEDIUM',
    },
  ],
};

const mathematics12: CurriculumSubject = {
  name: 'Mathematics',
  code: 'MATH-12',
  color: '#34D399',
  icon: 'calculator',
  chapters: [
    {
      title: 'Relations, Functions & Matrices',
      topics: [
        { title: 'Equivalence Relations & Bijective Functions', difficulty: 'EASY' },
        { title: 'Inverse Trigonometric Functions Properties', difficulty: 'MEDIUM' },
        { title: 'Matrix Algebra, Adjoint & Inverses', difficulty: 'MEDIUM' },
        { title: 'Determinants & Solutions of Linear Equations', difficulty: 'MEDIUM' },
      ],
    },
    {
      title: 'Calculus: Continuity & Differentiation',
      topics: [
        { title: 'Continuity & Differentiability Theorems', difficulty: 'MEDIUM' },
        { title: 'Chain Rule, Implicit & Parametric Derivatives', difficulty: 'EASY' },
        { title: 'Applications of Derivatives: Maxima, Minima & Tangents', difficulty: 'HARD' },
      ],
    },
    {
      title: 'Calculus: Integrals & Differential Equations',
      topics: [
        { title: 'Indefinite Integration Techniques & Partial Fractions', difficulty: 'MEDIUM' },
        { title: 'Definite Integrals & Fundamental Theorem of Calculus', difficulty: 'HARD' },
        { title: 'Area Under Curves (Bounded Regions)', difficulty: 'MEDIUM' },
        { title: 'Separation of Variables & Linear Differential Equations', difficulty: 'HARD' },
      ],
    },
    {
      title: 'Vectors, 3D Geometry & Probability',
      topics: [
        { title: 'Dot and Cross Products of Vectors', difficulty: 'EASY' },
        { title: 'Shortest Distance between Two Skew Lines in 3D', difficulty: 'HARD' },
        { title: 'Conditional Probability & Bayes Theorem', difficulty: 'HARD' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Math Essential Theorems',
      question: "What is Bayes' Theorem?",
      answer: "P(A|B) = [P(B|A) * P(A)] / P(B), computing conditional probability of an event given prior evidence and likelihood.",
      keyConcept: "Bayes' Theorem",
      difficulty: 'HARD',
    },
    {
      deckTitle: 'Math Essential Theorems',
      question: 'What is the condition for matrix invertibility?',
      answer: 'A square matrix A is invertible if and only if its determinant is non-zero (det(A) ≠ 0, i.e. A is non-singular). A⁻¹ = (1/det(A)) * adj(A).',
      keyConcept: 'Matrix Invertibility',
      difficulty: 'MEDIUM',
    },
    {
      deckTitle: 'Math Essential Theorems',
      question: 'How do you find the absolute maxima/minima of a continuous function on [a, b]?',
      answer: 'Find critical points where f\'(x) = 0 or undefined in (a, b). Evaluate f(x) at all critical points and boundary points a and b; compare values.',
      keyConcept: 'Extreme Value Analysis',
      difficulty: 'MEDIUM',
    },
  ],
};

const biology12: CurriculumSubject = {
  name: 'Biology',
  code: 'BIO-12',
  color: '#10B981',
  icon: 'dna',
  chapters: [
    {
      title: 'Reproduction & Development',
      topics: [
        { title: 'Sexual Reproduction in Flowering Plants', difficulty: 'MEDIUM' },
        { title: 'Human Reproductive Anatomy & Gametogenesis', difficulty: 'MEDIUM' },
        { title: 'Menstrual Cycle & Embryonic Development', difficulty: 'HARD' },
      ],
    },
    {
      title: 'Genetics & Evolution',
      topics: [
        { title: "Mendel's Laws of Inheritance & Dihybrid Cross", difficulty: 'EASY' },
        { title: 'DNA Structure, Replication & Transcription', difficulty: 'HARD' },
        { title: 'Translation & Lac Operon Regulation', difficulty: 'HARD' },
        { title: 'Hardy-Weinberg Principle & Natural Selection', difficulty: 'MEDIUM' },
      ],
    },
    {
      title: 'Biotechnology & Ecology',
      topics: [
        { title: 'Recombinant DNA Technology & Restriction Enzymes', difficulty: 'MEDIUM' },
        { title: 'Bt Cotton, Insulin Production & Gene Therapy', difficulty: 'MEDIUM' },
        { title: 'Ecosystem Energy Flow, Trophic Pyramids & Biodiversity', difficulty: 'EASY' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Biology High-Yield Concept Cards',
      question: 'Explain the central dogma of molecular biology.',
      answer: 'DNA directs its own replication and transcribes genetic instructions into mRNA, which is translated by ribosomes into functional polypeptides/proteins (DNA -> RNA -> Protein).',
      keyConcept: 'Central Dogma',
      difficulty: 'EASY',
    },
    {
      deckTitle: 'Biology High-Yield Concept Cards',
      question: 'What is the Hardy-Weinberg equilibrium equation?',
      answer: 'p² + 2pq + q² = 1 (where p and q are allele frequencies), valid in large randomly mating populations with no mutation, migration, or selection.',
      keyConcept: 'Hardy-Weinberg Principle',
      difficulty: 'MEDIUM',
    },
  ],
};

// -------------------------------------------------------------
// CLASS 11-12 COMMERCE
// -------------------------------------------------------------
const accountancy12: CurriculumSubject = {
  name: 'Accountancy',
  code: 'ACC-12',
  color: '#F59E0B',
  icon: 'receipt',
  chapters: [
    {
      title: 'Accounting for Partnership Firms',
      topics: [
        { title: 'Profit & Loss Appropriation & Capital Accounts', difficulty: 'EASY' },
        { title: 'Goodwill Valuation: Average, Super Profit & Capitalization', difficulty: 'MEDIUM' },
        { title: 'Admission, Retirement & Death of a Partner', difficulty: 'HARD' },
        { title: 'Dissolution of Partnership Firm & Realisation Account', difficulty: 'HARD' },
      ],
    },
    {
      title: 'Company Accounts & Financial Statements',
      topics: [
        { title: 'Issue, Forfeiture & Reissue of Shares', difficulty: 'HARD' },
        { title: 'Issue & Redemption of Debentures', difficulty: 'MEDIUM' },
        { title: 'Financial Statement Analysis: Ratio Analysis', difficulty: 'MEDIUM' },
        { title: 'Cash Flow Statement (AS-3 Direct & Indirect Methods)', difficulty: 'HARD' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Accountancy Core Principles',
      question: 'What is the accounting treatment for forfeiture of shares?',
      answer: 'Debit Share Capital with the called-up amount; Credit Share Forfeiture with the amount received; Credit unpaid calls accounts.',
      keyConcept: 'Share Forfeiture',
      difficulty: 'HARD',
    },
    {
      deckTitle: 'Accountancy Core Principles',
      question: 'What are the three categories of cash flows in AS-3?',
      answer: 'Operating Activities (core revenue), Investing Activities (acquisition/disposal of long-term assets), and Financing Activities (capital and borrowing changes).',
      keyConcept: 'Cash Flow Categories',
      difficulty: 'MEDIUM',
    },
  ],
};

const businessStudies12: CurriculumSubject = {
  name: 'Business Studies',
  code: 'BST-12',
  color: '#EC4899',
  icon: 'briefcase',
  chapters: [
    {
      title: 'Principles & Functions of Management',
      topics: [
        { title: "Fayol's 14 Principles & Taylor's Scientific Management", difficulty: 'EASY' },
        { title: 'Planning & Decision-Making Steps', difficulty: 'MEDIUM' },
        { title: 'Organizing: Formal, Informal & Delegation Authority', difficulty: 'MEDIUM' },
        { title: 'Staffing, Directing & Leadership Styles', difficulty: 'MEDIUM' },
        { title: 'Controlling: Techniques & Relationship with Planning', difficulty: 'EASY' },
      ],
    },
    {
      title: 'Financial & Marketing Management',
      topics: [
        { title: 'Financial Management: Working Capital Decisions', difficulty: 'HARD' },
        { title: 'Financial Markets: Money Market vs Capital Market', difficulty: 'MEDIUM' },
        { title: 'Marketing Mix: 4 Ps (Product, Price, Place, Promotion)', difficulty: 'EASY' },
        { title: 'Consumer Protection Act 2019: Rights & Redressal', difficulty: 'EASY' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Business Management Flashcards',
      question: "Distinguish between delegation and decentralization.",
      answer: "Delegation is a downward transfer of authority from a superior to an immediate subordinate; decentralization is an organization-wide systematic dispersal of authority across all management levels.",
      keyConcept: 'Delegation vs Decentralization',
      difficulty: 'MEDIUM',
    },
  ],
};

const economics12: CurriculumSubject = {
  name: 'Economics',
  code: 'ECO-12',
  color: '#6366F1',
  icon: 'trending-up',
  chapters: [
    {
      title: 'Macroeconomics: National Income & Money',
      topics: [
        { title: 'Circular Flow of Income & National Income Aggregates', difficulty: 'MEDIUM' },
        { title: 'Measurement Methods: Value Added, Income & Expenditure', difficulty: 'HARD' },
        { title: 'Central Bank (RBI) Quantitative & Qualitative Credit Controls', difficulty: 'MEDIUM' },
        { title: 'Determination of Income & Employment (Keynesian Model)', difficulty: 'HARD' },
      ],
    },
    {
      title: 'Indian Economic Development',
      topics: [
        { title: 'Indian Economy on the Eve of Independence & 1991 LPG Reforms', difficulty: 'EASY' },
        { title: 'Human Capital Formation & Rural Credit in India', difficulty: 'MEDIUM' },
        { title: 'Sustainable Development & Comparative Study (India, China, Pak)', difficulty: 'EASY' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Economics Concept Cards',
      question: 'What is the Marginal Propensity to Consume (MPC)?',
      answer: 'MPC = ΔC / ΔY, representing the fraction of an incremental change in income that is spent on consumption. It determines the investment multiplier k = 1 / (1 - MPC).',
      keyConcept: 'Investment Multiplier',
      difficulty: 'HARD',
    },
  ],
};

// -------------------------------------------------------------
// CLASS 11-12 ARTS / HUMANITIES
// -------------------------------------------------------------
const history12: CurriculumSubject = {
  name: 'History',
  code: 'HIST-12',
  color: '#D97706',
  icon: 'landmark',
  chapters: [
    {
      title: 'Ancient & Medieval India',
      topics: [
        { title: 'Harappan Civilization: Urban Planning & Drainage', difficulty: 'EASY' },
        { title: 'Early States & Economies (c. 600 BCE - 600 CE)', difficulty: 'MEDIUM' },
        { title: 'Bhakti-Sufi Traditions & Architectural Changes', difficulty: 'MEDIUM' },
        { title: 'Vijayanagara Empire: Capital & Royal Center', difficulty: 'MEDIUM' },
      ],
    },
    {
      title: 'Modern India & National Movement',
      topics: [
        { title: 'Colonialism & Countryside: Permanent Settlement', difficulty: 'MEDIUM' },
        { title: 'Revolt of 1857: Causes, Centers & Consequences', difficulty: 'EASY' },
        { title: 'Mahatma Gandhi & the Nationalist Movement', difficulty: 'MEDIUM' },
        { title: 'Framing the Constitution: Key Debates in Constituent Assembly', difficulty: 'HARD' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'History High-Yield Cards',
      question: 'What was the distinctive architectural feature of Harappan citadels?',
      answer: 'Elevated mud-brick platforms separating civic/defensive structures (like the Great Bath and Granary) from the lower town residential quarters.',
      keyConcept: 'Harappan Urban Planning',
      difficulty: 'EASY',
    },
  ],
};

const politicalScience12: CurriculumSubject = {
  name: 'Political Science',
  code: 'POL-12',
  color: '#8B5CF6',
  icon: 'scale',
  chapters: [
    {
      title: 'Contemporary World Politics',
      topics: [
        { title: 'Cold War Era & Bipolarity Collapse', difficulty: 'EASY' },
        { title: 'New Centers of Power: EU, ASEAN & BRICS', difficulty: 'MEDIUM' },
        { title: 'United Nations & Global Security Challenges', difficulty: 'MEDIUM' },
        { title: 'Globalization: Cultural, Economic & Political Impacts', difficulty: 'EASY' },
      ],
    },
    {
      title: 'Politics in India Since Independence',
      topics: [
        { title: 'Challenges of Nation Building & Princely States Integration', difficulty: 'MEDIUM' },
        { title: 'Era of One-Party Dominance & Five-Year Planning', difficulty: 'MEDIUM' },
        { title: 'The Emergency (1975) & Democratic Resurgence', difficulty: 'HARD' },
        { title: 'Recent Developments: Coalition Eras & Mandal Politics', difficulty: 'HARD' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Political Science Flashcards',
      question: 'What were the three key challenges facing India immediately after 1947 independence?',
      answer: '1. National unity and integration of 565 princely states; 2. Establishing and sustaining constitutional democracy; 3. Ensuring socio-economic development and poverty alleviation.',
      keyConcept: 'Nation Building Challenges',
      difficulty: 'MEDIUM',
    },
  ],
};

// -------------------------------------------------------------
// CLASS 9-10 SECONDARY (CBSE / ICSE / State Board)
// -------------------------------------------------------------
const math10: CurriculumSubject = {
  name: 'Mathematics',
  code: 'MATH-10',
  color: '#34D399',
  icon: 'calculator',
  chapters: [
    {
      title: 'Number Systems & Algebra',
      topics: [
        { title: 'Real Numbers & Fundamental Theorem of Arithmetic', difficulty: 'EASY' },
        { title: 'Polynomials & Zeros Relationship', difficulty: 'MEDIUM' },
        { title: 'Pair of Linear Equations in Two Variables', difficulty: 'MEDIUM' },
        { title: 'Quadratic Equations & Discriminant Nature of Roots', difficulty: 'MEDIUM' },
        { title: 'Arithmetic Progressions (AP) nth Term & Sum', difficulty: 'MEDIUM' },
      ],
    },
    {
      title: 'Geometry & Trigonometry',
      topics: [
        { title: 'Similar Triangles & Basic Proportionality Theorem (BPT)', difficulty: 'HARD' },
        { title: 'Coordinate Geometry: Distance & Section Formula', difficulty: 'EASY' },
        { title: 'Introduction to Trigonometry & Standard Identities', difficulty: 'MEDIUM' },
        { title: 'Heights & Distances: Angles of Elevation and Depression', difficulty: 'HARD' },
        { title: 'Circles: Tangents & Length from External Point', difficulty: 'MEDIUM' },
      ],
    },
    {
      title: 'Mensuration, Statistics & Probability',
      topics: [
        { title: 'Surface Areas & Volumes of Combinations of Solids', difficulty: 'HARD' },
        { title: 'Mean, Median, Mode of Grouped Data', difficulty: 'EASY' },
        { title: 'Classical Probability & Compound Events', difficulty: 'EASY' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Class 10 Math Essentials',
      question: 'What is the quadratic formula to solve ax² + bx + c = 0?',
      answer: 'x = [-b ± √(b² - 4ac)] / (2a). The discriminant D = b² - 4ac determines real distinct (D > 0), real equal (D = 0), or complex roots (D < 0).',
      keyConcept: 'Quadratic Formula & Discriminant',
      difficulty: 'EASY',
    },
    {
      deckTitle: 'Class 10 Math Essentials',
      question: 'State the Basic Proportionality Theorem (Thales Theorem).',
      answer: 'If a line is drawn parallel to one side of a triangle intersecting the other two sides, then it divides the two sides in the same ratio.',
      keyConcept: 'BPT (Thales Theorem)',
      difficulty: 'MEDIUM',
    },
  ],
};

const science10: CurriculumSubject = {
  name: 'Science',
  code: 'SCI-10',
  color: '#38BDF8',
  icon: 'microscope',
  chapters: [
    {
      title: 'Chemical Reactions, Acids & Metals',
      topics: [
        { title: 'Types of Chemical Reactions: Redox, Precipitation, Neutralization', difficulty: 'EASY' },
        { title: 'Acids, Bases, pH Scale & Salts (Plaster of Paris, Bleaching Powder)', difficulty: 'MEDIUM' },
        { title: 'Metals, Non-metals, Reactivity Series & Corrosion', difficulty: 'MEDIUM' },
        { title: 'Carbon & Its Compounds: Covalent Bonding, Homologous Series', difficulty: 'HARD' },
      ],
    },
    {
      title: 'Life Processes & Control in Biology',
      topics: [
        { title: 'Photosynthesis & Human Digestive System', difficulty: 'MEDIUM' },
        { title: 'Respiration: Aerobic vs Anaerobic Pathways', difficulty: 'EASY' },
        { title: 'Double Circulation in Human Heart & Nephron Excretion', difficulty: 'HARD' },
        { title: 'Neurons, Reflex Arc & Plant Hormones (Auxin, Gibberellin)', difficulty: 'MEDIUM' },
        { title: 'Mendelian Monohybrid & Dihybrid Crosses', difficulty: 'MEDIUM' },
      ],
    },
    {
      title: 'Light, Electricity & Magnetism in Physics',
      topics: [
        { title: 'Reflection, Refraction, Snell’s Law & Lens Formula', difficulty: 'MEDIUM' },
        { title: 'Human Eye Defects: Myopia, Hypermetropia & Corrections', difficulty: 'EASY' },
        { title: "Ohm's Law, Series-Parallel Resistors & Joule's Heating", difficulty: 'MEDIUM' },
        { title: "Magnetic Field Lines, Right Hand Thumb Rule & Solenoid", difficulty: 'MEDIUM' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Class 10 Science Core Concepts',
      question: "What is Ohm's Law and its mathematical formula?",
      answer: "The electric current flowing through a conductor is directly proportional to the potential difference across its ends, provided temperature remains constant (V = IR).",
      keyConcept: "Ohm's Law",
      difficulty: 'EASY',
    },
    {
      deckTitle: 'Class 10 Science Core Concepts',
      question: 'Explain why carbon forms covalent bonds instead of C4+ or C4- ions.',
      answer: 'Carbon cannot gain 4 electrons to form C4- because a nucleus with 6 protons cannot hold 10 electrons; it cannot lose 4 electrons to form C4+ due to immense ionization energy required. It shares electrons instead.',
      keyConcept: 'Covalent Bonding of Carbon',
      difficulty: 'HARD',
    },
    {
      deckTitle: 'Class 10 Science Core Concepts',
      question: 'What is the function of the nephron in the human kidney?',
      answer: 'Nephrons filter blood in the glomerulus under pressure (ultrafiltration), selectively reabsorb useful substances (glucose, amino acids, salts, water), and excrete concentrated urea as urine.',
      keyConcept: 'Nephron Excretory Function',
      difficulty: 'MEDIUM',
    },
  ],
};

const socialScience10: CurriculumSubject = {
  name: 'Social Science',
  code: 'SST-10',
  color: '#E11D48',
  icon: 'globe',
  chapters: [
    {
      title: 'History: Nationalism in Europe & India',
      topics: [
        { title: 'Rise of Nationalism in Europe & Unification of Italy and Germany', difficulty: 'MEDIUM' },
        { title: 'Non-Cooperation & Civil Disobedience Movement in India', difficulty: 'MEDIUM' },
      ],
    },
    {
      title: 'Geography: Resources & Agriculture',
      topics: [
        { title: 'Resource Planning, Soil Types & Land Degradation', difficulty: 'EASY' },
        { title: 'Water Resources & Multipurpose River Projects', difficulty: 'EASY' },
        { title: 'Major Cropping Seasons & Farming Types in India', difficulty: 'MEDIUM' },
      ],
    },
    {
      title: 'Civics & Economics: Power Sharing & Development',
      topics: [
        { title: 'Power Sharing in Belgium and Sri Lanka', difficulty: 'EASY' },
        { title: 'Federalism: Union, State and Concurrent Lists', difficulty: 'MEDIUM' },
        { title: 'Sectors of Indian Economy (Primary, Secondary, Tertiary)', difficulty: 'EASY' },
        { title: 'Money and Credit: Formal vs Informal Sources', difficulty: 'MEDIUM' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Class 10 SST Key Takeaways',
      question: 'Why was the Non-Cooperation Movement withdrawn by Mahatma Gandhi in 1922?',
      answer: 'Following the Chauri Chaura incident in Uttar Pradesh where a violent crowd burned down a police station killing 22 policemen, Gandhi felt satyagrahis needed proper non-violent training.',
      keyConcept: 'Chauri Chaura Incident',
      difficulty: 'EASY',
    },
  ],
};

// -------------------------------------------------------------
// CLASSES 6-8 (Middle School)
// -------------------------------------------------------------
const middleSchoolMath: CurriculumSubject = {
  name: 'Mathematics',
  code: 'MATH-MID',
  color: '#34D399',
  icon: 'calculator',
  chapters: [
    {
      title: 'Numbers & Algebra',
      topics: [
        { title: 'Integers, Fractions & Rational Numbers Operations', difficulty: 'EASY' },
        { title: 'Algebraic Expressions, Identities & Linear Equations', difficulty: 'MEDIUM' },
        { title: 'Exponents, Powers & Scientific Notation', difficulty: 'EASY' },
      ],
    },
    {
      title: 'Geometry & Mensuration',
      topics: [
        { title: 'Lines, Angles & Triangle Angle Sum Property', difficulty: 'EASY' },
        { title: 'Congruence of Triangles (SSS, SAS, ASA, RHS)', difficulty: 'MEDIUM' },
        { title: 'Perimeter and Area of Quadrilaterals & Circles', difficulty: 'MEDIUM' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Middle School Math Cards',
      question: 'What is the sum of angles of a triangle?',
      answer: 'The sum of the interior angles of any triangle is always 180 degrees.',
      keyConcept: 'Angle Sum Property',
      difficulty: 'EASY',
    },
  ],
};

const middleSchoolScience: CurriculumSubject = {
  name: 'Science',
  code: 'SCI-MID',
  color: '#38BDF8',
  icon: 'atom',
  chapters: [
    {
      title: 'Physics & Motion',
      topics: [
        { title: 'Measurement of Distance, Speed & Time', difficulty: 'EASY' },
        { title: 'Light: Shadows, Reflection & Plane Mirrors', difficulty: 'EASY' },
        { title: 'Electric Current and Simple Circuits', difficulty: 'MEDIUM' },
      ],
    },
    {
      title: 'Living World & Nature',
      topics: [
        { title: 'Plant Structure: Roots, Stem, Leaves & Flowers', difficulty: 'EASY' },
        { title: 'Cell Structure: Plant vs Animal Cells', difficulty: 'MEDIUM' },
        { title: 'Nutrition and Digestion in Organisms', difficulty: 'EASY' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Middle School Science Cards',
      question: 'What is the function of chlorophyll in green leaves?',
      answer: 'Chlorophyll traps sunlight energy to convert carbon dioxide and water into glucose during photosynthesis, releasing oxygen as a byproduct.',
      keyConcept: 'Chlorophyll in Photosynthesis',
      difficulty: 'EASY',
    },
  ],
};

// -------------------------------------------------------------
// CLASSES 1-5 (Primary School)
// -------------------------------------------------------------
const primaryEVS: CurriculumSubject = {
  name: 'Environmental Studies (EVS)',
  code: 'EVS-PRI',
  color: '#10B981',
  icon: 'leaf',
  chapters: [
    {
      title: 'Nature & Living Things',
      topics: [
        { title: 'Plants around Us: Trees, Shrubs & Herbs', difficulty: 'EASY' },
        { title: 'Animals and their Habitats', difficulty: 'EASY' },
        { title: 'Water Cycle, Rain & Clean Environment', difficulty: 'EASY' },
      ],
    },
    {
      title: 'Our Body & Community',
      topics: [
        { title: 'Sense Organs and Healthy Habits', difficulty: 'EASY' },
        { title: 'Our Family and Helpful Community Workers', difficulty: 'EASY' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Primary Learning Cards',
      question: 'What are the five human sense organs?',
      answer: 'Eyes (sight), Ears (hearing), Nose (smell), Tongue (taste), and Skin (touch).',
      keyConcept: 'Five Senses',
      difficulty: 'EASY',
    },
  ],
};

const primaryMath: CurriculumSubject = {
  name: 'Mathematics',
  code: 'MATH-PRI',
  color: '#F59E0B',
  icon: 'shapes',
  chapters: [
    {
      title: 'Numbers & Basic Operations',
      topics: [
        { title: 'Counting, Place Values & Comparison', difficulty: 'EASY' },
        { title: 'Addition and Subtraction of Whole Numbers', difficulty: 'EASY' },
        { title: 'Multiplication Tables and Division Sharing', difficulty: 'MEDIUM' },
      ],
    },
    {
      title: 'Shapes, Measurement & Time',
      topics: [
        { title: '2D Shapes: Circles, Squares, Rectangles, Triangles', difficulty: 'EASY' },
        { title: 'Reading Clocks, Days of the Week & Money Counting', difficulty: 'EASY' },
      ],
    },
  ],
  flashcards: [
    {
      deckTitle: 'Primary Math Basics',
      question: 'How many sides and corners does a rectangle have?',
      answer: 'A rectangle has 4 straight sides and 4 corners. Opposite sides are equal in length.',
      keyConcept: 'Properties of a Rectangle',
      difficulty: 'EASY',
    },
  ],
};

/**
 * Resolver function: Returns curated subject list & flashcards matching exact class, board, and stream
 */
export function getCurriculumForProfile(key: CurriculumKey): CurriculumSubject[] {
  const grade = key.gradeClass.toLowerCase();

  // 1. Senior Secondary (Class 11 or Class 12)
  if (grade.includes('11') || grade.includes('12')) {
    const stream = (key.stream || 'science').toLowerCase();
    if (stream.includes('comm')) {
      return [accountancy12, businessStudies12, economics12, mathematics12];
    }
    if (stream.includes('art') || stream.includes('human')) {
      return [history12, politicalScience12, economics12];
    }
    // Default: Science (PCM / PCB)
    return [physics12, chemistry12, mathematics12, biology12];
  }

  // 2. Secondary (Class 9 or Class 10)
  if (grade.includes('9') || grade.includes('10')) {
    return [math10, science10, socialScience10];
  }

  // 3. Middle School (Class 6, 7, 8)
  if (grade.includes('6') || grade.includes('7') || grade.includes('8')) {
    return [middleSchoolMath, middleSchoolScience];
  }

  // 4. Primary (Class 1 to 5)
  return [primaryMath, primaryEVS];
}
