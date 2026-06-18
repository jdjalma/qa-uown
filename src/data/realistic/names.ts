/**
 * Realistic person-name pools + generators.
 *
 * Names are ALPHA-ONLY (no digits/hyphens) — required by the UOWN application
 * name fields (see `buildTestData` note). Pools are common US given/family
 * names so generated applicants read as real people, not `TestFN<hash>`.
 */
import { pick } from './random.js';

export const FIRST_NAMES: readonly string[] = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Karen', 'Charles', 'Sarah', 'Christopher', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Sandra', 'Mark', 'Margaret', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna', 'Kenneth', 'Michelle',
  'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Edward', 'Deborah',
  'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Laura', 'Jeffrey', 'Sharon',
  'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy', 'Nicholas', 'Angela',
  // Expanded pool — broader, more diverse given/first names
  'Henry', 'Grace', 'Samuel', 'Olivia', 'Benjamin', 'Sophia', 'Lucas', 'Ava',
  'Ethan', 'Mia', 'Alexander', 'Charlotte', 'Owen', 'Harper', 'Caleb', 'Ella',
  'Carlos', 'Maria', 'Jose', 'Ana', 'Luis', 'Sofia', 'Miguel', 'Isabella',
  'Diego', 'Camila', 'Mateo', 'Valentina', 'Andre', 'Gabriela', 'Omar', 'Fatima',
  'Wei', 'Mei', 'Hiroshi', 'Yuki', 'Raj', 'Priya', 'Sanjay', 'Deepa',
  'Ivan', 'Olga', 'Kwame', 'Zara', 'Tariq', 'Leila', 'Marcus', 'Naomi',
  'Vincent', 'Diana', 'Felix', 'Renee', 'Hector', 'Bianca', 'Trevor', 'Simone',
];

export const LAST_NAMES: readonly string[] = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  // Expanded pool — broader, more diverse family names
  'Collins', 'Edwards', 'Stewart', 'Morris', 'Murphy', 'Cook', 'Rogers', 'Morgan',
  'Peterson', 'Cooper', 'Reed', 'Bailey', 'Bell', 'Kelly', 'Howard', 'Ward',
  'Cox', 'Richardson', 'Wood', 'Watson', 'Brooks', 'Bennett', 'Gray', 'James',
  'Reyes', 'Cruz', 'Ortiz', 'Gutierrez', 'Ramos', 'Castillo', 'Vargas', 'Mendoza',
  'Kim', 'Patel', 'Singh', 'Chen', 'Wang', 'Nakamura', 'Khan', 'Ali',
  'Murphy', 'Sullivan', "O'Brien", 'Kowalski', 'Schmidt', 'Mueller', 'Rossi', 'Ferrari',
  'Foster', 'Bryant', 'Russell', 'Griffin', 'Hayes', 'Myers', 'Ford', 'Hamilton',
];

export function randomFirstName(): string {
  return pick(FIRST_NAMES);
}

export function randomLastName(): string {
  return pick(LAST_NAMES);
}

export function randomFullName(): { firstName: string; lastName: string } {
  return { firstName: randomFirstName(), lastName: randomLastName() };
}
