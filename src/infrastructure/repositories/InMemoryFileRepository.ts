import { FileRepository } from '@domain/repositories';
import { FileEntity, FileStatus } from '@domain/entities';
import { FileId } from '@domain/value-objects';

// In-memory implementation for demonstration
// In production, this would be replaced with a database implementation
export class InMemoryFileRepository implements FileRepository {
  private files: Map<string, FileEntity> = new Map();

  async save(file: FileEntity): Promise<void> {
    this.files.set(file.getId().toString(), file);
  }

  async findById(id: FileId): Promise<FileEntity | null> {
    return this.files.get(id.toString()) || null;
  }

  async findAll(): Promise<FileEntity[]> {
    return Array.from(this.files.values());
  }

  async findByStatus(status: string): Promise<FileEntity[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.getStatus() === status
    );
  }

  async update(file: FileEntity): Promise<void> {
    if (!this.files.has(file.getId().toString())) {
      throw new Error(`File with ID ${file.getId().toString()} not found`);
    }
    this.files.set(file.getId().toString(), file);
  }

  async delete(id: FileId): Promise<void> {
    this.files.delete(id.toString());
  }
}
