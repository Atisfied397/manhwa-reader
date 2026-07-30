import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const series = sqliteTable("series", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  altTitle: text("alt_title"),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  coverUrl: text("cover_url"),
  bannerUrl: text("banner_url"),
  status: text("status").default("ongoing"),
  rating: real("rating").default(0),
  year: integer("year"),
  author: text("author"),
  artist: text("artist"),
  source: text("source").default("nyx"),
  sortOrder: integer("sort_order").default(0),
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
  isHidden: integer("is_hidden", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const genres = sqliteTable("genres", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const seriesGenres = sqliteTable("series_genres", {
  seriesId: integer("series_id").references(() => series.id).notNull(),
  genreId: integer("genre_id").references(() => genres.id).notNull(),
});

export const chapters = sqliteTable("chapters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  seriesId: integer("series_id").references(() => series.id).notNull(),
  number: real("number").notNull(),
  title: text("title"),
  slug: text("slug").notNull(),
  pageCount: integer("page_count").default(0),
  sortOrder: integer("sort_order").default(0),
  isHidden: integer("is_hidden", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const chapterPages = sqliteTable("chapter_pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  pageNumber: integer("page_number").notNull(),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username"),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
  isPremium: integer("is_premium", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const readingHistory = sqliteTable("reading_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id).notNull(),
  seriesId: integer("series_id").references(() => series.id).notNull(),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  page: integer("page").default(1),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const bookmarks = sqliteTable("bookmarks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id).notNull(),
  seriesId: integer("series_id").references(() => series.id).notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});
