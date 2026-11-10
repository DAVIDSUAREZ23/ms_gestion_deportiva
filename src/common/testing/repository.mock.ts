import { ObjectLiteral, Repository } from 'typeorm';

export type RepositoryMock<T extends ObjectLiteral> = jest.Mocked<
  Pick<Repository<T>, 'find' | 'findOne' | 'findOneBy' | 'existsBy' | 'save' | 'remove'>
>;

// Repositorio de TypeORM simulado para probar los servicios sin base de datos
export function createRepositoryMock<T extends ObjectLiteral>(): RepositoryMock<T> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    existsBy: jest.fn().mockResolvedValue(false),
    save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
    remove: jest.fn((entity) => Promise.resolve(entity)),
  } as unknown as RepositoryMock<T>;
}

// Convierte el mock al tipo que esperan los constructores de los servicios
export function asRepository<T extends ObjectLiteral>(mock: RepositoryMock<T>): Repository<T> {
  return mock as unknown as Repository<T>;
}
