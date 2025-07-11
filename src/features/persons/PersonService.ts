import { Person } from '../../models/Person';

const mockPersons: Person[] = [
  { id: 'p1', name: 'Shiva' },
  { id: 'p2', name: 'Anjali' },
  { id: 'p3', name: 'Dad' }
];

export const PersonService = {
  async getAll(): Promise<Person[]> {
    return mockPersons;
  }
};