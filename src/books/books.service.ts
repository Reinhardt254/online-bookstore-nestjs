import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, ilike, or } from 'drizzle-orm';
import { Database, DATABASE_CONNECTION } from '../database/database.module';
import { books, Book, NewBook } from '../database/schema';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    const newBook: NewBook = {
      ...createBookDto,
      price: createBookDto.price.toString(),
      publishedDate: createBookDto.publishedDate
        ? new Date(createBookDto.publishedDate)
        : null,
    };

    const [book] = await this.db.insert(books).values(newBook).returning();
    return book;
  }

  async findAll(): Promise<Book[]> {
    return await this.db.select().from(books);
  }

  async findOne(id: number): Promise<Book> {
    const [book] = await this.db.select().from(books).where(eq(books.id, id));

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async update(id: number, updateBookDto: UpdateBookDto): Promise<Book> {
    const updateData: any = {
      ...updateBookDto,
      updatedAt: new Date(),
    };

    if (updateBookDto.price) {
      updateData.price = updateBookDto.price.toString();
    }

    if (updateBookDto.publishedDate) {
      updateData.publishedDate = new Date(updateBookDto.publishedDate);
    }

    const [updatedBook] = await this.db
      .update(books)
      .set(updateData)
      .where(eq(books.id, id))
      .returning();

    if (!updatedBook) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return updatedBook;
  }

  async remove(id: number): Promise<void> {
    const result = await this.db
      .delete(books)
      .where(eq(books.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
  }

  async findByCategory(category: string): Promise<Book[]> {
    return await this.db
      .select()
      .from(books)
      .where(eq(books.category, category));
  }

  async findByAuthor(author: string): Promise<Book[]> {
    return await this.db
      .select()
      .from(books)
      .where(ilike(books.author, `%${author}%`));
  }

  async search(query: string): Promise<Book[]> {
    return await this.db
      .select()
      .from(books)
      .where(
        or(
          ilike(books.title, `%${query}%`),
          ilike(books.author, `%${query}%`),
          ilike(books.description, `%${query}%`),
        ),
      );
  }

  async findByIsbn(isbn: string): Promise<Book> {
    const [book] = await this.db
      .select()
      .from(books)
      .where(eq(books.isbn, isbn));

    if (!book) {
      throw new NotFoundException(`Book with ISBN ${isbn} not found`);
    }

    return book;
  }

  async updateStock(id: number, quantity: number): Promise<Book> {
    const [updatedBook] = await this.db
      .update(books)
      .set({
        stock: quantity,
        updatedAt: new Date(),
      })
      .where(eq(books.id, id))
      .returning();

    if (!updatedBook) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return updatedBook;
  }
}
