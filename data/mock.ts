
import { TableRow, Column } from '../types';

export const COLUMNS: Column[] = [
  { id: 'name', label: 'Name', type: 'text', width: '220px' },
  { id: 'age', label: 'A...', type: 'number', width: '50px' },
  { id: 'birthday', label: 'Birthday', type: 'date', width: '100px' },
  { id: 'manager', label: 'Manager', type: 'person', width: '160px' },
  { id: 'company', label: 'Company', type: 'company', width: '180px' },
  { id: 'external', label: 'Spirit I...', type: 'boolean', width: '70px' },
  { id: 'country', label: 'Country', type: 'text', width: '100px' },
  { id: 'favSongs', label: 'Favourite Songs', type: 'text', width: '250px' },
  { id: 'favColor', label: 'Favourite Col...', type: 'color', width: '120px' },
  { id: 'files', label: 'Files', type: 'files', width: '80px' },
];

const MANAGERS = [
  { name: 'Lila', initials: 'L' },
  { name: 'Slaven', initials: 'S' },
  { name: 'Adrian', initials: 'A' },
  { name: 'Viktoriya', initials: 'V' },
  { name: 'Daniel', initials: 'D' },
];

const COMPANIES = [
  { name: 'Hintz, Schuppe...' },
  { name: 'Global Tech' },
  { name: 'Alpha Solutions' },
];

const COLORS = ['#FF424C', '#C218FF', '#0078BD', '#4ADE80'];
const SONGS = ['Nothing Compares 2...', 'Bohemian Rhapsody', 'Imagine', 'Purple Rain'];

export const generateMockRows = (count: number): TableRow[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${i}`,
    name: ['Ed Metz', 'Marit Bjørgen', 'Kirsty Coventry', 'Rudy Tremblay', 'Marlon Stolte', 'Navid', 'Adrian', 'Slaven'][i % 8],
    external: Math.random() > 0.5,
    age: 20 + Math.floor(Math.random() * 40),
    birthday: '22.02.1992',
    manager: MANAGERS[i % MANAGERS.length],
    company: COMPANIES[i % COMPANIES.length],
    country: ['Germany', 'Norway', 'Zimbabwe', 'Canada', 'Iran', 'Croatia'][i % 6],
    favSongs: SONGS[i % SONGS.length],
    favColor: COLORS[i % COLORS.length],
    files: ['pdf', 'doc', 'xls'],
  }));
};
