import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma.js";
import { countWords } from "./lib/text.js";

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const author = await prisma.user.upsert({
    where: { email: "nova@wordvrs.dev" },
    create: {
      email: "nova@wordvrs.dev",
      passwordHash,
      username: "nova_quill",
      displayName: "Nova Quill",
      bio: "Writing cosmic fantasy under the stars.",
      isAuthor: true,
    },
    update: {},
  });

  const reader = await prisma.user.upsert({
    where: { email: "reader@wordvrs.dev" },
    create: {
      email: "reader@wordvrs.dev",
      passwordHash,
      username: "star_reader",
      displayName: "Star Reader",
    },
    update: {},
  });

  const book = await prisma.book.upsert({
    where: { slug: "the-nebula-heir" },
    create: {
      authorId: author.id,
      title: "The Nebula Heir",
      slug: "the-nebula-heir",
      description: "A dethroned star-princess must reclaim her constellation before it burns out forever.",
      genre: "Fantasy",
      tags: ["space opera", "found family"],
      mode: "NOVEL",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      publishedAt: new Date(),
    },
    update: {},
  });

  const chapterOne = { title: "Chapter 1: Ashfall", content: "<p>The sky over Veyra split in two, and Kira felt the old crown burn cold against her ribs.</p>".repeat(3) };
  await prisma.chapter.upsert({
    where: { id: "seed-chapter-1" },
    create: {
      id: "seed-chapter-1",
      bookId: book.id,
      title: chapterOne.title,
      content: chapterOne.content,
      order: 0,
      status: "PUBLISHED",
      wordCount: countWords(chapterOne.content),
    },
    update: {},
  });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: reader.id, followingId: author.id } },
    create: { followerId: reader.id, followingId: author.id },
    update: {},
  });

  console.log("Seeded WordVrs demo data:");
  console.log(`  Writer login: nova@wordvrs.dev / password123`);
  console.log(`  Reader login: reader@wordvrs.dev / password123`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
