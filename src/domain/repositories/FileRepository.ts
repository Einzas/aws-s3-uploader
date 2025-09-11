import { FileEntity } from '../entities';
import { FileId } from '../value-objects';

export interface FileRepository {
  save(file: FileEntity): Promise<void>;
  findById(id: FileId): Promise<FileEntity | null>;
  findAll(): Promise<FileEntity[]>;
  findByStatus(status: string): Promise<FileEntity[]>;
  update(file: FileEntity): Promise<void>;
  delete(id: FileId): Promise<void>;
}
